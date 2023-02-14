import * as assert from 'assert';
import { FundAccountRequestHandler } from '../../src/handlers/FundAccountRequestHandler';
import { ISubstitute } from '../shared-test-helpers';
import substitute from 'jssubstitute';
import { IDataRepository } from '../../src/services/documents/IDataRepository';
import { WebSocketHandle } from '../../src/model/WebSocketHandle';
import { MockWebSocket } from '../mockWebSocket';
import { FundAccountRequest, ClientMessage } from '../../../poker.ui/src/shared/ClientMessage';
import { User } from '../../src/model/User';
import { IConnectionToPaymentServer } from '../../src/admin/AdminSecureSocketService';
import { IDepositAddressService } from '../../src/services/IDepositAddressService';
import { CurrencyConfig } from '../../src/model/CurrencyConfig';
import { DepositAddressTrigger } from '../../src/admin/model/outgoing/DepositAddressTrigger';
import { AddressInfo } from '../../src/model/AddressInfo';

describe('FundAccountRequestHandlerFixture', ()=> {
    substitute.throwErrors();
    let handler:FundAccountRequestHandler;
    let dataRepository: ISubstitute<IDataRepository>;
    let connectionToPaymentServer: ISubstitute<IConnectionToPaymentServer>;
    let depositAddressService: ISubstitute<IDepositAddressService>;
    let wsHandle: WebSocketHandle = new WebSocketHandle(new MockWebSocket());
    let user:User;
    let currencyConfig:CurrencyConfig = new CurrencyConfig();
    let addr = '1BG9YCMzLPuhtbgXNQUYkg9ygg7hWcL1JG';

    beforeEach(()=>{
        currencyConfig.requiredNumberOfConfirmations=1;
        currencyConfig.xpub='xpub';
        user = new User();   
        user.guid = 'guid';     
        dataRepository = <any>substitute.for(new IDataRepository());
        connectionToPaymentServer = <any>substitute.for(new IConnectionToPaymentServer());
        depositAddressService = <any>substitute.for(new IDepositAddressService());
        dataRepository.returns('getUser', Promise.resolve(user));
        dataRepository.returns('getAddressInfo', Promise.resolve([]));
        dataRepository.returns('getNextUserIndex', Promise.resolve(4));
        dataRepository.returns('getCurrencyConfig', Promise.resolve(currencyConfig));
        dataRepository.returns('getPayments', Promise.resolve([]));
        depositAddressService.returns('getAddress', Promise.resolve(addr));        
        handler = new FundAccountRequestHandler(null, dataRepository, connectionToPaymentServer, depositAddressService);
        wsHandle.user = user;
    });

    it('get new address from address service', async ()=>{
        let request = new FundAccountRequest('btc');
        let clientMessage = new ClientMessage();
        clientMessage.fundAccountRequest = request;
        
        await handler.run(wsHandle, clientMessage);
        
        let dbUser = <User>dataRepository.argsForCall('saveUser', 0)[0];
        assert.equal(dbUser.depositIndex, 4);

        let depositAddressServiceCall = depositAddressService.argsForCall('getAddress', 0);
        assert.equal(depositAddressServiceCall[0], 'btc');
        assert.equal(depositAddressServiceCall[1], 'xpub');
        assert.equal(depositAddressServiceCall[2], 4);
        
        let addressInfo = <AddressInfo>dataRepository.argsForCall('saveAddress', 0)[0];
        assert.equal(addressInfo.address, addr)
        let messageToPaymentServer = <DepositAddressTrigger>connectionToPaymentServer.argsForCall('send', 0)[0];
        assert.equal(messageToPaymentServer.user.guid, 'guid')        
        assert.equal(messageToPaymentServer.currency, 'btc')
        assert.equal(messageToPaymentServer.address, addr)
        assert.equal(messageToPaymentServer.depositIndex, 4)
        
    });

})