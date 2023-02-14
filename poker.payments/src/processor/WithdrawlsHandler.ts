import { ISecureDataRepository } from './../repository/ISecureDataRepository';
import { Payment } from './../../../poker.engine/src/model/Payment';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { TransactionResult } from '../services/BlockCypherService';
import { PaymentStatus } from '../../../poker.ui/src/shared/PaymentStatus';
import { IBlockCypherService } from '../services/IBlockCypherService';
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { IConnectionToGameServer } from '../services/ConnectionToGameServer';
import { GetPaymentsResult } from '../../../poker.engine/src/admin/model/incoming/GetPaymentsResult';
import { Logger, getLogger } from "log4js";
import { IAccountService } from '../services/AccountService';
var logger:Logger = getLogger();

export async function withdraw(payment:Payment, accountService:IAccountService, dataRepository:ISecureDataRepository, connectionToGameServer:IConnectionToGameServer, options:{allowFlagged:boolean}) : Promise<{errorMessage:string}> {
    
    let result:{errorMessage:string} = {errorMessage: null}
    if(payment.type !== PaymentType.outgoing){
        result.errorMessage = `invalid payment type: ${payment.type}`
        return result;
    }

    if(payment.status !== PaymentStatus.pending && !(payment.status === PaymentStatus.flagged && options.allowFlagged)){        
        result.errorMessage = `payment has status of ${payment.status} but is required to have status pending`
        return result;
    }
    
    let waitingTxHash = await accountService.isWaitingOnPriorTransaction(payment.currency);
    if(waitingTxHash){        
        result.errorMessage = `waiting for prior transaction (${waitingTxHash})`
        return result;
    }

    payment.error = null;
    let transactionResult: TransactionResult = await accountService.newTransaction(payment.currency, payment.address, new Decimal(payment.amount).toNumber(), payment.guid)
    logger.info(`TransactionResult: ${payment._id.toString()} success:${transactionResult.success} amount:${payment.amount}`)
    if (transactionResult.success) {
        payment.status = PaymentStatus.complete;
        payment.sentAmount = transactionResult.sentAmount;
        payment.fees = transactionResult.fees;
        payment.txId = transactionResult.txHash;
        payment.updated = new Date();
    }else{
        payment.error = transactionResult.errorMessage;
    }
    await dataRepository.savePayment(payment);
    
    
    if (transactionResult.success){
        let getPaymentsResult = new GetPaymentsResult();
        getPaymentsResult.payments = [ payment ]
        connectionToGameServer.send(getPaymentsResult)
    }
    return result;
}