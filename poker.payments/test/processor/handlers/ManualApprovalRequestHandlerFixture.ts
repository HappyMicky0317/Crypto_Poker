import * as assert from 'assert';
import { ManualApprovalRequestHandler } from '../../../src/processor/ManualApprovalRequestHandler';
import { Substitute, default as substitute } from 'jssubstitute';
import { IBlockCypherService } from '../../../src/services/IBlockCypherService';
import { ISecureDataRepository } from '../../../src/repository/ISecureDataRepository';
import { PaymentProcessorMessage } from '../../../src/processor/PaymentProcessorMessage';
import { ManualApprovalRequest } from '../../../src/model/ManualApprovalRequest';
import { PaymentType } from '../../../../poker.ui/src/shared/PaymentType';
import { Payment } from '../../../../poker.engine/src/model/Payment';
import { PaymentStatus } from '../../../../poker.ui/src/shared/PaymentStatus';
import {ISubstitute} from "../../../../poker.engine/test/shared-test-helpers"
import { TransactionResult } from '../../../src/services/BlockCypherService';
import { IConnectionToGameServer } from '../../../src/services/ConnectionToGameServer';
import { PaymentServerToGameServerMessage } from '../../../../poker.engine/src/admin/model/PaymentServerToGameServerMessage';
import { GetPaymentsResult } from '../../../../poker.engine/src/admin/model/incoming/GetPaymentsResult';
import { IAccountService } from '../../../src/services/AccountService';


describe('ManualApprovalRequestHandlerFixture', ()=>{
    substitute.throwErrors()    

    let handler:ManualApprovalRequestHandler;
    let accountService:ISubstitute<IAccountService>;
    let dataRepository:ISubstitute<ISecureDataRepository>;
    let connectionToGameServer:ISubstitute<IConnectionToGameServer>;
    
    
    beforeEach(()=>{                
        accountService = <any>substitute.for(new IAccountService());
        dataRepository = <any>substitute.for(new ISecureDataRepository());        
        connectionToGameServer = <any>substitute.for(new IConnectionToGameServer());        
        
        handler = new ManualApprovalRequestHandler(accountService, dataRepository, connectionToGameServer);
    })

    it('payment not found', async ()=>{
        let message = new PaymentProcessorMessage();
        message.manualApprovalRequest = new ManualApprovalRequest('id1');
        let result = await handler.run(message)
        assert.equal(result.manualApprovalResult.error, 'payment not found: id1')
        dataRepository.didNotReceive('savePayment')
    })

    it('invalid payment type', async ()=>{
        dataRepository.getPaymentById = (id:string): Promise<Payment>=>{            
            return Promise.resolve(<Payment>{ type: PaymentType.incoming})
        } 

        let message = new PaymentProcessorMessage();       
        message.manualApprovalRequest = new ManualApprovalRequest(null); 
        let result = await handler.run(message)
        assert.equal(result.manualApprovalResult.error, 'invalid payment type: incoming')
        dataRepository.didNotReceive('savePayment')
    })

    it('waiting for prior transaction to confirm', async ()=>{
        let payment =  <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:'' };
        dataRepository.getPaymentById = (id:string): Promise<Payment>=>{            
            return Promise.resolve(payment)
        } 
        accountService.isWaitingOnPriorTransaction = (currency:string)=>{
            return Promise.resolve('0x544641fa8754fce6409804ca60362f0df67570e53452eded0c80ce807e730ca8');
        };

        let message = new PaymentProcessorMessage();       
        message.manualApprovalRequest = new ManualApprovalRequest(null); 
        let result = await handler.run(message)
        assert.equal(result.manualApprovalResult.error, 'waiting for prior transaction (0x544641fa8754fce6409804ca60362f0df67570e53452eded0c80ce807e730ca8)')
        dataRepository.didNotReceive('savePayment')
    })

    it('payment status must be pending', async ()=>{
        dataRepository.getPaymentById = (id:string): Promise<Payment>=>{            
            return Promise.resolve(<Payment>{ status: PaymentStatus.complete, type: PaymentType.outgoing })
        } 

        let message = new PaymentProcessorMessage();       
        message.manualApprovalRequest = new ManualApprovalRequest(null); 
        let result = await handler.run(message)
        assert.equal(result.manualApprovalResult.error, 'payment has status of complete but is required to have status pending')        
        dataRepository.didNotReceive('savePayment')
    })

    it('error on blockCypherService', async ()=>{
        let payment =  <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:'' };
        dataRepository.getPaymentById = (id:string): Promise<Payment>=>{            
            return Promise.resolve(payment)
        } 
        accountService.newTransaction = (currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> => {
            let transactionResult = new TransactionResult();
            transactionResult.errorMessage = 'errorMessage'
            return Promise.resolve(transactionResult)
        }

        let message = new PaymentProcessorMessage();       
        message.manualApprovalRequest = new ManualApprovalRequest(null); 
        let result = await handler.run(message)
        assert.equal(result.manualApprovalResult.error, undefined)        
        assert.equal(result.manualApprovalResult.payment.error, 'errorMessage')  
        connectionToGameServer.didNotReceive('send')      
    })

    it('success', async ()=>{
        let payment =  <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:'' };
        dataRepository.getPaymentById = (id:string): Promise<Payment>=>{            
            return Promise.resolve(payment)
        } 
        accountService.newTransaction = (currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> => {
            let transactionResult = new TransactionResult();
            transactionResult.success = true;
            transactionResult.txHash = 'abcd';
            return Promise.resolve(transactionResult)
        }

        let message = new PaymentProcessorMessage();       
        message.manualApprovalRequest = new ManualApprovalRequest(null); 
        let result = await handler.run(message)           
        assert.equal(result.manualApprovalResult.error, undefined)        
        assert.equal(result.manualApprovalResult.payment.error, undefined)        
        assert.equal(result.manualApprovalResult.payment.txId, 'abcd')   
        
        connectionToGameServer.receivedWith('send', substitute.arg.matchUsing((m:PaymentServerToGameServerMessage)=>{
            if(!m){
                return false;
            }else{
                let getPaymentsResult = <GetPaymentsResult>m;
                assert.equal(getPaymentsResult.payments[0], payment)
                return true;                
            }
            
        }))
    })
})