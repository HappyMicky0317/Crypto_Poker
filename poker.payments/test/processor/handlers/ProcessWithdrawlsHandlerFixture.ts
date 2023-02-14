import { CurrencyConfig } from './../../../src/model/currency-config';
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
import { ProcessWithdrawlsHandler } from '../../../src/processor/ProcessWithdrawlsHandler';
import { PaymentProcessorSettings } from '../../../src/model/PaymentProcessorSettings';
import { IAccountService } from '../../../src/services/AccountService';
import { IHttp } from '../../../../poker.engine/src/services/IHttp';


describe('ProcessWithdrawlsHandler', ()=>{
    substitute.throwErrors()    

    let handler:ProcessWithdrawlsHandler;
    let accountService:ISubstitute<IAccountService>;
    let dataRepository:ISubstitute<ISecureDataRepository>;
    let connectionToGameServer:ISubstitute<IConnectionToGameServer>;
    let http:ISubstitute<IHttp>;
    let currencyConfig = new CurrencyConfig();
    currencyConfig.name = 'dash'
    currencyConfig.processingDelayMin = 20;
    currencyConfig.withdrawlLimitPerMin = 10;
    currencyConfig.withdrawlLimitNumber = 3;
    let pendingPayments:Payment[];
    let completePayments:Payment[];
 
    beforeEach(()=>{                
        pendingPayments = [];
        completePayments = [];
        let as = new IAccountService();
        as.newTransaction = () => { return Promise.resolve(new TransactionResult())};
        accountService = <any>substitute.for(as);     
        accountService.callsThrough('newTransaction')   
        http = <any>substitute.for(new IHttp());
        let repo = new ISecureDataRepository();
        repo.getPayments = (args:any): Promise<Payment[]>=>{            
            if(args.status==PaymentStatus.pending){
                return Promise.resolve(pendingPayments)
            }else if(args.status==PaymentStatus.complete){
                return Promise.resolve(completePayments)
            }
            return Promise.resolve([])
        } 
        repo.getCurrencyConfigs = () => { return Promise.resolve([currencyConfig])}
        dataRepository = <any>substitute.for(repo);        
        connectionToGameServer = <any>substitute.for(new IConnectionToGameServer());                
        handler = new ProcessWithdrawlsHandler(accountService,  dataRepository, connectionToGameServer, http);
        dataRepository.callsThrough('getPayments')
        dataRepository.callsThrough('getCurrencyConfigs')
        
    })

    let assertFirstPaymentsCall = ()=>{
        let args1 = dataRepository.argsForCall('getPayments', 0)[0];
        assert.equal(4, Object.keys(args1).length)
        let diff1 = (new Date().getTime() - args1.timestamp.$lte.getTime())/1000/60;
        assert.equal(Math.round(diff1), currencyConfig.processingDelayMin)
        assert.equal(args1.status, PaymentStatus.pending)
        assert.equal(args1.type, PaymentType.outgoing)
        assert.equal(args1.currency, 'dash')       
    }

    let assertPaymentsCall = () => {
        //first call
        assertFirstPaymentsCall();

        //second call
        {
            let args2 = dataRepository.argsForCall('getPayments', 1)[0];
            assert.equal(4, Object.keys(args2).length)
            let diff2 = (new Date().getTime() - args2.timestamp.$gte.getTime())/1000/60;
            assert.equal(Math.round(diff2), currencyConfig.withdrawlLimitPerMin)
            assert.equal(args2.status, PaymentStatus.complete)
            assert.equal(args2.type, PaymentType.outgoing)
            assert.equal(args2.currency, 'dash')  
        }
             
    }

    it('error on blockCypherService', async ()=>{
        pendingPayments =  [ <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:'' } ]
        
        accountService.newTransaction = (currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> => {
            let transactionResult = new TransactionResult();
            transactionResult.errorMessage = 'errorMessage'
            return Promise.resolve(transactionResult)
        }
        
        await handler.run(new PaymentProcessorMessage())

        assertPaymentsCall()
        let savePaymentCall = dataRepository.argsForCall('savePayment', 0);
        assert.equal(savePaymentCall[0].error, 'errorMessage')
        connectionToGameServer.didNotReceive('send')      
    })

    it('exceeds withdrawl limit per minute', async ()=>{
        pendingPayments =  [ <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:'' } ]
        completePayments = [ <Payment>{}, <Payment>{}, <Payment>{}];
        
        
        await handler.run(new PaymentProcessorMessage())

        assertPaymentsCall()
        dataRepository.didNotReceive('savePayment')  
        connectionToGameServer.didNotReceive('send')                  
    })

    it('pending payment with prior error is skipped', async ()=>{
        pendingPayments =  [ <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:'', error:'someError' } ]
        
        await handler.run(new PaymentProcessorMessage())

        assertFirstPaymentsCall();
        dataRepository.didNotReceive('savePayment')  
        connectionToGameServer.didNotReceive('send')                  
    })

    it('payment status must be pending', async ()=>{
        let payment = <Payment>{ status: PaymentStatus.flagged, type: PaymentType.outgoing, _id:''}
        pendingPayments =  [  payment ]

        await handler.run(new PaymentProcessorMessage())
                
        assertFirstPaymentsCall();
        dataRepository.didNotReceive('savePayment')  
    })

    it('auto payment is disabled', async ()=>{
        currencyConfig.processingDelayMin = -1;

        let payment = setupSuccess();

        await handler.run(new PaymentProcessorMessage())

        dataRepository.didNotReceive('getPayments')
        connectionToGameServer.didNotReceive('send')
    });

    it('skip payments where blockchain is waiting on prior tx', async ()=>{
        let payment = <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:''}
        pendingPayments =  [  payment ]
        currencyConfig.processingDelayMin = 30; 
        accountService.isWaitingOnPriorTransaction = () => { return Promise.resolve('foo')};       

        await handler.run(new PaymentProcessorMessage())

        accountService.didNotReceive('newTransaction')
        dataRepository.didNotReceive('savePayment')
        connectionToGameServer.didNotReceive('send')
    });

    let setupSuccess = () : Payment =>{
        let payment = <Payment>{ status: PaymentStatus.pending, type: PaymentType.outgoing, _id:''}
        pendingPayments =  [  payment ]

        accountService.newTransaction = (currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> => {
            let transactionResult = new TransactionResult();
            transactionResult.success = true;
            transactionResult.txHash = 'abcd';
            return Promise.resolve(transactionResult)
        }
        return payment;

    }

    it('success', async ()=>{
        let payment = setupSuccess();
        currencyConfig.processingDelayMin = 30;

        await handler.run(new PaymentProcessorMessage())

        assertPaymentsCall()
        assert.equal(payment.error, undefined)        
        assert.equal(payment.txId, 'abcd')   
        
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