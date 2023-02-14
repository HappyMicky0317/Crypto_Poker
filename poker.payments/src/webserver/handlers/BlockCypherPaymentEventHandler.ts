import { PaymentStatus } from './../../../../poker.ui/src/shared/PaymentStatus';
import { PaymentProcessorMessage } from './../../processor/PaymentProcessorMessage';
import { IBlockCypherService } from './../../services/IBlockCypherService';
import { ISecureDataRepository } from './../../repository/ISecureDataRepository';
import { BlockCypherPaymentEvent } from "../../../../poker.engine/src/admin/model/outgoing/BlockCypherPaymentEvent";
import { BlockCypherTx } from "../../../../poker.engine/src/model/blockcypher/blockcypher-tx";
import { AddressInfo } from '../../model/AddressInfo';
import { Logger, getLogger } from "log4js";
import { IncomingPaymentEvent } from '../../model/incoming-payment-event';
import { SharedHelpers } from '../../../../poker.engine/src/shared-helpers';
import { AccountService } from '../../services/AccountService';
import { EventHookResult, EventHook } from '../../model/EventHook';
import { PaymentProcessor } from '../../processor/PaymentProcessor';
const logger: Logger = getLogger();

export class BlockCypherPaymentEventHandler {

    constructor(private dataRepository: ISecureDataRepository, private accountService: AccountService, 
        private blockCypherService: IBlockCypherService, private paymentProcessor: PaymentProcessor) { }

    async run(event: BlockCypherPaymentEvent) : Promise<void> {
        
        let guid = event.guid;
        
        let info: AddressInfo | null = await this.dataRepository.getAddressInfoByGuid(guid);
        if (!info) {
            logger.warn(`callback received for address guid ${guid} but no address info found`);
            return Promise.resolve();
        }
        let tx = await this.blockCypherService.getTx(event.tx.hash, info.currency);
        await this.handleBlockCypherPaymentCallback(tx, info);
    }

    async handleBlockCypherPaymentCallback(tx: BlockCypherTx, info: AddressInfo): Promise<any> {
        
        let confirmations: number;
        let value: string;
        let output = tx.outputs.find((o: any) => o.addresses[0] === info!.address);

        let event: IncomingPaymentEvent;
        if (output != null) {
            logger.info(`found ${tx.confirmations} confirmations for ${output.addresses[0]}`);
            confirmations = parseInt(tx.confirmations);
            value = SharedHelpers.convertToLocalAmount(info.currency, output.value);
            let existingHook = this.blockCypherService.hooks.find((h:EventHook) => h.address === info!.address);

            let lastInputAddr: string = '';
            if (tx.inputs && tx.inputs.length)
                lastInputAddr = tx.inputs[tx.inputs.length - 1].addresses[0];

            event = new IncomingPaymentEvent(info.address, value, confirmations, tx.hash);
            event.lastInputAddr = lastInputAddr;
            //

            let ppMessage = new PaymentProcessorMessage();
            ppMessage.incomingPaymentEvent = event;
            let paymentProcessorResult = await this.paymentProcessor.sendMessage(ppMessage)
            let incomingPaymentResult = paymentProcessorResult.incomingPaymentResult;

            if (incomingPaymentResult!=null && incomingPaymentResult.payment != null && incomingPaymentResult.payment.status==PaymentStatus.complete && existingHook) {
                await this.blockCypherService.delHook(info.currency, info.hookId);
                logger.info('deleted hook: ' + info.hookId);
                existingHook.result = new EventHookResult(confirmations, parseFloat(value));
                this.blockCypherService.hooks.splice(this.blockCypherService.hooks.indexOf(existingHook), 1);
            }


        } else {
            logger.info(`callback received for address guid ${info.guid} but output does not contain target address ${info.address}. tx.outputs=${JSON.stringify(tx.outputs)}`);
        }

        return Promise.resolve(info);
    }
}