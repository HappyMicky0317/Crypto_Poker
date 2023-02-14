import * as assert from 'assert';
import { Substitute, default as substitute } from 'jssubstitute';
import { ISubstitute } from "../../../../poker.engine/test/shared-test-helpers"
import { CheckWithdrawlsHandler } from '../../../src/processor/CheckWithdrawlsHandler';
import { IBlockCypherService } from '../../../src/services/IBlockCypherService';
import { ISecureDataRepository } from '../../../src/repository/ISecureDataRepository';
import { PaymentProcessorMessage } from '../../../src/processor/PaymentProcessorMessage';
import { IHttp } from '../../../../poker.engine/src/services/IHttp';
import { Payment } from '../../../../poker.engine/src/model/Payment';
import { PaymentType } from '../../../../poker.ui/src/shared/PaymentType';
import { ITelegramService } from '../../../../poker.engine/src/framework/telegram/ITelegramService';
import { PaymentStatus } from '../../../../poker.ui/src/shared/PaymentStatus';
import { CurrencyConfig } from '../../../src/model/currency-config';
import { UserSmall } from '../../../../poker.engine/src/model/UserSmall';





describe('CheckWithdrawlsHandler', ()=>{
    substitute.throwErrors()    
    let handler:CheckWithdrawlsHandler;
    let http:ISubstitute<IHttp>;
    let telegramService:ISubstitute<ITelegramService>;
    let dataRepository:ISubstitute<ISecureDataRepository>;
    let payment:Payment;
    let currencyConfig = new CurrencyConfig();
    currencyConfig.flagAmount = '0.25';
    currencyConfig.processingDelayMin = 30;
    
    beforeEach(()=>{                        
        const repo = new ISecureDataRepository();
        repo.getCurrencyConfig = (currency:string) => { return Promise.resolve(currencyConfig)}
        dataRepository = <any>substitute.for(repo);        
        http = <any>substitute.for(new IHttp());        
        let tService = new ITelegramService();
        tService.sendTelegram = (text:string)=> { return Promise.resolve(true)};
        telegramService = <any>substitute.for(tService);        
        handler = new CheckWithdrawlsHandler(dataRepository, http, telegramService);
        payment = new Payment();
        payment.address = 'C2PvtxEGGRXpnpHr4xeoJpEzvCRzj78xbn';
        payment.type = PaymentType.outgoing;      
        payment.screenName = 'john'  
        payment.amount = '1000000';
        payment.currency = 'dash'  
        payment.status = PaymentStatus.pending;
        telegramService.callsThrough('sendTelegram')
        dataRepository.callsThrough('getCurrencyConfig')
    })

    it('payment is saved as pending', async () => {
        http.get = (uri: string, options?: any, callback?: any): Promise<any> => {
            return <any>Promise.resolve([payment]);
        }
        
        await handler.run(new PaymentProcessorMessage())

        let dbPayment = dataRepository.argsForCall('savePayment', 0)[0];                
        assert.equal(dbPayment, payment);
        assert.equal(dbPayment.status, PaymentStatus.pending);

        let telegram = telegramService.argsForCall('sendTelegram', 0)[0];
        assert.equal(telegram, 'Received new withdrawl (pending) from john for 0.01 dash. Processing delay:30 min')
    })

    it('large payment is flagged', async () => {
        http.get = (uri: string, options?: any, callback?: any): Promise<any> => {
            return <any>Promise.resolve([payment]);
        }
        payment.amount = '50000000';

        await handler.run(new PaymentProcessorMessage())

        let dbPayment = dataRepository.argsForCall('savePayment', 0)[0];                
        assert.equal(dbPayment, payment);
        assert.equal(dbPayment.status, PaymentStatus.flagged);

        let telegram = telegramService.argsForCall('sendTelegram', 0)[0];
        assert.equal(telegram, 'Received new withdrawl (flagged) from john for 0.5 dash.')
    })

    it('internal transfer is not processed', async () => {
        http.get = (uri: string, options?: any, callback?: any): Promise<any> => {
            return <any>Promise.resolve([payment]);
        }
        payment.transferTo = new UserSmall('guid1', 'user1')
        payment.status = PaymentStatus.complete;

        await handler.run(new PaymentProcessorMessage())

        let dbPayment = dataRepository.argsForCall('savePayment', 0)[0];                
        assert.equal(dbPayment, payment);
        assert.equal(dbPayment.status, PaymentStatus.complete);

        telegramService.didNotReceive('sendTelegram');        
    })

    
})