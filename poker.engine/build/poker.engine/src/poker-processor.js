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
exports.PokerProcessor = void 0;
const login_request_1 = require("./../../poker.ui/src/shared/login-request");
const decimal_1 = require("./../../poker.ui/src/shared/decimal");
const WebSocketHandle_1 = require("./model/WebSocketHandle");
const User_1 = require("./model/User");
const DataContainer_1 = require("../../poker.ui/src/shared/DataContainer");
const Currency_1 = require("../../poker.ui/src/shared/Currency");
const PaymentType_1 = require("../../poker.ui/src/shared/PaymentType");
const helpers_1 = require("./helpers");
const protobuf_helpers_1 = require("./protobuf-helpers");
var logger = require('log4js').getLogger();
var _ = require('lodash');
const encryption = __importStar(require("./framework/encryption"));
var url = require('url');
const handlerUtils = __importStar(require("./handlers/handler-utils"));
const environment_1 = __importDefault(require("./environment"));
const protobuf_config_1 = __importDefault(require("./../../poker.ui/src/shared/protobuf-config"));
const TableProcessor_1 = require("./admin/processor/table-processor/TableProcessor");
const TimerProvider_1 = require("./model/table/TimerProvider");
const ip_lookup_1 = require("./ip-lookup");
class PokerProcessor {
    constructor(dataRepository) {
        this.dataRepository = dataRepository;
        this.handlers = {};
        this.ipLookup = new ip_lookup_1.IpLookup();
        this.blockedCountries = [];
        this.tables = [];
        this.clients = [];
        this.dataRepository = dataRepository;
    }
    addHandler(handler) {
        this.handlers[handler.typeName] = handler;
    }
    async init() {
        this.blockedCountries = (await this.dataRepository.getBlockedCountries()).map(x => x.countryCode);
        await this.loadTables();
        for (let key in this.handlers)
            await this.handlers[key].init();
    }
    async loadTables() {
        this.tables = [];
        let tableConfig = await this.dataRepository.getTablesConfig();
        await this.setupTables(tableConfig);
    }
    async setupTables(tableConfig) {
        for (let config of tableConfig) {
            await this.setupNewTable(config);
        }
    }
    async setupNewTable(config) {
        let table = await (0, helpers_1.setupTable)(config, this.dataRepository, new TableProcessor_1.TableProcessor(this.dataRepository, null), (p) => new TimerProvider_1.TimerProvider(p));
        this.addTable(table);
    }
    getTables() {
        return this.tables;
    }
    async updateTable(config) {
        let table = this.tables.find(t => t.tableConfig._id.toString() == config._id.toString());
        if (table) {
            Object.assign(table.tableConfig, config);
        }
        else {
            await this.setupNewTable(config);
        }
    }
    removeTable(id) {
        let table = this.tables.find(t => t.tableConfig._id.toString() == id);
        if (table)
            (0, helpers_1.removeItem)(this.tables, table);
    }
    removeTables(options) {
        for (let i = this.tables.length - 1; i >= 0; i--) {
            if (this.tables[i].tournamentId == options.tournamentId) {
                (0, helpers_1.removeItem)(this.tables, this.tables[i]);
            }
        }
    }
    addTable(table) {
        table.broadcastService = this;
        this.tables.push(table);
        this.tables.sort((t1, t2) => { return t1.tableConfig.orderIndex - t2.tableConfig.orderIndex; });
    }
    async verifyClient(info, done) {
        let query = url.parse(info.req.url, true).query;
        let sessionCookie;
        if (query.sid) {
            try {
                sessionCookie = JSON.parse(encryption.decrypt(query.sid));
            }
            catch (error) {
                logger.info(`decrypt sid failed: ${error}`);
            }
        }
        let user;
        let guid;
        if (sessionCookie) {
            user = await this.dataRepository.getUser(sessionCookie.guid);
            if (user && !user.disabled) {
                guid = sessionCookie.guid;
            }
            else {
                user = null;
            }
        }
        info.req.customData = { user: user, sid: query.sid, guid: guid, version: query.version };
        done(true);
    }
    async connection(ws, request) {
        let customData = request.customData;
        let user = customData.user;
        let guidCookie = this.getCookie(request.headers, "guid");
        let data = new DataContainer_1.DataContainer();
        let wsHandle = new WebSocketHandle_1.WebSocketHandle(ws);
        wsHandle.onerror = () => { this.handleClose(wsHandle); };
        wsHandle.ipAddress = (0, helpers_1.getIpAddress)(ws, request);
        if (user != null) {
            wsHandle.setUser(user);
            data.loginResult = new login_request_1.LoginResult();
            data.loginResult.success = true;
            data.loginResult.sid = customData.sid;
            wsHandle.authenticated = true;
        }
        if (!wsHandle.user) {
            if (guidCookie) {
                let user = await this.dataRepository.getUser(guidCookie);
                if (!user) {
                    user = new User_1.User();
                    user.guid = guidCookie;
                    user.setScreenName();
                }
                wsHandle.setUser(user);
            }
            else {
                logger.info('no cookie sent?');
            }
        }
        ws.on('message', (message) => {
            try {
                if (message.buffer && message.buffer.constructor.name === 'ArrayBuffer') {
                    let clientMessage = protobuf_config_1.default.deserialize(message, 'ClientMessage');
                    this.logAndEnqueue(wsHandle, clientMessage);
                }
                else {
                    logger.info(`message is not an ArrayBuffer:`, message);
                }
            }
            catch (e) {
                logger.warn('invalid message: ' + e, message);
            }
        });
        ws.on('close', () => {
            this.handleClose(wsHandle);
        });
        ws.on('error', (e) => {
            logger.info(`ws.on error: ${wsHandle.user.screenName} ${e}`);
            this.handleClose(wsHandle);
        });
        if (wsHandle.user) {
            let userData = await (0, helpers_1.getUserData)(wsHandle.user, this.dataRepository);
            data.user = userData;
            data.version = new DataContainer_1.Version(environment_1.default.version, process.env.POKER_SITE_NAME, process.env.POKER_FROM_EMAIL, process.env.POKER_CDN);
            let ipLookupResult = this.ipLookup.lookup(wsHandle.ipAddress);
            let country = '';
            if (ipLookupResult) {
                country = ipLookupResult.countryName;
                if (this.isAllowedCountry(ipLookupResult.countryCode)) {
                    wsHandle.countryCode = ipLookupResult.countryCode;
                    wsHandle.country = country;
                }
            }
            let sameIpAddressClient = this.clients.find(c => c.ipAddress == wsHandle.ipAddress);
            this.clients.push(wsHandle);
            data.globalUsers = this.getGlobalUsers();
            wsHandle.send(data);
            this.broadcastUserStatus(wsHandle, true);
            if (!environment_1.default.debug && sameIpAddressClient != null) {
                let data = new DataContainer_1.DataContainer();
                data.duplicateIpAddress = new DataContainer_1.DuplicateIpAddress();
                sameIpAddressClient.send(data);
                setTimeout(() => {
                    this.handleClose(sameIpAddressClient);
                }, 5000);
            }
        }
        return wsHandle.user ? wsHandle : null;
    }
    isAllowedCountry(countryCode) {
        return this.blockedCountries.find(c => c == countryCode) == null;
    }
    handleClose(wsHandle) {
        wsHandle.socket.terminate();
        let wasRemoved = (0, helpers_1.removeItem)(this.clients, wsHandle);
        let online = this.clients.find(c => c.user.screenName == wsHandle.user.screenName) != null;
        logger.info(`${wsHandle.user.screenName} online: ${online}`);
        this.broadcastUserStatus(wsHandle, online);
        for (let table of this.tables) {
            table.onClientDisconnected(wsHandle);
        }
        this.tournamentLogic.removeSubscriber(wsHandle);
        logger.info(`${wsHandle.user.screenName}:${wsHandle.id} disconnected. wasRemoved:${wasRemoved} clients.length: ${this.clients.length}`);
    }
    logAndEnqueue(wsHandle, message) {
        this.saveClientMessage(wsHandle, message);
        return this.onSocketMessage(wsHandle, message);
    }
    saveClientMessage(wsHandle, message) {
        if (message.ping == null) {
            let tableId = this.getTableId(message);
            return this.dataRepository.saveClientMessage(message, tableId, wsHandle.user.guid);
        }
        return Promise.resolve();
    }
    async onSocketMessage(wsHandle, data) {
        for (let key in data) {
            let handler = this.handlers[key];
            if (handler != null) {
                await handler.run(wsHandle, data);
            }
            else {
                await this.handleMessageWithNoHandler(wsHandle, data);
            }
        }
    }
    async handleMessageWithNoHandler(wsHandle, data) {
        if (data.logoutRequest != null) {
            if (wsHandle.authenticated) {
                wsHandle.authenticated = false;
                this.broadcastUserStatus(wsHandle, false);
                let dc = new DataContainer_1.DataContainer();
                dc.logoutResult = new login_request_1.LogoutResult();
                wsHandle.send(dc);
            }
        }
        else if (data.ping != null) {
            let data = new DataContainer_1.DataContainer();
            wsHandle.lastPing = new Date();
            data.pong = {};
            wsHandle.send(data);
        }
        else if (data.fold != null) {
            let table = this.findTable(data.fold.tableId);
            if (table != null) {
                table.sendFold(wsHandle.user.toSmall());
            }
        }
        else if (data.bet != null) {
            let table = this.findTable(data.bet.tableId);
            if (table != null) {
                table.sendBet(data.bet.amount, wsHandle.user.toSmall());
            }
        }
        else if (data.setTableOptionRequest != null) {
            let table = this.findTable(data.setTableOptionRequest.tableId);
            if (table) {
                let tMessage = new TableProcessor_1.TableProcessorMessage(table);
                tMessage.setTableOptionRequest = { user: wsHandle.user.toSmall(), request: data.setTableOptionRequest };
                table.sendTableProcessorMessage(tMessage);
            }
        }
        else if (data.leaveTableRequest != null) {
            let table = this.findTable(data.leaveTableRequest.tableId);
            if (table) {
                let player = table.findPlayer(wsHandle.user.guid);
                if (player) {
                    if (table.currentPlayers && table.currentPlayers.indexOf(player) > -1) {
                        let errorMessage = `You are still playing at table '${table.tableConfig.name}'!`;
                        wsHandle.sendError(errorMessage);
                    }
                    else {
                        await table.sendLeaveTable(wsHandle.user.toSmall());
                    }
                }
            }
        }
        else if (data.chatRequest != null) {
            let table = this.findTable(data.chatRequest.tableId);
            if (table != null) {
                table.handleChat(wsHandle.user.screenName, data.chatRequest.message, true);
            }
        }
        else if (data.cashOutRequest != null) {
            this.handleCashOutRequest(wsHandle);
        }
        else if (data.getAccountSettingsRequest != null) {
            let data = new DataContainer_1.DataContainer();
            data.accountSettings = handlerUtils.getAccountSettingsResult(wsHandle);
            wsHandle.send(data);
        }
        else if (data.exchangeRatesRequest != null) {
            let dc = new DataContainer_1.DataContainer();
            dc.exchangeRates = new DataContainer_1.ExchangeRateResult();
            dc.exchangeRates.rates = await this.dataRepository.getExchangeRates();
            wsHandle.send(dc);
        }
        else {
            logger.warn('no handler for message: ', JSON.stringify(data));
        }
    }
    async handleCashOutRequest(wsHandle) {
        let guid = wsHandle.user.guid;
        let data = new DataContainer_1.DataContainer();
        data.cashOutRequestResult = new DataContainer_1.CashOutRequestResult();
        let accounts = await this.dataRepository.getUserAccounts(guid);
        for (let account of accounts.filter(acc => acc.currency !== Currency_1.Currency.free)) {
            let cashOutAccount = new DataContainer_1.CashOutAccount();
            cashOutAccount.balance = account.balance;
            cashOutAccount.currency = account.currency;
            let payments = (await this.dataRepository.getPayments({ guid: guid, currency: account.currency })).filter(p => p.type == PaymentType_1.PaymentType.outgoing && !helpers_1.Helpers.isNullOrWhitespace(p.address));
            if (payments.length) {
                let groups = _.groupBy(payments, (r) => r.address);
                let f1 = Object.keys(groups).map((key) => groups[key]);
                let ordered = _.orderBy(f1, ['length', (arr) => _.first(arr).timestamp], ['desc', 'desc']);
                cashOutAccount.refundAddress = _.first(ordered)[0].address;
                cashOutAccount.refundAddressCount = _.first(ordered).length;
            }
            data.cashOutRequestResult.accounts.push(cashOutAccount);
        }
        for (let table of this.tables) {
            let player = table.findPlayer(guid);
            if (player) {
                let account = data.cashOutRequestResult.accounts.find(acc => acc.currency === table.tableConfig.currency);
                if (account)
                    account.balance += player.stack;
            }
        }
        for (let cashOutAccount of data.cashOutRequestResult.accounts) {
            let config = await this.dataRepository.getCurrencyConfig(cashOutAccount.currency);
            let balance = new decimal_1.Decimal(cashOutAccount.balance).dividedBy(Currency_1.CurrencyUnit.getCurrencyUnit(cashOutAccount.currency));
            cashOutAccount.insufficientBalance = balance.lessThan(new decimal_1.Decimal(config.minimumWithdrawl));
        }
        wsHandle.send(data);
    }
    async checkIdlePlayers() {
        let arr = [];
        for (let table of this.tables.filter(t => t.getPlayerCount())) {
            let playerHandles = table.getPlayersToEvict();
            if (playerHandles.length) {
                let tMessage = new TableProcessor_1.TableProcessorMessage(table);
                tMessage.checkIdlePlayers = playerHandles.map(h => { return { guid: h.guid, screenName: h.screenName }; });
                let result = await table.sendTableProcessorMessage(tMessage);
                if (table.tournamentId && result.evictedPlayers.length) {
                    let tournament = arr.find(a => a.tournamentId == table.tournamentId);
                    if (!tournament) {
                        tournament = { tournamentId: table.tournamentId, handles: [] };
                        arr.push(tournament);
                    }
                    tournament.handles.push(...result.evictedPlayers);
                }
            }
        }
        if (arr.length) {
            for (let tournament of arr) {
                let processor = this.tournamentLogic.getTableProcessor(tournament.tournamentId);
                let tMessage = new TableProcessor_1.TableProcessorMessage(null);
                tMessage.evictingIdleTournamentPlayers = { tournamentId: tournament.tournamentId, playerHandles: tournament.handles };
                processor.sendMessage(tMessage);
            }
        }
    }
    onScreenNameChanged(wsHandle, oldName, newName) {
        for (let table of this.tables)
            table.updateScreenName(wsHandle.user.guid, newName, wsHandle.user.gravatar);
        this.broadcastUserStatusNameChanged(oldName, newName);
    }
    broadcastUserStatusNameChanged(oldName, newName) {
        let users = [
            new DataContainer_1.UserStatus(oldName, false),
            new DataContainer_1.UserStatus(newName, true)
        ];
        let data = new DataContainer_1.DataContainer();
        data.globalUsers = new DataContainer_1.GlobalUsers();
        data.globalUsers.users = users;
        this.broadcast(data);
    }
    broadcast(data, excludeGuid) {
        (0, protobuf_helpers_1.broadcast)(this.clients, data, excludeGuid);
    }
    getTableId(data) {
        if (data.bet != null)
            return data.bet.tableId;
        if (data.joinTableRequest != null)
            return data.joinTableRequest.tableId;
        if (data.subscribeToTableRequest != null)
            return data.subscribeToTableRequest.tableId;
        if (data.fold != null)
            return data.fold.tableId;
        if (data.setTableOptionRequest != null)
            return data.setTableOptionRequest.tableId;
        if (data.leaveTableRequest != null)
            return data.leaveTableRequest.tableId;
        return null;
    }
    isInt(value) {
        var x;
        return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
    }
    broadcastUserStatus(wsHandle, online) {
        let data = new DataContainer_1.DataContainer();
        data.globalUsers = new DataContainer_1.GlobalUsers();
        data.globalUsers.users = [(0, helpers_1.toUserStatus)(wsHandle, online)];
        this.broadcast(data, wsHandle.user.guid);
    }
    getGlobalUsers() {
        let globalUsers = new DataContainer_1.GlobalUsers();
        globalUsers.initialData = true;
        globalUsers.users = this.clients.map(client => (0, helpers_1.toUserStatus)(client, true));
        return globalUsers;
    }
    findTable(id) {
        let table = this.tables.find(t => t.tableConfig._id.toString() === id);
        if (table == null) {
            logger.info(`unknown table ${id} ${new Error().stack}`);
        }
        return table;
    }
    pingClients() {
        for (let client of this.clients) {
            let pingTime = new Date().getTime() - client.lastPing.getTime();
            if (pingTime > 40000) {
                if (client.user) {
                    logger.info(`disconnecting ${client.user.screenName} due to ping ${pingTime}`);
                }
                client.terminate();
            }
        }
    }
    getCookie(headers, cookieName) {
        var list = {}, rc = headers.cookie;
        rc && rc.split(';').forEach((cookie) => {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
        return list[cookieName];
    }
    async relayUserData(guids) {
        for (let guid of guids) {
            let client = this.findClient(guid);
            if (client) {
                let user = await this.dataRepository.getUser(guid);
                let data = new DataContainer_1.DataContainer();
                data.user = await (0, helpers_1.getUserData)(user, this.dataRepository, false);
                client.send(data);
            }
        }
    }
    findClient(guid) {
        return this.clients.find(c => c.user.guid == guid);
    }
    async send(guid, dataFunc) {
        let client = this.findClient(guid);
        if (client) {
            let data = await dataFunc();
            client.send(data);
        }
    }
}
exports.PokerProcessor = PokerProcessor;
//# sourceMappingURL=poker-processor.js.map