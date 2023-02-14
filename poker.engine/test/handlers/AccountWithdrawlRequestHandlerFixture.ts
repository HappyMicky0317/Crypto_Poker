import * as assert from 'assert';
import { FundAccountRequestHandler } from '../../src/handlers/FundAccountRequestHandler';
import { ISubstitute } from '../shared-test-helpers';
import substitute from 'jssubstitute';
import { IDataRepository } from '../../src/services/documents/IDataRepository';
import { WebSocketHandle } from '../../src/model/WebSocketHandle';
import { MockWebSocket } from '../mockWebSocket';
import { FundAccountRequest, ClientMessage, AccountWithdrawlRequest } from '../../../poker.ui/src/shared/ClientMessage';
import { User } from '../../src/model/User';
import { IConnectionToPaymentServer } from '../../src/admin/AdminSecureSocketService';
import { IDepositAddressService } from '../../src/services/IDepositAddressService';
import { CurrencyConfig } from '../../src/model/CurrencyConfig';
import { DepositAddressTrigger } from '../../src/admin/model/outgoing/DepositAddressTrigger';
import { AddressInfo } from '../../src/model/AddressInfo';
import { AccountWithdrawlRequestHandler } from '../../src/handlers/AccountWithdrawlRequestHandler';
import { IPokerTableProvider } from '../../src/services/IBroadcastService';
import { CurrencyUnit } from '../../../poker.ui/src/shared/Currency';
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { Account } from '../../../poker.ui/src/shared/DataContainer';

describe('AccountWithdrawlRequestHandlerFixture', ()=> {
    substitute.throwErrors();
    let handler:AccountWithdrawlRequestHandler;
    let dataRepository: ISubstitute<IDataRepository>;
    let connectionToPaymentServer: ISubstitute<IConnectionToPaymentServer>;
    let wsHandle: WebSocketHandle = new WebSocketHandle(new MockWebSocket());
    let user:User;
    let currencyConfig:CurrencyConfig = new CurrencyConfig();
    let addr = '1BG9YCMzLPuhtbgXNQUYkg9ygg7hWcL1JG';
    let pokerTableProvider:ISubstitute<IPokerTableProvider>;
    let account:Account;
    let withdrawlAmount = new Decimal('0.01').mul(CurrencyUnit.default);

    beforeEach(()=>{
        user = new User();   
        user.guid = 'guid';     
        account = new Account('btc', withdrawlAmount.toNumber());
        account.updateIndex = 7;
        currencyConfig.minimumWithdrawl = '0.001';
        dataRepository = <any>substitute.for(new IDataRepository());
        pokerTableProvider = <any>substitute.for(new IPokerTableProvider());
        connectionToPaymentServer = <any>substitute.for(new IConnectionToPaymentServer());
        pokerTableProvider.returns('getTables', []);
        dataRepository.returns('getCurrencyConfig', Promise.resolve(currencyConfig));
        dataRepository.returns('getUserAccount', Promise.resolve(account));
        dataRepository.returns('updateUserAccount', Promise.resolve({ result : { nModified: 1 }}));
        dataRepository.returns('getAddressInfoByAddress', [ ]);    
        handler = new AccountWithdrawlRequestHandler(pokerTableProvider, dataRepository, connectionToPaymentServer);
        wsHandle.user = user;
        
    });

    let getAccountWithdrawlRequest = () : ClientMessage =>{
        let request = new AccountWithdrawlRequest();
        request.amount = withdrawlAmount.toString();
        request.currency = 'btc';
        request.receivingAddress = addr;
        let clientMessage = new ClientMessage();
        clientMessage.accountWithdrawlRequest = request;
        return clientMessage;
    }

    let assertError = (errorMessage:string)=>{
        dataRepository.didNotReceive('savePayment')
        let message = (<MockWebSocket>wsHandle.socket).getLastMessage();
        assert.equal(message.accountWithdrawlResult.success, false)
        assert.equal(message.accountWithdrawlResult.errorMessage, errorMessage)   
    }

    it('Cannot withdraw to deposit address', async ()=>{
        dataRepository.returns('getAddressInfoByAddress', [ {} ]);
        
        await handler.run(wsHandle, getAccountWithdrawlRequest());
        
        assertError('Cannot withdraw to deposit address');                  
    });

    it('null receive address', async ()=>{
        
        let message = getAccountWithdrawlRequest();
        message.accountWithdrawlRequest.receivingAddress = null;
        await handler.run(wsHandle, message);
        
        assertError('Invalid receiving address');                  
    });

    it('Invalid receiving address', async ()=>{
        
        let message = getAccountWithdrawlRequest();
        message.accountWithdrawlRequest.receivingAddress = ' ';
        await handler.run(wsHandle, message);
        
        assertError('Invalid receiving address');                  
    });

    it('success', async ()=>{
        
        await handler.run(wsHandle, getAccountWithdrawlRequest());
        
        let args = <any[]>dataRepository.argsForCall('updateUserAccount', 0);
        assert.equal(-1000000, args[2])

        let paymentServerArgs = <AddressInfo>connectionToPaymentServer.argsForCall('send', 0)[0];
        assert.equal('CheckPaymentsTrigger', paymentServerArgs.constructor.name);

        let message = (<MockWebSocket>wsHandle.socket).getLastMessage();
        assert.equal(message.accountWithdrawlResult.success, true)
        assert.equal(message.accountWithdrawlResult.sentAmount, '1000000')
    });

})