import { PaymentProcessorMessage, PaymentProcessorResult } from './PaymentProcessorMessage';
import { AbstractProcessor, IProcessorMessageHandler } from "../../../poker.engine/src/framework/AbstractProcessor"
import { DepositAddressTrigger } from '../../../poker.engine/src/admin/model/outgoing/DepositAddressTrigger';


export class PaymentProcessor extends AbstractProcessor<PaymentProcessorMessage,PaymentProcessorResult> {
    
    constructor(timeoutMs?:number){
        super(PaymentProcessorResult, timeoutMs)
    }

    sendCheckWithdrawls(){
        let message = new PaymentProcessorMessage();
        message.checkWithdrawls = {};
        this.sendMessage(message)
    }

    sendCheckDepositAddresses(){
        let message = new PaymentProcessorMessage();
        message.checkDepositAddresses = new DepositAddressTrigger();
        this.sendMessage(message)
    }
}
export interface IPaymentProcessorMessageHandler extends IProcessorMessageHandler<PaymentProcessorMessage,PaymentProcessorResult> {
    
}