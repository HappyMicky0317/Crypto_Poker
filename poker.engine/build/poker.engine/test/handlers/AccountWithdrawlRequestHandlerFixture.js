"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const jssubstitute_1 = __importDefault(require("jssubstitute"));
const IDataRepository_1 = require("../../src/services/documents/IDataRepository");
const WebSocketHandle_1 = require("../../src/model/WebSocketHandle");
const mockWebSocket_1 = require("../mockWebSocket");
const ClientMessage_1 = require("../../../poker.ui/src/shared/ClientMessage");
const User_1 = require("../../src/model/User");
const AdminSecureSocketService_1 = require("../../src/admin/AdminSecureSocketService");
const CurrencyConfig_1 = require("../../src/model/CurrencyConfig");
const AccountWithdrawlRequestHandler_1 = require("../../src/handlers/AccountWithdrawlRequestHandler");
const IBroadcastService_1 = require("../../src/services/IBroadcastService");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
describe('AccountWithdrawlRequestHandlerFixture', () => {
    jssubstitute_1.default.throwErrors();
    let handler;
    let dataRepository;
    let connectionToPaymentServer;
    let wsHandle = new WebSocketHandle_1.WebSocketHandle(new mockWebSocket_1.MockWebSocket());
    let user;
    let currencyConfig = new CurrencyConfig_1.CurrencyConfig();
    let addr = '1BG9YCMzLPuhtbgXNQUYkg9ygg7hWcL1JG';
    let pokerTableProvider;
    let account;
    let withdrawlAmount = new decimal_1.Decimal('0.01').mul(Currency_1.CurrencyUnit.default);
    beforeEach(() => {
        user = new User_1.User();
        user.guid = 'guid';
        account = new DataContainer_1.Account('btc', withdrawlAmount.toNumber());
        account.updateIndex = 7;
        currencyConfig.minimumWithdrawl = '0.001';
        dataRepository = jssubstitute_1.default.for(new IDataRepository_1.IDataRepository());
        pokerTableProvider = jssubstitute_1.default.for(new IBroadcastService_1.IPokerTableProvider());
        connectionToPaymentServer = jssubstitute_1.default.for(new AdminSecureSocketService_1.IConnectionToPaymentServer());
        pokerTableProvider.returns('getTables', []);
        dataRepository.returns('getCurrencyConfig', Promise.resolve(currencyConfig));
        dataRepository.returns('getUserAccount', Promise.resolve(account));
        dataRepository.returns('updateUserAccount', Promise.resolve({ result: { nModified: 1 } }));
        dataRepository.returns('getAddressInfoByAddress', []);
        handler = new AccountWithdrawlRequestHandler_1.AccountWithdrawlRequestHandler(pokerTableProvider, dataRepository, connectionToPaymentServer);
        wsHandle.user = user;
    });
    let getAccountWithdrawlRequest = () => {
        let request = new ClientMessage_1.AccountWithdrawlRequest();
        request.amount = withdrawlAmount.toString();
        request.currency = 'btc';
        request.receivingAddress = addr;
        let clientMessage = new ClientMessage_1.ClientMessage();
        clientMessage.accountWithdrawlRequest = request;
        return clientMessage;
    };
    let assertError = (errorMessage) => {
        dataRepository.didNotReceive('savePayment');
        let message = wsHandle.socket.getLastMessage();
        assert.equal(message.accountWithdrawlResult.success, false);
        assert.equal(message.accountWithdrawlResult.errorMessage, errorMessage);
    };
    it('Cannot withdraw to deposit address', async () => {
        dataRepository.returns('getAddressInfoByAddress', [{}]);
        await handler.run(wsHandle, getAccountWithdrawlRequest());
        assertError('Cannot withdraw to deposit address');
    });
    it('null receive address', async () => {
        let message = getAccountWithdrawlRequest();
        message.accountWithdrawlRequest.receivingAddress = null;
        await handler.run(wsHandle, message);
        assertError('Invalid receiving address');
    });
    it('Invalid receiving address', async () => {
        let message = getAccountWithdrawlRequest();
        message.accountWithdrawlRequest.receivingAddress = ' ';
        await handler.run(wsHandle, message);
        assertError('Invalid receiving address');
    });
    it('success', async () => {
        await handler.run(wsHandle, getAccountWithdrawlRequest());
        let args = dataRepository.argsForCall('updateUserAccount', 0);
        assert.equal(-1000000, args[2]);
        let paymentServerArgs = connectionToPaymentServer.argsForCall('send', 0)[0];
        assert.equal('CheckPaymentsTrigger', paymentServerArgs.constructor.name);
        let message = wsHandle.socket.getLastMessage();
        assert.equal(message.accountWithdrawlResult.success, true);
        assert.equal(message.accountWithdrawlResult.sentAmount, '1000000');
    });
});
//# sourceMappingURL=AccountWithdrawlRequestHandlerFixture.js.map