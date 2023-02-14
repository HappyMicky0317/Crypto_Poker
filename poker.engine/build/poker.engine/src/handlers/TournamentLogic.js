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
exports.TournamentLogic = void 0;
const telegram_service_1 = require("./../framework/telegram/telegram.service");
const DataContainer_1 = require("./../../../poker.ui/src/shared/DataContainer");
const Currency_1 = require("./../../../poker.ui/src/shared/Currency");
const log4js_1 = require("log4js");
const TournmanetStatus_1 = require("../../../poker.ui/src/shared/TournmanetStatus");
const helpers_1 = require("../helpers");
const protobuf_helpers_1 = require("../protobuf-helpers");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const TableConfig_1 = require("../model/TableConfig");
const TournamentResult_1 = require("../model/TournamentResult");
const tournmanet_view_row_1 = require("../../../poker.ui/src/shared/tournmanet-view-row");
const ChangeSeatingLogic_1 = require("../tournament/ChangeSeatingLogic");
const ChangeSeatHistory_1 = require("../model/ChangeSeatHistory");
const UserSmall_1 = require("../model/UserSmall");
const TableProcessor_1 = require("../admin/processor/table-processor/TableProcessor");
const JoinTableRequest_1 = require("../model/table/JoinTableRequest");
const TournamentResultView_1 = require("../../../poker.ui/src/shared/TournamentResultView");
const _ = __importStar(require("lodash"));
const GameServerProcessorMessage_1 = require("../admin/processor/GameServerProcessorMessage");
const AwardPrizesRequest_1 = require("../admin/processor/model/AwardPrizesRequest");
const TournamentHandle_1 = require("./TournamentHandle");
const shared_helpers_1 = require("../shared-helpers");
const email_helpers_1 = require("../email-helpers");
const TournamentPaymentMeta_1 = require("../model/TournamentPaymentMeta");
const logger = (0, log4js_1.getLogger)();
class TournamentLogic {
    constructor(dataRepository, pokerTableProvider, timerProviderFactory, processor, emailSender, mailchimpService) {
        this.dataRepository = dataRepository;
        this.pokerTableProvider = pokerTableProvider;
        this.timerProviderFactory = timerProviderFactory;
        this.processor = processor;
        this.emailSender = emailSender;
        this.mailchimpService = mailchimpService;
        this.subscribers = [];
        this.tournaments = [];
        this.running = false;
    }
    async init() {
        let tournaments = await this.dataRepository.getTournaments({ status: TournmanetStatus_1.TournmanetStatus.Started });
        for (let tournament of tournaments) {
            try {
                await this.restartTournament(tournament);
            }
            catch (e) {
                logger.error(e);
            }
        }
    }
    async restartTournament(tournament) {
        let tournamentId = tournament._id.toString();
        let registrations = await this.dataRepository.getTournamentRegistrations({ tournamentId: tournamentId });
        let tournamentHandle = this.getTournamentHandle(tournament, registrations);
        let tableStates = await this.dataRepository.getTableStates({ tournamentId: tournamentId });
        let count = 0;
        for (let state of tableStates) {
            let table = await (0, helpers_1.setupTable)(this.getTableConfig(tournament, state._id.toString()), this.dataRepository, tournamentHandle.processor, this.timerProviderFactory);
            table.tableConfig.name = `Table ${++count}`;
            for (let playerState of state.players) {
                let stack = new decimal_1.Decimal(playerState.stack).add(new decimal_1.Decimal(playerState.cumulativeBet));
                if (stack.greaterThan(0)) {
                    let user = await this.dataRepository.getUser(playerState.guid);
                    table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(playerState.seat, user.guid, user.screenName, user.gravatar, stack.toNumber()));
                    tournamentHandle.seated.push(user.guid);
                }
            }
            this.setupTable(table, state, tournament);
            tournamentHandle.tables.push(table);
        }
        let tournamentResults = await this.dataRepository.getTournamentResults(tournamentId);
        tournamentHandle.seated.push(...tournamentResults.map(r => r.userGuid));
        this.tournaments.push(tournamentHandle);
        this.triggerStartOnTables(tournamentHandle);
    }
    startTimer() {
        setInterval(async () => {
            await this.run();
        }, 5000);
    }
    async run() {
        if (this.running) {
            logger.info(`TournamentLogic not re-run as still running`);
            return;
        }
        try {
            this.running = true;
            let tournaments = await this.dataRepository.getTournaments({ status: { $nin: [TournmanetStatus_1.TournmanetStatus.Complete, TournmanetStatus_1.TournmanetStatus.Abandoned, TournmanetStatus_1.TournmanetStatus.Started] } });
            for (let tournament of tournaments) {
                try {
                    await this.checkTournament(tournament);
                }
                catch (e) {
                    logger.error(e);
                }
            }
        }
        finally {
            this.running = false;
        }
    }
    addSubscriber(subscriber) {
        if (!this.subscribers.find(s => s == subscriber)) {
            this.subscribers.push(subscriber);
        }
    }
    removeSubscriber(subscriber) {
        (0, helpers_1.removeItem)(this.subscribers, subscriber);
    }
    async checkTournament(tournament) {
        let startTime = new Date(tournament.startTime);
        let diff = (startTime.getTime() - new Date().getTime()) / 1000;
        if (diff < 0) {
            let registrations = await this.dataRepository.getTournamentRegistrations({ tournamentId: tournament._id.toString() });
            let onlinePlayers = [];
            let offlinePlayers = [];
            for (let registration of registrations) {
                let user = await this.dataRepository.getUser(registration.userGuid);
                if (this.subscribers.find(s => s.user.guid == registration.userGuid) != null) {
                    onlinePlayers.push(user);
                }
                else {
                    offlinePlayers.push(user);
                }
            }
            if (onlinePlayers.length < tournament.minPlayers) {
                tournament.status = TournmanetStatus_1.TournmanetStatus.Abandoned;
                await this.dataRepository.saveTournmanet(tournament);
                logger.info(`tournament ${tournament.name} ${tournament._id} abandoned`);
            }
            else {
                logger.info(`tournament ${tournament.name} ${tournament._id} starting`);
                tournament.status = TournmanetStatus_1.TournmanetStatus.Started;
                await this.dataRepository.saveTournmanet(tournament);
                await this.startTournament(tournament, onlinePlayers, registrations);
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                this.broadcastStatus(tournament);
                if (this.sendOfflinePlayersEmail && offlinePlayers.length) {
                    let totalPrizes = (0, helpers_1.getTotalPrize)(tournament, buyInTotal);
                    let body = await (0, email_helpers_1.getStandardTemplateEmail)(`<p>This is to remind you that the tournament '${tournament.name}' you registered for has started.</p>
                    <p>Total Prizes for this tournament are ${totalPrizes} ${tournament.currency.toUpperCase()}
                    `);
                    let bccs = offlinePlayers.map(p => p.email);
                    (0, shared_helpers_1.to)(this.emailSender.sendEmail(process.env.POKER_FROM_EMAIL, `Your Tournament has started`, body, null, null, bccs));
                }
            }
        }
        else if (!tournament.sentMailchimp && tournament.mailchimpSendTimeMin) {
            let minutesUntilStart = Math.round(diff / 60);
            if (minutesUntilStart <= tournament.mailchimpSendTimeMin) {
                logger.info(`sending mailchimp for tournament ${tournament.name}`);
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                tournament.sentMailchimp = true;
                await this.dataRepository.saveTournmanet(tournament);
                this.sendMailchimp(tournament, buyInTotal);
            }
        }
        else if (!tournament.sentTelegram && tournament.telegramSendTimeMin) {
            let minutesUntilStart = Math.round(diff / 60);
            if (minutesUntilStart <= tournament.telegramSendTimeMin) {
                logger.info(`sending telegram for tournament ${tournament.name}`);
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                tournament.sentTelegram = true;
                await this.dataRepository.saveTournmanet(tournament);
                this.sendTelegram(tournament, buyInTotal);
            }
        }
    }
    sendMailchimp(tournament, buyinTotal) {
        if (!process.env.POKER_MAILCHIMP_TEMPLATE_ID || !process.env.POKER_MAILCHIMP_LIST_ID || !process.env.POKER_MAILCHIMP_API_KEY) {
            return;
        }
        let startingIn = this.getStartingIn(tournament.startTime);
        if (startingIn < 1) {
            return;
        }
        let [content, subject] = this.getContent(tournament, startingIn, buyinTotal);
        content = `<p>Just a quick reminder - ` + content + `</p>`;
        this.mailchimpService.sendTemplateToSubscribers(subject, content, parseInt(process.env.POKER_MAILCHIMP_TEMPLATE_ID));
    }
    getStartingIn(startTime) {
        return Math.round((new Date(startTime).getTime() - new Date().getTime()) / 1000 / 60);
    }
    getContent(tournament, startingIn, buyinTotal) {
        let prizes = (0, helpers_1.getCalculatedPrizes)(tournament, buyinTotal);
        let firstPrize = parseFloat(prizes[0]);
        let totalPrize = prizes.map(p => new decimal_1.Decimal(p)).reduce((a, b) => a.add(b), new decimal_1.Decimal(0)).toNumber();
        let currency = tournament.currency.toUpperCase();
        let startingText = 'minutes';
        if (startingIn >= 60) {
            startingIn = this.roundHalf(startingIn / 60);
            startingText = 'hour' + (startingIn > 1 ? 's' : '');
        }
        let content = `We have a tournament with a Total prize pool of <b>${totalPrize} ${currency}</b>`
            + ` and first prize of ${firstPrize} ${currency.toUpperCase()} <b>starting in ${startingIn} ${startingText}</b>`;
        let subject = `Poker Tournament starting in ${startingIn} ${startingText} - ${totalPrize} ${currency} up for grabs`;
        return [content, subject];
    }
    sendTelegram(tournament, buyinTotal) {
        if (!process.env.POKER_TELEGRAM_PUBLIC_CHANNEL || !process.env.POKER_TELEGRAM_ADMIN_BOT_TOKEN) {
            return;
        }
        let startingIn = this.getStartingIn(tournament.startTime);
        if (startingIn < 1) {
            return;
        }
        let [content, subject] = this.getContent(tournament, startingIn, buyinTotal);
        new telegram_service_1.TelegramService().sendTelegram(content, process.env.POKER_TELEGRAM_PUBLIC_CHANNEL);
    }
    roundHalf(num) {
        return Math.round(num * 2) / 2;
    }
    broadcastStatus(tournament) {
        let data = new DataContainer_1.DataContainer();
        data.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
        let row = new tournmanet_view_row_1.TournamentViewRow();
        row.id = tournament._id.toString();
        row.status = tournament.status;
        data.tournamentSubscriptionResult.tournaments.push(row);
        (0, protobuf_helpers_1.broadcast)(this.subscribers, data);
    }
    async startTournament(tournament, users, registrations) {
        let tournamentHandle = this.getTournamentHandle(tournament, registrations);
        let seatingArrangements = this.getSeatingArrangement(users, tournament.playersPerTable);
        tournamentHandle.seated = users.map(u => u.guid);
        for (let sa of seatingArrangements) {
            await this.addTable(sa, tournamentHandle);
        }
        this.tournaments.push(tournamentHandle);
        let data = new DataContainer_1.DataContainer();
        data.tableConfigs = new DataContainer_1.TableConfigs();
        data.tableConfigs.rows = tournamentHandle.tables.map(helpers_1.getTableViewRow);
        (0, protobuf_helpers_1.broadcast)(this.subscribers, data);
        this.triggerStartOnTables(tournamentHandle);
    }
    async addTable(sa, tournamentHandle) {
        let tournament = tournamentHandle.tournament;
        let table = await (0, helpers_1.setupTable)(this.getTableConfig(tournament, null), this.dataRepository, tournamentHandle.processor, this.timerProviderFactory);
        table.tournamentId = tournament._id + '';
        table.tableConfig.name = `Table ${tournamentHandle.tables.length + 1}`;
        for (let userSeating of sa.users) {
            let user = userSeating.user;
            table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(userSeating.seat, user.guid, user.screenName, user.gravatar, tournament.startingChips));
        }
        tournamentHandle.tables.push(table);
        let state = table.getTableState();
        await this.dataRepository.saveTableStates([state]);
        this.setupTable(table, state, tournament);
        return table;
    }
    getTournamentHandle(tournament, registrations) {
        let tournamentHandle = new TournamentHandle_1.TournamentHandle();
        tournamentHandle.tournament = tournament;
        tournamentHandle.processor = new TableProcessor_1.TableProcessor(this.dataRepository, this);
        tournamentHandle.registrations = registrations;
        return tournamentHandle;
    }
    triggerStartOnTables(handle) {
        for (let table of handle.tables) {
            table.gameStartDelaySec = TournamentLogic.FirstTimeGameDelayStart;
            table.handleGameStartingEvent();
            table.gameStartDelaySec = 2;
        }
    }
    async onPostShowdown(event) {
        if (event.bustedPlayers.length) {
            await this.onPlayersBusted(event.table.tournamentId, event.bustedPlayers);
        }
        let tournament = this.tournaments.find(t => t.id == event.table.tournamentId);
        let otherTables = tournament.tables.filter(t => t != event.table && t.getPlayers().length > 0);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(event.table, otherTables);
        let history = this.getChangeSeatHistory(tournament, event.table, otherTables, result);
        for (let change of result.leaving) {
            let moveToTable = change.table;
            await this.movePlayersFrom(event.table, moveToTable, change);
            moveToTable.checkGameStartingEvent();
        }
        for (let change of result.joining) {
            await this.movePlayersFrom(change.table, event.table, change);
        }
        let changesTables = _.uniq(result.leaving.concat(result.joining).map(x => x.table).concat([event.table]));
        await this.dataRepository.saveTableStates(changesTables.map(t => t.getTableState()));
        await this.dataRepository.saveChangeSeatHistory(history);
    }
    getChangeSeatHistory(tournament, table, otherTables, result) {
        let dbResult = new ChangeSeatHistory_1.ChangeSeatingHistoryResult();
        let convertItem = (item) => {
            return new ChangeSeatHistory_1.ChangeSeatingHistoryItem(new UserSmall_1.UserSmall(item.handle.guid, item.handle.screenName), item.seat, { id: item.table.tableConfig._id.toString() });
        };
        dbResult.joining = result.joining.map(convertItem);
        dbResult.leaving = result.leaving.map(convertItem);
        let history = new ChangeSeatHistory_1.ChangeSeatHistory(tournament.id, this.getChangeSeatHistoryTable(table), otherTables.map(t => this.getChangeSeatHistoryTable(t)), dbResult);
        return history;
    }
    getChangeSeatHistoryTable(table) {
        var historyTable = new ChangeSeatHistory_1.ChangeSeatHistoryTable();
        historyTable.id = table.tableConfig._id.toString();
        historyTable.players = table.getPlayers().map(p => new ChangeSeatHistory_1.ChangeSeatHistoryPlayer(p.guid, p.screenName, p.isDisconnected, p.isSittingOut));
        return historyTable;
    }
    async movePlayersFrom(fromTable, toTable, change) {
        await fromTable.leaveTableInternal(change.handle);
        let subscriber = fromTable.getSubscriber(change.handle.guid);
        if (subscriber != null) {
            fromTable.removeSubscriber(subscriber);
            toTable.addSubscriber(subscriber);
        }
        let handle = toTable.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(change.seat, change.handle.guid, change.handle.screenName, change.handle.gravatar, change.handle.stack));
        handle.sitOutNextHand = change.handle.sitOutNextHand;
        handle.isSittingOut = change.handle.isSittingOut;
        handle.isAutoSitout = change.handle.isAutoSitout;
        handle.sittingOutSince = change.handle.sittingOutSince;
        handle.isDisconnected = change.handle.isDisconnected;
        ;
        handle.disconnectedSince = change.handle.disconnectedSince;
        toTable.broadcastJoinTable(handle);
        (0, protobuf_helpers_1.broadcast)(this.subscribers, toTable.getTableConfigUpdate());
    }
    getTableProcessor(tournamentId) {
        return this.tournaments.find(t => t.id == tournamentId).processor;
    }
    async rebuy(tournamentId, userSmall) {
        let tournamentHandle = this.tournaments.find(t => t.id == tournamentId);
        let registrations = await this.dataRepository.getTournamentRegistrations({ userGuid: userSmall.guid, tournamentId: tournamentId });
        let registration = registrations[0];
        if (!registration) {
            return;
        }
        let remainingPlayerCount = this.getRemainingPlayerCount(tournamentHandle);
        let rebuyAllowed = this.rebuyAllowed(tournamentHandle.tournament, remainingPlayerCount);
        if (!rebuyAllowed) {
            return;
        }
        let tournament = tournamentHandle.tournament;
        let rebuyCount = registration.rebuyCount || 0;
        let rebuyAmount = new decimal_1.Decimal(tournament.rebuyAmount).mul(Math.pow(2, rebuyCount)).toString();
        let debitError = await (0, helpers_1.debitAccount)(userSmall, tournament.currency, rebuyAmount, this.dataRepository, null, new TournamentPaymentMeta_1.TournamentPaymentMeta(tournamentId, true, tournament.name));
        if (debitError) {
            let message = `rebuy failed for ${JSON.stringify(userSmall)}: ${debitError}`;
            logger.info(message);
            return;
        }
        registration.rebuyCount = rebuyCount + 1;
        await this.dataRepository.saveTournamentRegistration(registration);
        await this.dataRepository.deleteTournamentResult(tournamentId, userSmall.guid);
        let subscriber = this.subscribers.find(s => s.user.guid == userSmall.guid);
        if (subscriber != null) {
            let data = new DataContainer_1.DataContainer();
            let user = await this.dataRepository.getUser(userSmall.guid);
            data.user = await (0, helpers_1.getUserData)(user, this.dataRepository, false);
            subscriber.send(data);
        }
        this.lateRegistration(tournamentId, userSmall.guid);
        let broadcastMessage = new DataContainer_1.DataContainer();
        broadcastMessage.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
        let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournamentId);
        let rowView = {
            id: tournamentId,
            totalPrize: (0, helpers_1.getTotalPrize)(tournament, buyInTotal).toString()
        };
        broadcastMessage.tournamentSubscriptionResult.tournaments.push(rowView);
        (0, protobuf_helpers_1.broadcast)(this.subscribers, broadcastMessage);
    }
    async lateRegistration(tournamentId, guid) {
        let tHandle = this.tournaments.find(t => t.id == tournamentId);
        if (tHandle.tables.find(t => t.findPlayer(guid) != null)) {
            return;
        }
        let table = null;
        let seat;
        for (let t of tHandle.tables) {
            let emptySeats = t.getEmptySeats();
            if (emptySeats.length) {
                table = t;
                seat = emptySeats[0];
                break;
            }
        }
        let user = await this.dataRepository.getUser(guid);
        let handle;
        if (table == null) {
            let sa = new SeatingArrangement();
            sa.users.push({ user: user, seat: 2 });
            table = await this.addTable(sa, tHandle);
        }
        else {
            handle = table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(seat, user.guid, user.screenName, user.gravatar, tHandle.tournament.startingChips));
        }
        tHandle.seated.push(user.guid);
        let subscriber = this.subscribers.find(s => s.user.guid == guid);
        if (subscriber != null) {
            table.addSubscriber(subscriber);
        }
        if (handle) {
            table.broadcastJoinTable(handle);
        }
        table.checkGameStartingEvent();
        let data = new DataContainer_1.DataContainer();
        data.tableConfigs = new DataContainer_1.TableConfigs();
        data.tableConfigs.rows = [(0, helpers_1.getTableViewRow)(table)];
        (0, protobuf_helpers_1.broadcast)(this.subscribers, data);
        return table.tableId;
    }
    async onPlayersBusted(tournamentId, playerHandles) {
        let tournamentHandle = this.tournaments.find(t => t.id == tournamentId);
        let remainingPlayerCount = this.getRemainingPlayerCount(tournamentHandle);
        let placing = remainingPlayerCount + 1;
        let timestamp = new Date();
        let results = playerHandles.map(h => new TournamentResult_1.TournamentResult(tournamentHandle.id, h.guid, h.screenName, placing, timestamp));
        if (placing == 2) {
            let table = tournamentHandle.tables.filter(t => t.getPlayerCount() > 0)[0];
            let winner = table.getPlayers()[0];
            table.leaveTableInternal(winner);
            results.push(new TournamentResult_1.TournamentResult(tournamentHandle.id, winner.guid, winner.screenName, 1, timestamp));
            tournamentHandle.tournament.status = TournmanetStatus_1.TournmanetStatus.Complete;
            await this.dataRepository.saveTournmanet(tournamentHandle.tournament);
            this.broadcastStatus(tournamentHandle.tournament);
            let that = this;
            if (tournamentHandle.tournament.awardPrizesAfterMinutes > 0) {
                this.timerProviderFactory(tournamentHandle.processor).startTimer(async function awardPrizes() {
                    await that.sendAwardPrizes(tournamentHandle.tournament);
                }, tournamentHandle.tournament.awardPrizesAfterMinutes * 1000 * 60, null);
            }
            this.timerProviderFactory(tournamentHandle.processor).startTimer(async function removeTables() {
                that.pokerTableProvider.removeTables({ tournamentId: tournamentHandle.id });
            }, 2 * 1000 * 60, null);
        }
        await this.dataRepository.saveTournamentResult(results);
        await this.sendTournamentResults(results, tournamentHandle.tournament, remainingPlayerCount);
    }
    getRemainingPlayerCount(tournamentHandle) {
        let remainingPlayerCount = tournamentHandle.tables.map(t => t.getPlayerCount()).reduce((a, b) => a + b, 0);
        return remainingPlayerCount;
    }
    rebuyAllowed(tournament, remainingPlayerCount) {
        let rebuyAllowed = tournament.rebuyAmount && remainingPlayerCount > 1 && (0, helpers_1.isWithinPeriod)(tournament.startTime, tournament.rebuyForMin);
        return rebuyAllowed;
    }
    async sendTournamentResults(results, tournament, remainingPlayerCount) {
        let rebuyAllowed = this.rebuyAllowed(tournament, remainingPlayerCount);
        for (let tournamentResult of results) {
            let subscriber = this.subscribers.find(s => s.user.guid == tournamentResult.userGuid);
            if (subscriber) {
                let data = new DataContainer_1.DataContainer();
                let rebuyAmount = null;
                if (rebuyAllowed) {
                    rebuyAmount = await this.getRebuyAmount(subscriber.user.guid, tournament._id.toString(), tournament.rebuyAmount);
                }
                let account = await this.dataRepository.getUserAccount(subscriber.user.guid, tournament.currency);
                let accountBalance = new decimal_1.Decimal(account.balance || 0).dividedBy(Currency_1.CurrencyUnit.getCurrencyUnit(tournament.currency));
                let canRebuy = accountBalance.greaterThanOrEqualTo(new decimal_1.Decimal(rebuyAmount));
                data.tournamentResult = new TournamentResultView_1.TournamentResultView(tournament._id.toString(), tournament.name, tournamentResult.placing, rebuyAmount, tournament.currency, canRebuy);
                subscriber.send(data);
            }
        }
    }
    async getRebuyAmount(guid, tournamentId, rebuyAmount) {
        let registrations = await this.dataRepository.getTournamentRegistrations({ userGuid: guid, tournamentId: tournamentId });
        let registration = registrations[0];
        let rebuyCount = registration.rebuyCount || 0;
        return new decimal_1.Decimal(rebuyAmount).mul(Math.pow(2, rebuyCount)).toString();
    }
    async sendAwardPrizes(tournament) {
        let pMessage = new GameServerProcessorMessage_1.GameServerProcessorMessage();
        let adminTournamentResultsView = await (0, helpers_1.getAdminTournamentResultsView)(tournament, this.dataRepository);
        pMessage.awardPrizesRequest = new AwardPrizesRequest_1.AwardPrizesRequest(tournament._id + '', adminTournamentResultsView);
        let pResult = await this.processor.sendMessage(pMessage);
    }
    getTableConfig(tournament, configId) {
        let config = new TableConfig_1.TableConfig();
        config._id = configId;
        config.currency = Currency_1.Currency.tournament;
        config.exchangeRate = 1;
        let blindConfig = (0, helpers_1.getBlindConfig)(new Date(tournament.startTime), tournament.blindConfig).blinds;
        config.smallBlind = blindConfig.smallBlind;
        config.bigBlind = blindConfig.bigBlind;
        config.timeToActSec = tournament.timeToActSec;
        config.maxPlayers = tournament.playersPerTable;
        return config;
    }
    setupTable(table, state, tournament) {
        table.tournamentId = tournament._id + '';
        table.tableConfig._id = state._id;
        table.blindConfig = tournament.blindConfig;
        table.blindsStartTime = new Date(tournament.startTime);
        table.idleTimeSec = (tournament.evictAfterIdleMin || 10) * 60;
        this.pokerTableProvider.addTable(table);
        for (let handle of table.getPlayers()) {
            handle.isDisconnected = true;
            handle.disconnectedSince = new Date();
            handle.isAutoSitout = true;
            handle.isSittingOut = true;
            handle.sittingOutSince = new Date();
        }
        if (state.dealerSeat != null) {
            table.dealerSeat = state.dealerSeat;
        }
        table.onPostShowdown = this.onPostShowdown.bind(this);
    }
    async getTournamentTable(tournamentId, tableId, subscriber) {
        let handle = this.tournaments.find(t => t.tournament._id + '' == tournamentId);
        if (handle) {
            if (this.subscribers.find(s => s == subscriber)) {
                let found = false;
                for (let table of handle.tables) {
                    if (table.getPlayers().find(p => p.guid == subscriber.user.guid)) {
                        found = true;
                        return table;
                    }
                }
                if (!found && handle.registrations.find(r => r.userGuid == subscriber.user.guid) != null
                    && handle.seated.find(s => s == subscriber.user.guid) == null
                    && (0, helpers_1.isWithinLateRegistration)(handle.tournament)) {
                    let tMessage = new TableProcessor_1.TableProcessorMessage(null);
                    tMessage.lateRegistration = { tournamentId: tournamentId, user: new UserSmall_1.UserSmall(subscriber.user.guid, subscriber.user.screenName) };
                    let tableProcessorResult = await handle.processor.sendMessage(tMessage);
                    let table = this.pokerTableProvider.findTable(tableProcessorResult.lateRegistrationTableId);
                    return table;
                }
                if (!found && tableId) {
                    let table = handle.tables.find(t => t.tableConfig._id.toString() == tableId);
                    if (table != null) {
                        return table;
                    }
                }
            }
        }
        else {
            logger.info(`no such tournamentId ${tournamentId} userGuid: ${subscriber.user.guid}`);
        }
        return null;
    }
    getSeatingArrangement(arr, playersPerTable) {
        let users = arr.slice();
        let tables = [];
        let table;
        let length = users.length;
        for (let i = 0; i < length; i++) {
            if (i % playersPerTable == 0) {
                table = new SeatingArrangement();
                tables.push(table);
            }
            let randomResult = (0, helpers_1.getRandomItemAndIndex)(users);
            let seat = (i % playersPerTable) + 1;
            table.users.push({ user: randomResult.item, seat: seat });
            users.splice(randomResult.index, 1);
        }
        let min = 4;
        let lastTable = tables[tables.length - 1];
        if (tables.length > 1 && lastTable.users.length < min) {
            let numPlayersToTake = min - lastTable.users.length;
            let seat = lastTable.users[lastTable.users.length - 1].seat;
            for (let i = 0; i < numPlayersToTake; i++) {
                let tableIndex = i % (tables.length - 1);
                if (tables[tableIndex].users.length == lastTable.users.length) {
                    break;
                }
                seat++;
                let user = tables[tableIndex].users.splice(0, 1)[0];
                user.seat = seat;
                lastTable.users.push(user);
            }
        }
        return tables;
    }
    getRemainingPlayers(tournamentId) {
        let arr = [];
        let handle = this.tournaments.find(h => h.id == tournamentId);
        for (let table of handle.tables) {
            for (let player of table.getPlayers()) {
                arr.push({ screenName: player.screenName, stack: player.stack });
            }
        }
        arr.sort((a, b) => b.stack - a.stack);
        return arr;
    }
}
exports.TournamentLogic = TournamentLogic;
TournamentLogic.FirstTimeGameDelayStart = 10;
class SeatingArrangement {
    constructor() {
        this.users = [];
    }
}
class UserSeating {
}
//# sourceMappingURL=TournamentLogic.js.map