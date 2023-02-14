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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminServer = void 0;
const tournament_view_1 = require("./../../../poker.admin.ui.angular/src/app/shared/tournament-view");
const user_detail_view_1 = require("./../../../poker.admin.ui.angular/src/app/shared/user-detail-view");
const express = require("express");
var bodyParser = require('body-parser');
const http = require("http");
const helpers_1 = require("../helpers");
const tournament_1 = require("../model/tournament");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
const _ = __importStar(require("lodash"));
const TournmanetStatus_1 = require("../../../poker.ui/src/shared/TournmanetStatus");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const WebSocket = require("ws");
const GameServerProcessorMessage_1 = require("./processor/GameServerProcessorMessage");
const AwardPrizesRequest_1 = require("./processor/model/AwardPrizesRequest");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const TableConfig_1 = require("../model/TableConfig");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
var cors = require('cors');
class AdminServer {
    constructor(dataRepository, pokerProcessor, connectionToPaymentServer, processor) {
        this.dataRepository = dataRepository;
        this.pokerProcessor = pokerProcessor;
        this.connectionToPaymentServer = connectionToPaymentServer;
        this.processor = processor;
    }
    init() {
        this.app = express();
        this.app.use(cors({ origin: '*' }));
        this.app.use(bodyParser.json());
        const server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server });
        this.setupEndpoints();
        server.listen(8112, function listening() { logger.info('Listening on %d', server.address().port); });
    }
    setupEndpoints() {
        let app = this.app;
        this.wss.on('connection', (socket, httpReq) => {
            this.connectionToPaymentServer.onConnection(socket, httpReq);
        });
        app.get('/api/admin', async (req, res) => {
            let configs = await this.dataRepository.getAdmins();
            res.send(configs);
        });
        app.post('/api/admin', async (req, res) => {
            await this.dataRepository.saveAdmin(req.body);
            res.send({ sucess: true });
        });
        app.get('/api/currencies', async (req, res) => {
            let configs = await this.dataRepository.getCurrencyConfigs();
            let currencies = configs.map(x => x.name);
            res.send(currencies);
        });
        app.get('/api/tables', async (req, res) => {
            let arr = [];
            if (req.query.tournamentId) {
                let states = await this.dataRepository.getTableStates({ tournamentId: req.query.tournamentId });
                let count = 0;
                for (let state of states) {
                    count++;
                    let config = new TableConfig_1.TableConfig();
                    config._id = state._id + '';
                    config.name = `Table ${count}`;
                    arr.push(config);
                }
            }
            else {
                arr = await this.dataRepository.getTablesConfig();
            }
            res.send(arr);
        });
        app.post('/api/tables', async (req, res) => {
            var table = req.body;
            table.smallBlindUsd = parseFloat(table.smallBlindUsd);
            table.bigBlindUsd = parseFloat(table.bigBlindUsd);
            table.timeToActSec = parseFloat(table.timeToActSec);
            table.maxPlayers = parseFloat(table.maxPlayers);
            table.orderIndex = parseFloat(table.orderIndex);
            table.maxBuyIn = parseInt(table.maxBuyIn);
            table.rake = parseFloat(table.rake);
            table.currency = table.currency.toLowerCase();
            await this.dataRepository.saveTableConfig(table);
            this.pokerProcessor.updateTable(table);
            res.send(table);
        });
        app.delete('/api/tables', async (req, res) => {
            await this.dataRepository.deleteTableConfig(req.query.id);
            this.pokerProcessor.removeTable(req.query.id);
            res.send('');
        });
        app.get('/api/games', async (req, res) => {
            let arr = await this.dataRepository.getGames(req.query.tableId, req.query.userGuid, req.query.tournamentId, 0, 200);
            res.send(arr);
        });
        app.post('/shutdown', (req, res) => {
            logger.info('received shutdown');
            let promises = [];
            for (let table of this.pokerProcessor.getTables()) {
                promises.push(table.shutdown());
            }
            Promise.all(promises)
                .then(() => {
                res.send({ message: 'table shutdown complete.' });
            });
        });
        app.get('/api/payments-since', async (req, res) => {
            let arr = await this.dataRepository.getPaymentsSince(req.query.id);
            res.send(arr);
        });
        app.get('/api/payments', async (req, res) => {
            let payments = await this.dataRepository.getPayments(req.query);
            res.send(payments);
        });
        app.get('/api/users', async (req, res) => {
            let arr = await this.dataRepository.getUsers(req.query.searchTerm, parseInt(req.query.count), !!req.query.includeAnon);
            res.send(arr);
        });
        app.delete('/api/user', async (req, res) => {
            await this.dataRepository.deleteUser(req.query.guid);
            res.send({ success: true });
        });
        app.get('/api/user', async (req, res) => {
            let view = await this.getUserDetailView(req.query.guid);
            res.send(view);
        });
        app.post('/api/user', async (req, res) => {
            let view = req.body;
            let dbUser = await this.dataRepository.getUser(view.guid);
            let password = dbUser.password;
            delete view.accounts;
            _.assign(dbUser, _.pick(view, _.keys(view)));
            if (view.password) {
                dbUser.password = await (0, helpers_1.hashPassword)(view.password);
            }
            else {
                dbUser.password = password;
            }
            await this.dataRepository.saveUser(dbUser);
            res.send({ success: true, user: await this.getUserDetailView(view.guid) });
        });
        app.get('/api/addressInfo', async (req, res) => {
            let arr = await this.dataRepository.getAddressInfoSince(req.query.id);
            res.send(arr);
        });
        app.get('/api/user-reconcilliation', async (req, res) => {
            let view = await this.dataRepository.getReconcilliationView();
            res.send(view);
        });
        app.post('/api/user-reconcilliation', async (req, res) => {
        });
        app.post('/api/merge-user', async (req, res) => {
        });
        app.get('/api/tournaments', async (req, res) => {
            let tournmanets;
            if (req.query.id) {
                let tournmanet = await this.dataRepository.getTournmanetById(req.query.id);
                tournmanets = [tournmanet];
            }
            else {
                tournmanets = await this.dataRepository.getTournaments({}, 5);
            }
            let arr = [];
            for (let tournmanet of tournmanets) {
                let view = this.getTournmanetView(tournmanet);
                if (tournmanets.length == 1) {
                    view.registrations = await this.getTournamentRegistrations(tournmanet._id.toString());
                }
                arr.push(view);
            }
            res.send(arr);
        });
        app.post('/api/tournaments', async (req, res) => {
            let view = req.body;
            let tournament = await this.dataRepository.getTournmanetById(view._id);
            if (!tournament) {
                tournament = new tournament_1.Tournament();
            }
            _.assign(tournament, _.pick(view, _.keys(new tournament_view_1.TournmanetView())));
            tournament.currency = tournament.currency.toLowerCase();
            tournament.startingChips = parseInt(tournament.startingChips);
            tournament.playersPerTable = parseInt(tournament.playersPerTable);
            tournament.minPlayers = parseInt(tournament.minPlayers);
            tournament.maxPlayers = parseInt(tournament.maxPlayers);
            tournament.timeToActSec = parseInt(tournament.timeToActSec);
            tournament.lateRegistrationMin = parseInt(tournament.lateRegistrationMin);
            tournament.awardPrizesAfterMinutes = parseInt(tournament.awardPrizesAfterMinutes);
            tournament.mailchimpSendTimeMin = parseInt(tournament.mailchimpSendTimeMin) || null;
            tournament.telegramSendTimeMin = parseInt(tournament.telegramSendTimeMin) || null;
            tournament.rebuyForMin = parseInt(tournament.rebuyForMin) || null;
            for (let blindConfig of tournament.blindConfig) {
                blindConfig.smallBlind = parseInt(blindConfig.smallBlind);
                blindConfig.bigBlind = parseInt(blindConfig.bigBlind);
                blindConfig.timeMin = parseInt(blindConfig.timeMin);
            }
            tournament.prizes = tournament.prizes.filter(p => p && !isNaN(parseFloat(p)));
            if (!isNaN(parseFloat(tournament.buyIn))) {
                tournament.buyIn = tournament.buyIn + '';
            }
            else {
                tournament.buyIn = '';
            }
            if (!isNaN(parseFloat(tournament.housePrize))) {
                tournament.housePrize = tournament.housePrize + '';
            }
            else {
                tournament.housePrize = '';
            }
            if (!isNaN(parseFloat(tournament.rebuyAmount))) {
                tournament.rebuyAmount = tournament.rebuyAmount + '';
            }
            else {
                tournament.rebuyAmount = '';
            }
            await this.dataRepository.saveTournmanet(tournament);
            tournament = await this.dataRepository.getTournmanetById(tournament._id.toString());
            let returnedView = this.getTournmanetView(tournament);
            returnedView.registrations = await this.getTournamentRegistrations(tournament._id.toString());
            res.send({ success: true, tournament: returnedView });
            let data = new DataContainer_1.DataContainer();
            data.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
            data.tournamentSubscriptionResult.tournaments.push(await (0, helpers_1.getTournamentViewRow)(tournament, this.dataRepository));
            this.pokerProcessor.broadcast(data);
        });
        app.get('/api/tournamentResults', async (req, res) => {
            let tournament = await this.dataRepository.getTournmanetById(req.query.tournamentId);
            let adminTournamentResultsView = await (0, helpers_1.getAdminTournamentResultsView)(tournament, this.dataRepository);
            res.send(adminTournamentResultsView.view);
        });
        app.post('/api/awardPrizes', async (req, res) => {
            let tournament = await this.dataRepository.getTournmanetById(req.query.tournamentId);
            let adminTournamentResultsView = await (0, helpers_1.getAdminTournamentResultsView)(tournament, this.dataRepository);
            let pMessage = new GameServerProcessorMessage_1.GameServerProcessorMessage();
            pMessage.awardPrizesRequest = new AwardPrizesRequest_1.AwardPrizesRequest(req.query.tournamentId, adminTournamentResultsView);
            let pResult = await this.processor.sendMessage(pMessage);
            res.send(pResult.awardPrizesResult);
        });
        app.delete('/api/tournaments', async (req, res) => {
            await this.dataRepository.deleteTournmanet(req.query.id);
            res.send({ success: true });
        });
        app.get('/api/dumpState', async (req, res) => {
            res.setHeader('Content-disposition', 'attachment; filename=' + 'state.json');
            res.setHeader('Content-type', 'text/plain');
            let state = this.getState();
            res.send(state);
        });
        app.post('/api/addFundsToAccount', async (req, res) => {
            let request = req.body;
            let result = {};
            if (!request.currency || !request.comment || !isNaN(parseFloat(req.amount))) {
                result.message = 'Please fill out all fields';
            }
            else {
                let pMessage = new GameServerProcessorMessage_1.GameServerProcessorMessage();
                request.amount = new decimal_1.Decimal(request.amount).mul(Currency_1.CurrencyUnit.getCurrencyUnit(request.currency)).toString();
                request.comment = `Manual Payment: ${request.comment}`;
                pMessage.manualFundAccountRequest = request;
                let pResult = await this.processor.sendMessage(pMessage);
                result.success = pResult.manualFundAccountResult.success;
                result.message = pResult.manualFundAccountResult.message;
                result.user = await this.getUserDetailView(request.guid);
            }
            res.send(result);
        });
        app.get('/api/userBalances', async (req, res) => {
            let arr = await this.dataRepository.getUserBalances(req.query.currency);
            res.send(arr);
        });
    }
    getState() {
        let state = {
            clients: [],
            tables: []
        };
        let getSubscriber = (client) => {
            return {
                user: client.user.toSmall(),
                id: client.id,
                ipAddress: client.ipAddress,
                isAlive: client.isAlive,
                lastPing: client.lastPing,
                authenticated: client.authenticated,
                countryCode: client.countryCode,
                country: client.country,
            };
        };
        for (let client of this.pokerProcessor.clients) {
            state.clients.push(getSubscriber(client));
        }
        for (let t1 of this.pokerProcessor.getTables()) {
            let table = {
                tableConfig: t1.tableConfig,
                players: t1.getPlayers(),
                currentPlayers: t1.currentPlayers,
                gameStarting: t1.gameStarting,
                dealerSeat: t1.dealerSeat,
                playerNextToActIndex: t1.playerNextToActIndex,
                toCall: t1.toCall,
                lastRaise: t1.lastRaise,
                lastToActIndex: t1.lastToActIndex,
                firstToActIndex: t1.firstToActIndex,
                street: t1.street,
                gameState: t1.gameState,
                pendingExchangeRate: t1.pendingExchangeRate,
                tournamentId: t1.tournamentId,
                blindConfig: t1.blindConfig,
                blindsStartTime: t1.blindsStartTime,
                subscribers: []
            };
            for (let subscriber of t1.subscribers) {
                table.subscribers.push(getSubscriber(subscriber));
            }
            state.tables.push(table);
        }
        return state;
    }
    getTournmanetView(tournmanet) {
        let view = new tournament_view_1.TournmanetView();
        _.assign(view, _.pick(tournmanet, _.keys(view)));
        view._id = tournmanet._id.toString();
        view.statusText = TournmanetStatus_1.TournmanetStatus[tournmanet.status];
        return view;
    }
    async getTournamentRegistrations(id) {
        let dbRegistrations = await this.dataRepository.getTournamentRegistrations({ tournamentId: id });
        let arr = [];
        for (let registration of dbRegistrations) {
            let user = await this.dataRepository.getUser(registration.userGuid);
            if (user) {
                arr.push({ guid: registration.userGuid, screenName: user.screenName, email: user.email });
            }
        }
        return arr;
    }
    async getUserDetailView(guid) {
        let dbUser = await this.dataRepository.getUser(guid);
        let accounts = await this.dataRepository.getUserAccounts(guid);
        let view = new user_detail_view_1.UserDetailView();
        _.assign(view, _.pick(dbUser, _.keys(view)));
        for (let account of accounts) {
            account.balance = new decimal_1.Decimal(account.balance).dividedBy(Currency_1.CurrencyUnit.getCurrencyUnit(account.currency)).toNumber();
            view.accounts.push(new user_detail_view_1.AccountView(account.currency, account.balance));
        }
        view.password = null;
        return view;
    }
}
exports.AdminServer = AdminServer;
//# sourceMappingURL=AdminServer.js.map