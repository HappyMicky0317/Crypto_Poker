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
const FundAccountRequestHandler_1 = require("../../src/handlers/FundAccountRequestHandler");
const jssubstitute_1 = __importDefault(require("jssubstitute"));
const IDataRepository_1 = require("../../src/services/documents/IDataRepository");
const WebSocketHandle_1 = require("../../src/model/WebSocketHandle");
const mockWebSocket_1 = require("../mockWebSocket");
const ClientMessage_1 = require("../../../poker.ui/src/shared/ClientMessage");
const User_1 = require("../../src/model/User");
const AdminSecureSocketService_1 = require("../../src/admin/AdminSecureSocketService");
const IDepositAddressService_1 = require("../../src/services/IDepositAddressService");
const CurrencyConfig_1 = require("../../src/model/CurrencyConfig");
describe('FundAccountRequestHandlerFixture', () => {
    jssubstitute_1.default.throwErrors();
    let handler;
    let dataRepository;
    let connectionToPaymentServer;
    let depositAddressService;
    let wsHandle = new WebSocketHandle_1.WebSocketHandle(new mockWebSocket_1.MockWebSocket());
    let user;
    let currencyConfig = new CurrencyConfig_1.CurrencyConfig();
    let addr = '1BG9YCMzLPuhtbgXNQUYkg9ygg7hWcL1JG';
    beforeEach(() => {
        currencyConfig.requiredNumberOfConfirmations = 1;
        currencyConfig.xpub = 'xpub';
        user = new User_1.User();
        user.guid = 'guid';
        dataRepository = jssubstitute_1.default.for(new IDataRepository_1.IDataRepository());
        connectionToPaymentServer = jssubstitute_1.default.for(new AdminSecureSocketService_1.IConnectionToPaymentServer());
        depositAddressService = jssubstitute_1.default.for(new IDepositAddressService_1.IDepositAddressService());
        dataRepository.returns('getUser', Promise.resolve(user));
        dataRepository.returns('getAddressInfo', Promise.resolve([]));
        dataRepository.returns('getNextUserIndex', Promise.resolve(4));
        dataRepository.returns('getCurrencyConfig', Promise.resolve(currencyConfig));
        dataRepository.returns('getPayments', Promise.resolve([]));
        depositAddressService.returns('getAddress', Promise.resolve(addr));
        handler = new FundAccountRequestHandler_1.FundAccountRequestHandler(null, dataRepository, connectionToPaymentServer, depositAddressService);
        wsHandle.user = user;
    });
    it('get new address from address service', async () => {
        let request = new ClientMessage_1.FundAccountRequest('btc');
        let clientMessage = new ClientMessage_1.ClientMessage();
        clientMessage.fundAccountRequest = request;
        await handler.run(wsHandle, clientMessage);
        let dbUser = dataRepository.argsForCall('saveUser', 0)[0];
        assert.equal(dbUser.depositIndex, 4);
        let depositAddressServiceCall = depositAddressService.argsForCall('getAddress', 0);
        assert.equal(depositAddressServiceCall[0], 'btc');
        assert.equal(depositAddressServiceCall[1], 'xpub');
        assert.equal(depositAddressServiceCall[2], 4);
        let addressInfo = dataRepository.argsForCall('saveAddress', 0)[0];
        assert.equal(addressInfo.address, addr);
        let messageToPaymentServer = connectionToPaymentServer.argsForCall('send', 0)[0];
        assert.equal(messageToPaymentServer.user.guid, 'guid');
        assert.equal(messageToPaymentServer.currency, 'btc');
        assert.equal(messageToPaymentServer.address, addr);
        assert.equal(messageToPaymentServer.depositIndex, 4);
    });
});
//# sourceMappingURL=FundAccountRequestHandlerFixture.js.map