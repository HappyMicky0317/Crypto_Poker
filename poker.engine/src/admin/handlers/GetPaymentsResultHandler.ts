import { AccountFundedHandler } from "./AccountFundedHandler";
import { GetPaymentsResult } from "../model/incoming/GetPaymentsResult";
import { Logger, getLogger } from "log4js";
import { PaymentType } from "../../../../poker.ui/src/shared/PaymentType";
import { IDataRepository } from "../../services/documents/IDataRepository";
import { GameServerProcessorMessage } from "../processor/GameServerProcessorMessage";
import { GameServerProcessorResult } from "../processor/GameServerProcessorResult";
const logger: Logger = getLogger();

export class GetPaymentsResultHandler {
    typeName: string = 'getPaymentsResult'

    constructor(private accountFundedHandler:AccountFundedHandler, private dataRepository: IDataRepository){

    }

    async run(message: GameServerProcessorMessage): Promise<GameServerProcessorResult>{
        let result = new GameServerProcessorResult();
        
        for(let payment of message.getPaymentsResult.payments){
            try {
                if(payment.type==PaymentType.incoming){
                    await this.accountFundedHandler.handlePayment(payment);
                }else if(payment.type==PaymentType.outgoing){
                    await this.dataRepository.savePayment(payment);
                }
                
            } catch (e) {
                logger.error(e)
            }
        }

        return result;
    }        
}