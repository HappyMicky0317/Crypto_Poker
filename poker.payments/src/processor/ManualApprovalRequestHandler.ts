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


export class ManualApprovalRequestHandler implements IPaymentProcessorMessageHandler {
    
    typeName: string = 'manualApprovalRequest'

    constructor(private accountService:IAccountService, private dataRepository:ISecureDataRepository, private connectionToGameServer:IConnectionToGameServer){

    }
    
    async run(message: PaymentProcessorMessage): Promise<PaymentProcessorResult> {
        let ppResult = new PaymentProcessorResult()
        ppResult.manualApprovalResult = new ManualApprovalResult();

        let payment = await this.dataRepository.getPaymentById(message.manualApprovalRequest.paymentId)
        if(!payment){
            ppResult.manualApprovalResult.error = `payment not found: ${message.manualApprovalRequest.paymentId}`
            return ppResult;
        }
        let result = await withdraw(payment, this.accountService, this.dataRepository, this.connectionToGameServer, { allowFlagged: true })
        ppResult.manualApprovalResult.payment = payment;
        ppResult.manualApprovalResult.error = result.errorMessage;
        

        return ppResult;
    }    

    


}