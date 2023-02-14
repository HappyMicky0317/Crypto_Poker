import { IPaymentProcessorMessageHandler } from "./PaymentProcessor";
import { PaymentProcessorResult, PaymentProcessorMessage } from "./PaymentProcessorMessage";
import { IAccountService } from "../services/AccountService";
import { IConnectionToGameServer } from "../services/ConnectionToGameServer";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import environment from "../environment";
import { Payment } from "../../../poker.engine/src/model/Payment";
import { PaymentType } from "../../../poker.ui/src/shared/PaymentType";
import { IncomingPaymentResult } from "../model/IncomingPaymentResult";


export class IncomingPaymentEventHandler implements IPaymentProcessorMessageHandler {
    
    typeName: string = 'incomingPaymentEvent'

    constructor(private accountService:IAccountService, private dataRepository:ISecureDataRepository){

    }
    
    async run(message: PaymentProcessorMessage): Promise<PaymentProcessorResult> {
        let result = new PaymentProcessorResult()

        let payment = await this.accountService.handlePayment(message.incomingPaymentEvent)
        result.incomingPaymentResult = new IncomingPaymentResult(payment);
        
        return Promise.resolve(result);
    }    

   

}