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
const login_request_1 = require("./../../poker.ui/src/shared/login-request");
const assert = __importStar(require("assert"));
var substitute = require('jssubstitute');
var crypto = require('crypto');
const poker_processor_1 = require("../src/poker-processor");
const mockWebSocket_1 = require("./mockWebSocket");
const table_1 = require("../src/table");
const DataContainer_1 = require("../../poker.ui/src/shared/DataContainer");
const Currency_1 = require("../../poker.ui/src/shared/Currency");
const User_1 = require("../src/model/User");
const ClientMessage_1 = require("../../poker.ui/src/shared/ClientMessage");
const test_helpers_1 = require("./test-helpers");
const WebSocketHandle_1 = require("../src/model/WebSocketHandle");
const ExchangeRate_1 = require("../../poker.ui/src/shared/ExchangeRate");
const PaymentStatus_1 = require("../../poker.ui/src/shared/PaymentStatus");
const protobuf_config_1 = __importDefault(require("./../../poker.ui/src/shared/protobuf-config"));
const TournamentLogic_1 = require("../src/handlers/TournamentLogic");
const RequestHandlerInit_1 = require("../src/RequestHandlerInit");
const TableConfig_1 = require("../src/model/TableConfig");
const shared_helpers_1 = require("../src/shared-helpers");
const CurrencyConfig_1 = require("../src/model/CurrencyConfig");
const AdminSecureSocketService_1 = require("../src/admin/AdminSecureSocketService");
const CheckPaymentsTrigger_1 = require("../src/admin/model/outgoing/CheckPaymentsTrigger");
const CommonHelpers_1 = __importDefault(require("../../poker.ui/src/shared/CommonHelpers"));
const JoinTableResult_1 = require("../src/model/table/JoinTableResult");
const JoinTableRequest_1 = require("../src/model/table/JoinTableRequest");
const environment_1 = __importDefault(require("../src/environment"));
describe('#PokerProcessor()', function () {
    var processor;
    var httpIncomingRequest;
    const connectionToPaymentServer = substitute.for(new AdminSecureSocketService_1.IConnectionToPaymentServer());
    ;
    let currencyConfig;
    protobuf_config_1.default.init();
    let dataRepository;
    beforeEach(() => {
        process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
        process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC';
        substitute.throwErrors();
        dataRepository = test_helpers_1.TestHelpers.getDataRepository();
        processor = new poker_processor_1.PokerProcessor(dataRepository);
        processor.tournamentLogic = substitute.for(new TournamentLogic_1.TournamentLogic(null, null, null, null, null, null));
        new RequestHandlerInit_1.RequestHandlerInit().init(dataRepository, processor, processor.tournamentLogic, connectionToPaymentServer, null);
        httpIncomingRequest = { headers: { cookie: 'guid=ABCDEF;isNewUser=1,' }, url: '' };
        httpIncomingRequest.customData = { user: null, sid: '' };
        currencyConfig = new CurrencyConfig_1.CurrencyConfig();
        currencyConfig.minimumWithdrawl = '0.001';
    });
    let setupSubstitutedRepository = () => {
        let dataRepositorySub = processor.dataRepository;
        let user = new User_1.User();
        let accounts = [];
        accounts.push(new DataContainer_1.Account(Currency_1.Currency.free, 1000));
        accounts.push(new DataContainer_1.Account(Currency_1.Currency.dash, 5123456));
        for (let account of accounts) {
            account.updateIndex = 0;
        }
        dataRepositorySub.returns('getUser', Promise.resolve(user));
        dataRepositorySub.returns('getCurrencyConfig', Promise.resolve(currencyConfig));
        dataRepositorySub.returns('getUserAccounts', Promise.resolve(accounts));
        dataRepositorySub.returns('getUserAccount', Promise.resolve(accounts[1]));
        dataRepositorySub.returns('getAddressInfoByAddress', Promise.resolve([]));
        return dataRepositorySub;
    };
    it('should return tables from repository', function () {
        processor.dataRepository.getExchangeRate = (base) => {
            let exchangeRate;
            if (base.toLowerCase() === "dash") {
                exchangeRate = new ExchangeRate_1.ExchangeRate();
                exchangeRate.price = 190.43589233;
            }
            return Promise.resolve(exchangeRate);
        };
        return processor.loadTables().then(() => {
            let tables = processor.getTables();
            assert.equal(tables.length, 2);
            let table1 = tables.find(t => t.tableConfig.name == "table1");
            assert.equal(table1.tableConfig.smallBlind, 52511);
            assert.equal(table1.tableConfig.bigBlind, 105022);
            let table2 = tables.find(t => t.tableConfig.name == "table2");
            assert.equal(table2.tableConfig.smallBlind, 10);
            assert.equal(table2.tableConfig.bigBlind, 20);
        });
    });
    it('add table', function () {
        processor.addTable(new table_1.Table(test_helpers_1.TestHelpers.getTableConfig()));
        assert.equal(processor.getTables().length, 1);
    });
    it('handle socket connection new user', async () => {
        let substituteRepo = substitute.for(dataRepository);
        processor.dataRepository = substituteRepo;
        substituteRepo.callsThrough('getUser');
        processor.addTable(new table_1.Table(test_helpers_1.TestHelpers.getTableConfig()));
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        assert.equal(processor.clients.length, 1);
        var socketHandle = processor.clients[0];
        assert.equal(socketHandle.user.guid.length > 0, true);
        assert.equal(socketHandle.user.screenName.length, 8);
        assert.equal(socketHandle.user.screenName.substr(0, 4), "anon");
        substituteRepo.didNotReceive('getUser');
    });
    it('verifyClient', async () => {
        let user = new User_1.User();
        user.guid = 'd38c3b43c803f9056f98a5355ed1b84bd0345296';
        processor.dataRepository.getUser = (guid) => { return Promise.resolve(guid === user.guid ? user : null); };
        let sid = '48babfe44148b739cedd07ef6b003edf48586672d8b3f41f4368ca8179b7a278a96120789435f23a2bb8bbfc6830993aeb0839cad30835e76305b44132329985$8a2949a87d4a1443070830adf684b461$2e4ef89bdbf2d8d153ef4fe26aefc602b5a136a4ee51c3ff911420fc9047962b';
        httpIncomingRequest.url = `/ws?sid=${sid}`;
        let info = { req: httpIncomingRequest };
        await processor.verifyClient(info, (success) => {
            assert.equal(success, true);
        });
        assert.equal(processor.clients.length, 0);
        assert.equal(user, info.req.customData.user);
    });
    it('handle_socket_connection_existing_user', async () => {
        let socket = new mockWebSocket_1.MockWebSocket();
        let user = new User_1.User();
        user.guid = 'd38c3b43c803f9056f98a5355ed1b84bd0345296';
        processor.dataRepository.getUser = (guid) => { return Promise.resolve(guid === user.guid ? user : null); };
        httpIncomingRequest.customData = { user: user, sid: 'sid' };
        await processor.connection(socket, httpIncomingRequest);
        assert.equal(processor.clients.length, 1);
        assert.equal(processor.clients[0].user.guid, user.guid);
        assert.equal(socket.getLastMessage().loginResult.sid, 'sid');
    });
    it('handle_socket_connection_invalid_sid', async () => {
        let substituteRepo = processor.dataRepository;
        dataRepository.getUser = () => Promise.resolve(null);
        let socket = new mockWebSocket_1.MockWebSocket();
        httpIncomingRequest.url = "/ws?sid=_";
        await processor.connection(socket, httpIncomingRequest);
        assert.equal(processor.clients.length, 1);
        assert.equal(processor.clients[0].user.guid, 'ABCDEF');
        substituteRepo.didNotReceive('getUser');
    });
    it('same IP disconnects first user', async () => {
        environment_1.default.debug = false;
        dataRepository.getUser = () => Promise.resolve(null);
        let socket1 = new mockWebSocket_1.MockWebSocket();
        let socket2 = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket1, httpIncomingRequest);
        let guid2 = crypto.randomBytes(20).toString('hex');
        let httpIncomingRequest2 = { headers: { cookie: `guid=${guid2};isNewUser=1,` }, url: '' };
        httpIncomingRequest2.customData = { user: null, sid: '' };
        await processor.connection(socket2, httpIncomingRequest2);
        assert.equal(processor.clients.length, 2);
        let lastMessage = socket1.getLastMessage();
        assert.equal(lastMessage.duplicateIpAddress != null, true);
    });
    it('join table request is forwarded to table', async () => {
        let dataRepositorySub = setupSubstitutedRepository();
        processor.addTable(new table_1.Table(new TableConfig_1.TableConfig("table1", 1, 2, Currency_1.Currency.free, "id1")));
        let joinTableResult = new JoinTableResult_1.JoinTableResult();
        joinTableResult.success = true;
        let tableTmp = new table_1.Table(new TableConfig_1.TableConfig("table2", 1, 2, Currency_1.Currency.dash, "id2"));
        tableTmp.sendTableProcessorMessage = (message) => { return null; };
        tableTmp.validateJoinTable = (req) => { return joinTableResult; };
        let table = substitute.for(tableTmp);
        table.callsThrough('sendTableProcessorMessage');
        table.callsThrough('validateJoinTable');
        table.callsThrough('getTableConfigUpdate');
        processor.addTable(table);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let joinTableRequest = new ClientMessage_1.JoinTableRequest();
        joinTableRequest.seat = 1;
        joinTableRequest.tableId = "id2";
        joinTableRequest.amount = "5123456";
        let ws = new WebSocketHandle_1.WebSocketHandle(socket);
        ws.user = new User_1.User();
        ws.user.guid = 'guid1';
        let message = new ClientMessage_1.ClientMessage();
        message.joinTableRequest = joinTableRequest;
        await processor.onSocketMessage(ws, message);
        let tMessage = table.argsForCall('sendTableProcessorMessage', 0)[0];
        assert.equal(tMessage.joinTableRequest.seat, 1);
        assert.equal(tMessage.joinTableRequest.stack, 5123456);
        dataRepositorySub.receivedWith('updateUserAccount', 'guid1', Currency_1.Currency.dash, -joinTableRequest.amount, 0);
    });
    it('join table request fails validation', async () => {
        let user = new User_1.User();
        processor.dataRepository.getUser = (guid) => { return Promise.resolve(user); };
        let table = substitute.for(new table_1.Table(new TableConfig_1.TableConfig("table2", 1, 2, Currency_1.Currency.dash, "id2")));
        table.validateJoinTable = (req) => { return new JoinTableResult_1.JoinTableResult(); };
        processor.addTable(table);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let joinTableRequest = new ClientMessage_1.JoinTableRequest();
        joinTableRequest.seat = 1;
        joinTableRequest.tableId = "id2";
        let ws = new WebSocketHandle_1.WebSocketHandle(socket);
        ws.user = new User_1.User();
        let message = new ClientMessage_1.ClientMessage();
        message.joinTableRequest = joinTableRequest;
        await processor.onSocketMessage(ws, message);
        table.didNotReceive('handleJoinTableRequest');
    });
    it('request stack size exceeds player balance', async () => {
        let account = new DataContainer_1.Account(Currency_1.Currency.dash, 1000);
        processor.dataRepository.getUserAccount = (guid, currency) => { return Promise.resolve(account); };
        let table = substitute.for(new table_1.Table(new TableConfig_1.TableConfig("table2", 1, 2, Currency_1.Currency.dash, "id2")));
        table.validateJoinTable = (req) => { return new JoinTableResult_1.JoinTableResult(); };
        processor.addTable(table);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let joinTableRequest = new ClientMessage_1.JoinTableRequest();
        joinTableRequest.amount = "2000";
        joinTableRequest.tableId = "id2";
        let ws = new WebSocketHandle_1.WebSocketHandle(socket);
        ws.user = new User_1.User();
        let message = new ClientMessage_1.ClientMessage();
        message.joinTableRequest = joinTableRequest;
        return processor.onSocketMessage(ws, message)
            .then(() => {
            table.didNotReceive('handleJoinTableRequest');
            assert.equal(socket.getLastMessage().error.message, "request stack size of 2000 exceeds player balance of 1000");
        });
    });
    it('non integer request amount', async () => {
        processor.dataRepository.getUserAccount = (guid, currency) => { return Promise.resolve(new DataContainer_1.Account(Currency_1.Currency.dash, 1000)); };
        processor.addTable(new table_1.Table(new TableConfig_1.TableConfig("table2", 1, 2, Currency_1.Currency.dash, "id2")));
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let joinTableRequest = new ClientMessage_1.JoinTableRequest();
        joinTableRequest.amount = 12.34;
        joinTableRequest.tableId = "id2";
        let ws = new WebSocketHandle_1.WebSocketHandle(socket);
        ws.user = new User_1.User();
        let message = new ClientMessage_1.ClientMessage();
        message.joinTableRequest = joinTableRequest;
        return processor.onSocketMessage(ws, message)
            .then(() => {
            assert.equal(processor.getTables()[0].getPlayerCount(), 0);
            assert.equal(socket.getLastMessage().error.message, "request amount of 12.34 is invalid");
        });
    });
    it('non integer request amount2', async () => {
        processor.dataRepository.getUserAccount = (guid, currency) => { return Promise.resolve(new DataContainer_1.Account(Currency_1.Currency.dash, 1000)); };
        processor.addTable(new table_1.Table(new TableConfig_1.TableConfig("table2", 1, 2, Currency_1.Currency.dash, "id2")));
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let joinTableRequest = new ClientMessage_1.JoinTableRequest();
        joinTableRequest.amount = "";
        joinTableRequest.tableId = "id2";
        let ws = new WebSocketHandle_1.WebSocketHandle(socket);
        ws.user = new User_1.User();
        let message = new ClientMessage_1.ClientMessage();
        message.joinTableRequest = joinTableRequest;
        await processor.onSocketMessage(ws, message);
        assert.equal(processor.getTables()[0].getPlayerCount(), 0);
        assert.equal(socket.getLastMessage().error.message, "request amount of  is invalid");
    });
    it('fund request is forwarded to account service', async () => {
        processor.addTable(new table_1.Table(new TableConfig_1.TableConfig("table1", 1, 2, "bcy", "id1")));
        let socket = new mockWebSocket_1.MockWebSocket();
        processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage_1.ClientMessage();
        message.fundAccountRequest = new ClientMessage_1.FundAccountRequest('bcy');
    });
    it('client listTables', async () => {
        const tConfig = new TableConfig_1.TableConfig("table1", 1, 2, "bcy");
        tConfig._id = "id";
        let table = substitute.for(new table_1.Table(tConfig));
        processor.addTable(table);
        let socket = new mockWebSocket_1.MockWebSocket();
        let message = new ClientMessage_1.ClientMessage();
        message.listTablesRequest = new ClientMessage_1.ListTablesRequest();
        await processor.connection(socket, httpIncomingRequest);
        await processor.logAndEnqueue(processor.clients[0], message);
        let message2 = socket.getLastMessage();
        let tableConfig = message2.tableConfigs.rows[0];
        assert.equal(tableConfig.name, "table1");
        table.didNotReceive('handleJoinTableRequest');
    });
    it('subscribe to table', async () => {
        let table1 = substitute.for(new table_1.Table(new TableConfig_1.TableConfig("table1", 1, 2, "bcy", "id1")));
        let table2 = substitute.for(new table_1.Table(new TableConfig_1.TableConfig("table2", 1, 2, "bcy", "id2")));
        processor.addTable(table1);
        processor.addTable(table2);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage_1.ClientMessage();
        message.subscribeToTableRequest = new ClientMessage_1.SubscribeToTableRequest();
        message.subscribeToTableRequest.tableId = "id2";
        return processor.logAndEnqueue(processor.clients[0], message)
            .then(() => {
            table2.receivedWith('addSubscriber', substitute.arg.matchUsing(function (arg) {
                return arg instanceof WebSocketHandle_1.WebSocketHandle && arg === processor.clients[0];
            }));
            table1.didNotReceive('addSubscriber');
            table1.receivedWith('removeSubscriber', substitute.arg.matchUsing(function (arg) {
                return arg === processor.clients[0];
            }));
        });
    });
    it('client is removed on socket close', async () => {
        const tConfig1 = new TableConfig_1.TableConfig();
        tConfig1._id = "id1";
        let table1 = substitute.for(new table_1.Table(tConfig1));
        const tConfig2 = new TableConfig_1.TableConfig();
        tConfig2._id = "id2";
        let table2 = substitute.for(new table_1.Table(tConfig2));
        processor.addTable(table1);
        processor.addTable(table2);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let socketHandle = processor.clients[0];
        socket.triggerClose();
        assert.equal(processor.clients.length, 0);
        table1.receivedWith('onClientDisconnected', substitute.arg.matchUsing((arg) => { return arg === socketHandle; }));
        table2.receivedWith('onClientDisconnected', substitute.arg.matchUsing((arg) => { return arg === socketHandle; }));
    });
    it('sit out next hand', async () => {
        let table1 = substitute.for(new table_1.Table(test_helpers_1.TestHelpers.getTableConfig()));
        table1.tableConfig = new TableConfig_1.TableConfig("table1", 1, 2, "bcy");
        table1.tableConfig._id = "id1";
        processor.addTable(table1);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage_1.ClientMessage();
        message.setTableOptionRequest = new ClientMessage_1.SetTableOptionRequest("id1");
        await processor.logAndEnqueue(processor.clients[0], message);
        let tMessage = table1.argsForCall('sendTableProcessorMessage', 0)[0];
        assert.equal(tMessage.setTableOptionRequest.request.tableId, 'id1');
        assert.equal(tMessage.setTableOptionRequest.user.guid, processor.clients[0].user.guid);
        assert.equal(tMessage.setTableOptionRequest.user.screenName, processor.clients[0].user.screenName);
    });
    it('send chat message', async () => {
        let table = new table_1.Table(test_helpers_1.TestHelpers.getTableConfig());
        dataRepository.getUser = () => Promise.resolve(null);
        table.tableConfig._id = "id1";
        table.dataRepository = processor.dataRepository;
        processor.addTable(table);
        let addTableSubscriber = async (userGuid) => {
            let socket = new mockWebSocket_1.MockWebSocket();
            let req = { headers: { cookie: `guid=${userGuid};isNewUser=1` }, url: '', customData: { sid: '' } };
            await processor.connection(socket, req);
            let tableSubscriber = processor.clients[processor.clients.length - 1];
            table.addSubscriber(tableSubscriber);
            return socket;
        };
        let socket1 = await addTableSubscriber("user1");
        let socket2 = await addTableSubscriber("user2");
        let socket3 = await addTableSubscriber("user3");
        let message = new ClientMessage_1.ClientMessage();
        message.chatRequest = new ClientMessage_1.ChatRequest("id1", "hi");
        let sockets = [socket1, socket2, socket3];
        for (let socket of sockets) {
            socket.clearMessages();
        }
        await processor.logAndEnqueue(processor.clients[0], message);
        for (let socket of sockets) {
            assert.equal(1, socket.outgoingMessages.length);
            let dataContainer = socket.getLastMessage();
            let chatMessage = dataContainer.chatMessageResult.messages[0];
            assert.equal('id1', dataContainer.chatMessageResult.tableId);
            assert.equal('hi', chatMessage.message);
            assert.equal('anonuser', chatMessage.screenName);
        }
    });
    it('bet is forwarded to table', async () => {
        let substituteRepo = processor.dataRepository;
        let table = substitute.for(new table_1.Table(new TableConfig_1.TableConfig("table1", 1, 2, "bcy", "id1")));
        processor.addTable(table);
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage_1.ClientMessage();
        message.bet = new ClientMessage_1.BetRequest();
        message.bet.amount = 5;
        message.bet.tableId = "id1";
        await processor.logAndEnqueue(processor.clients[0], message);
        substituteRepo.receivedWith('saveClientMessage', message, "id1", processor.clients[0].user.guid);
        let args = table.argsForCall('sendBet', 0);
        assert.equal(args[0], 5);
        assert.equal(args[1].guid, processor.clients[0].user.guid);
    });
    it('handleAccountWithdrawlRequest invalid balance', async () => {
        let dataRepositorySub = setupSubstitutedRepository();
        processor.dataRepository.getUserAccount = (guid, currency) => { return Promise.resolve(new DataContainer_1.Account('bcy', 0)); };
        let result = new DataContainer_1.AccountWithdrawlResult();
        result.success = true;
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message1 = new ClientMessage_1.ClientMessage();
        message1.accountWithdrawlRequest = new ClientMessage_1.AccountWithdrawlRequest();
        message1.accountWithdrawlRequest.currency = 'bcy';
        await processor.logAndEnqueue(processor.clients[0], message1);
        let lastMessage = socket.getLastMessage();
        assert.equal(false, lastMessage.accountWithdrawlResult.success);
        assert.equal('Invalid withdrawl amount', lastMessage.accountWithdrawlResult.errorMessage);
    });
    it('handle saveClientMessage  error', async () => {
        let user = new User_1.User();
        let socket = new mockWebSocket_1.MockWebSocket();
        processor.dataRepository.getUser = (guid) => { return Promise.resolve(user); };
        await processor.connection(socket, httpIncomingRequest);
        let message1 = new ClientMessage_1.ClientMessage();
        message1.accountWithdrawlRequest = new ClientMessage_1.AccountWithdrawlRequest();
        message1.accountWithdrawlRequest.currency = Currency_1.Currency.dash;
        processor.clients[0].user = null;
        let err;
        try {
            processor.logAndEnqueue(processor.clients[0], message1);
        }
        catch (error) {
            err = error;
        }
        assert.equal(err, "TypeError: Cannot read property 'guid' of null");
        processor.clients[0].user = user;
        let message2 = new ClientMessage_1.ClientMessage();
        message2.accountWithdrawlRequest = new ClientMessage_1.AccountWithdrawlRequest();
        message2.accountWithdrawlRequest.currency = Currency_1.Currency.dash;
        await processor.logAndEnqueue(processor.clients[0], message2);
        let lastMessage = socket.getLastMessage();
        assert.equal(false, lastMessage.accountWithdrawlResult.success);
        assert.equal('Invalid withdrawl amount', lastMessage.accountWithdrawlResult.errorMessage);
    });
    it('handleAccountWithdrawlRequest error', async () => {
        let dataRepositorySub = setupSubstitutedRepository();
        dataRepositorySub.returns('updateUserAccount', Promise.resolve({ "result": { "nModified": 0 } }));
        dataRepositorySub.returns('getUser', Promise.resolve(null));
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message1 = new ClientMessage_1.ClientMessage();
        message1.accountWithdrawlRequest = new ClientMessage_1.AccountWithdrawlRequest();
        message1.accountWithdrawlRequest.currency = 'dash';
        message1.accountWithdrawlRequest.receivingAddress = 'address1';
        message1.accountWithdrawlRequest.amount = '1000000';
        let [err, data] = await (0, CommonHelpers_1.default)(processor.logAndEnqueue(processor.clients[0], message1));
        assert.equal(err, 'Error: updateUserAccount: expecting update to exactly 1 document instead {"nModified":0} for player: ABCDEF accountWithdrawlRequest: {"currency":"dash","receivingAddress":"address1","amount":"1000000"}');
    });
    it('handleAccountWithdrawlRequest', async () => {
        let dataRepositorySub = setupSubstitutedRepository();
        dataRepositorySub.returns('getUser', Promise.resolve(null));
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message1 = new ClientMessage_1.ClientMessage();
        message1.accountWithdrawlRequest = new ClientMessage_1.AccountWithdrawlRequest();
        message1.accountWithdrawlRequest.currency = 'dash';
        message1.accountWithdrawlRequest.receivingAddress = 'address1';
        message1.accountWithdrawlRequest.amount = '1000000';
        await processor.logAndEnqueue(processor.clients[0], message1);
        connectionToPaymentServer.receivedWith('send', substitute.arg.matchUsing((r) => {
            if (r != null) {
                assert.equal(r.constructor.name, CheckPaymentsTrigger_1.CheckPaymentsTrigger.name);
                return true;
            }
            return false;
        }));
        dataRepositorySub.receivedWith('updateUserAccount', 'ABCDEF', Currency_1.Currency.dash, -1000000, 0);
        dataRepositorySub.receivedWith('savePayment', substitute.arg.matchUsing((payment) => {
            if (payment != null) {
                assert.equal(payment.amount, 1000000);
                assert.equal(payment.status, PaymentStatus_1.PaymentStatus.pending);
                return true;
            }
            return false;
        }));
        let lastMessage = socket.getLastMessage();
        assert.equal(true, lastMessage.accountWithdrawlResult.success);
    });
    it('removeIdlePlayers', async () => {
        let dataRepositorySub = setupSubstitutedRepository();
        await processor.setupNewTable(new TableConfig_1.TableConfig("table1", 1, 2, Currency_1.Currency.free, "id1"));
        let table = processor.getTables()[0];
        table.idleTimeSec = 120;
        table.dataRepository = dataRepositorySub;
        let user1 = new User_1.User();
        user1.guid = 'guid1';
        let user2 = new User_1.User();
        user2.guid = 'guid2';
        let user3 = new User_1.User();
        user3.guid = 'guid3';
        table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(1, user1.guid, user1.screenName, user1.gravatar, 1000));
        table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(2, user2.guid, user2.screenName, user2.gravatar, 1000));
        table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(3, user3.guid, user3.screenName, user3.gravatar, 1000));
        let players = table.getPlayers();
        assert.equal(players.length, 3);
        players[1].isSittingOut = true;
        players[1].sittingOutSince = new Date(new Date().getTime() - 2 * 60000);
        players[2].isSittingOut = true;
        players[2].sittingOutSince = new Date(new Date().getTime() - 1 * 60000);
        await processor.checkIdlePlayers();
        assert.equal(table.getPlayers().length, 2);
        assert.equal(table.getPlayers()[0].guid, 'guid1');
        assert.equal(table.getPlayers()[1].guid, 'guid3');
        dataRepositorySub.receivedWith('updateUserAccount', 'guid2', 'usd', 1000);
    });
    let setupLoginTest = () => {
        let user = new User_1.User();
        user.activated = false;
        user.password = '$2a$05$iDZW.wlhW92whK7I.if.6e4aDxn1H8yBmW1tQ90Hu9na6Y3MBYnfO';
        processor.dataRepository.getUserByEmail = (guid) => { return Promise.resolve(user); };
        return user;
    };
    it('login_authenticate_success', async () => {
        let user = setupLoginTest();
        user.activated = true;
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage_1.ClientMessage();
        message.loginRequest = new login_request_1.LoginRequest("foo@bar.com", "fred");
        await processor.logAndEnqueue(processor.clients[0], message);
        let lastMessage = socket.getLastMessage();
        assert.equal(lastMessage.loginResult.success, true);
        assert.equal(processor.clients[0].authenticated, true);
    });
    it('login_authenticate_account_not_activated', async () => {
        setupLoginTest();
        let socket = new mockWebSocket_1.MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage_1.ClientMessage();
        message.loginRequest = new login_request_1.LoginRequest("foo@bar.com", "fred");
        await processor.logAndEnqueue(processor.clients[0], message);
        let lastMessage = socket.getLastMessage();
        assert.equal(lastMessage.loginResult.success, false);
        assert.equal(lastMessage.loginResult.errorMessage, 'Account not activated! Please check your email to confirm registration');
        assert.equal(processor.clients[0].authenticated, false);
    });
    it('convertToDeciGwei', function () {
        let result = shared_helpers_1.SharedHelpers.convertToDeciGwei("50000000000000000");
        assert.equal(result, 5000000);
    });
    it('convertToWei', function () {
        let result = shared_helpers_1.SharedHelpers.convertToWei(5000000);
        assert.equal(result, 50000000000000000);
    });
});
//# sourceMappingURL=poker-processor-fixture.js.map