import { IPaymentProcessorMessageHandler } from "./PaymentProcessor";
import { PaymentProcessorResult, PaymentProcessorMessage } from "./PaymentProcessorMessage";
import { IAccountService } from "../services/AccountService";
import { IConnectionToGameServer } from "../services/ConnectionToGameServer";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();
import { ManualApprovalResult } from "../model/ManualApprovalRequest";
import { IBlockCypherService } from "../services/IBlockCypherService";
import { TransactionResult } from "../services/BlockCypherService";
import { PaymentStatus } from "../../../poker.ui/src/shared/PaymentStatus";
import { Decimal } from "../../../poker.ui/src/shared/decimal";
import { PaymentType } from "../../../poker.ui/src/shared/PaymentType";
import { GetPaymentsResult } from "../../../poker.engine/src/admin/model/incoming/GetPaymentsResult";
import { withdraw } from "./WithdrawlsHandler";
import { CancelPaymentResult } from "../model/CancelPaymentRequest";


export class CancelPaymentRequestHandler implements IPaymentProcessorMessageHandler {
    
    typeName: string = 'cancelPaymentRequest'

    constructor(private dataRepository:ISecureDataRepository, private connectionToGameServer:IConnectionToGameServer){

    }
    
    async run(message: PaymentProcessorMessage): Promise<PaymentProcessorResult> {
        let ppResult = new PaymentProcessorResult()
        let result = new CancelPaymentResult();
        ppResult.cancelPaymentResult = result;

        let payment = await this.dataRepository.getPaymentById(message.cancelPaymentRequest.paymentId)
        if(!payment){
            result.error = `payment not found: ${message.cancelPaymentRequest.paymentId}`
            return ppResult;
        }
        
        if(payment.status !== PaymentStatus.pending){        
            result.error = `payment has status of ${payment.status} but is required to have status pending`
            return ppResult;
        }
        payment.status = PaymentStatus.cancelled;
        payment.updated = new Date();
        await this.dataRepository.savePayment(payment);

        let getPaymentsResult = new GetPaymentsResult();
        getPaymentsResult.payments = [ payment ]
        this.connectionToGameServer.send(getPaymentsResult)

        result.payment = payment;
        
        

        return ppResult;
    }    

    


}