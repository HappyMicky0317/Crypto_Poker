"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRepository = void 0;
const mongodb_1 = require("mongodb");
const ObjectID = require('mongodb').ObjectID;
const User_1 = require("../../model/User");
const Currency_1 = require("../../../../poker.ui/src/shared/Currency");
const PaymentType_1 = require("../../../../poker.ui/src/shared/PaymentType");
const TableBalance_1 = require("../../model/TableBalance");
const helpers_1 = require("../../helpers");
const ClientMessage_1 = require("../../../../poker.ui/src/shared/ClientMessage");
const login_request_1 = require("../../../../poker.ui/src/shared/login-request");
const shared_helpers_1 = require("../../shared-helpers");
const decimal_1 = require("../../../../poker.ui/src/shared/decimal");
const util_1 = require("util");
class DataRepository {
    constructor(dbName) {
        this.dbName = dbName;
    }
    init() {
        this.server = new mongodb_1.Server('localhost', 27017);
        this.db = new mongodb_1.Db(this.dbName, this.server, {});
        return this.db.open();
    }
    getTablesConfig() {
        var collection = this.db.collection('tableConfig');
        return collection.find({}).sort({ orderIndex: 1 }).toArray();
    }
    saveTableConfig(tableConfig) {
        if (typeof tableConfig._id === 'string') {
            tableConfig._id = ObjectID.createFromHexString(tableConfig._id);
        }
        return this.db.collection('tableConfig').save(tableConfig);
    }
    deleteTableConfig(id) {
        return this.db.collection('tableConfig').remove({ _id: ObjectID(id) });
    }
    deleteUser(guid) {
        return this.db.collection('users').remove({ guid: guid });
    }
    async getAdmins() {
        return this.db.collection('admins').find().toArray();
    }
    ;
    async saveAdmin(admin) {
        return this.db.collection('admins').save(admin);
    }
    async getCurrencyConfig(currency) {
        var collection = this.db.collection('currencyConfig');
        let config = await collection.findOne({ 'name': currency });
        return config;
    }
    ;
    async getCurrencyConfigs() {
        return this.db.collection('currencyConfig').find().toArray();
    }
    ;
    saveCurrencyConfig(config) {
        return this.db.collection('currencyConfig').save(config);
    }
    ;
    async saveUser(user) {
        let findArgs = { "guid": user.guid };
        let upsert = false;
        if (user._id == null) {
            upsert = true;
            user.updateIndex = 0;
        }
        else {
            findArgs.updateIndex = user.updateIndex;
            user.updateIndex++;
        }
        let result = await this.db.collection('users').replaceOne(findArgs, user, { upsert: upsert });
        if (result.result.n !== 1) {
            throw new Error(`expecting modified count of 1 instead it is ${result.result.n}`);
        }
        else if (result.upsertedId) {
            user._id = result.upsertedId._id;
        }
    }
    getUser(guid) {
        return this.getUserInternal({ guid: guid });
    }
    getUserInternal(searchArgs) {
        var collection = this.db.collection('users');
        return collection.findOne(searchArgs)
            .then((user) => {
            if (user) {
                Object.setPrototypeOf(user, User_1.User.prototype);
            }
            return user;
        });
    }
    getUserByEmail(email) {
        if (helpers_1.Helpers.isNullOrWhitespace(email))
            return Promise.resolve(null);
        return this.getUserInternal({ email: { '$regex': email, '$options': 'i' } });
    }
    getUserByActivationToken(token) {
        if (helpers_1.Helpers.isNullOrWhitespace(token))
            return Promise.resolve(null);
        return this.getUserInternal({ activationToken: token });
    }
    getUserByResetPasswordToken(token) {
        if (helpers_1.Helpers.isNullOrWhitespace(token))
            return Promise.resolve(null);
        return this.getUserInternal({ resetPasswordToken: token });
    }
    getPayments(args) {
        let mongoArgs = shared_helpers_1.SharedHelpers.getPaymentQueryArgs(args);
        let limit = parseInt(args.showOption);
        if (isNaN(limit))
            limit = args.guid === undefined ? 1000 : 1000000;
        return this.db.collection('payments').find(mongoArgs).sort({ _id: -1 }).limit(limit).toArray();
    }
    async getTournamentBuyIns(tournamentId) {
        let args = {
            tournamentId: tournamentId,
            type: PaymentType_1.PaymentType.outgoing
        };
        let total = new decimal_1.Decimal(0);
        for (let payment of await this.db.collection('payments').find(args).toArray()) {
            total = total.add(new decimal_1.Decimal(payment.amount));
        }
        total = total.dividedBy(Currency_1.CurrencyUnit.default);
        return total;
    }
    getPaymentsSince(id) {
        let args = {};
        if (id) {
            args._id = { $gte: new ObjectID(id) };
        }
        return this.db.collection('payments').find(args).toArray();
        ;
    }
    getAddressInfoSince(id) {
        let args = {};
        if (id) {
            args._id = { $gte: new ObjectID(id) };
        }
        return this.db.collection('addressInfo').find(args).toArray();
        ;
    }
    getUnusedSweepPayment(guid) {
        var collection = this.db.collection('payments');
        return collection.findOne({ guid: guid, type: PaymentType_1.PaymentType.incoming, sweepFeeUsed: false });
    }
    ;
    savePayment(payment) {
        if (payment._id && typeof payment._id === 'string') {
            payment._id = ObjectID.createFromHexString(payment._id);
        }
        if (typeof payment.timestamp === 'string') {
            payment.timestamp = new Date(payment.timestamp);
        }
        return this.db.collection('payments').save(payment);
    }
    saveGame(game) {
        var collection = this.db.collection('games');
        return collection.save(game);
    }
    saveExchangeRate(exchangeRate) {
        return this.db.collection('exchangeRates').replaceOne({ "base": exchangeRate.base, "target": exchangeRate.target }, exchangeRate, { upsert: true });
    }
    getExchangeRate(base) {
        var collection = this.db.collection('exchangeRates');
        return collection.findOne({ "base": {
                $regex: new RegExp(base, "i")
            } });
    }
    getExchangeRates() {
        return this.db.collection('exchangeRates').find({}).sort({ _id: 1 }).toArray();
    }
    saveClientMessage(message, tableId, guid) {
        let data = message;
        if (message.loginRequest != null) {
            data = new ClientMessage_1.ClientMessage();
            data.loginRequest = new login_request_1.LoginRequest(message.loginRequest.email, '****');
        }
        return this.db.collection('messages').save({
            guid: guid,
            tableId: tableId,
            data: data
        });
    }
    saveChat(chatMessage) {
        return this.db.collection('chatMessages').save(chatMessage);
    }
    getChatMessages(tableId) {
        let tableIdStr = tableId != null ? tableId.toString() : null;
        return this.db.collection('chatMessages').find({ tableId: tableIdStr }).sort({ _id: -1 }).limit(100).toArray();
    }
    getGames(tableId, userGuid, tournamentId, skip, limit) {
        let searchObj = {};
        if (tournamentId)
            searchObj.tournamentId = tournamentId;
        if (tableId)
            searchObj["tableId"] = tableId;
        if (userGuid)
            searchObj["players.guid"] = userGuid;
        let query = this.db.collection('games').find(searchObj).sort({ _id: -1 });
        if (skip != null)
            query.skip(skip);
        if (limit != null)
            query.limit(limit);
        return query.toArray();
    }
    async updateUserAccount(guid, currency, balance, updateIndex) {
        if (balance < 0 && updateIndex == undefined) {
            throw new Error(`updateIndex must be defined for decrement operations`);
        }
        let findArgs = { "guid": guid, "currency": currency.toLowerCase() };
        let updateArgs = { $inc: { "balance": balance }, };
        let options = {};
        if (updateIndex != undefined) {
            findArgs.updateIndex = updateIndex;
            updateArgs.$set = { "updateIndex": ++updateIndex };
        }
        else {
            updateArgs.$setOnInsert = { "updateIndex": 0 };
            options.upsert = true;
        }
        let result = await this.db.collection('userAccounts').updateOne(findArgs, updateArgs, options);
        if (result.result.n !== 1) {
            throw new Error(`expecting modified count of 1 instead it is ${result.result.n}`);
        }
        return result;
    }
    getUserAccount(guid, currency) {
        return this.db.collection('userAccounts').findOne({ "guid": guid, "currency": currency.toLowerCase() });
    }
    getUserAccounts(guid) {
        return this.db.collection('userAccounts').find({ "guid": guid }).toArray();
    }
    ensureTableBalance(tableId, currency) {
        let collection = this.db.collection('tableBalance');
        return collection.find({ tableId: tableId.toString() }).toArray()
            .then((arr) => {
            if (arr.length === 0) {
                let tableBalance = new TableBalance_1.TableBalance(tableId.toString(), currency);
                return collection.save(tableBalance)
                    .then(() => Promise.resolve(tableBalance));
            }
            else {
                return Promise.resolve(arr[0]);
            }
        });
    }
    updateTableBalance(tableId, account) {
        return this.db.collection('tableBalance').update({ tableId: tableId.toString(), 'accounts.userGuid': { $ne: account.userGuid } }, { $push: { accounts: account } });
    }
    updateTableBalances(tableId, currency, accounts) {
        let tableBalance = new TableBalance_1.TableBalance(tableId, currency);
        tableBalance.accounts = accounts;
        return this.db.collection('tableBalance').replaceOne({ 'tableId': tableId }, tableBalance);
    }
    removeTableBalance(tableId, userGuid) {
        return this.db.collection('tableBalance').update({ tableId: tableId.toString() }, { $pull: { 'accounts': { userGuid: userGuid } } });
    }
    getTableBalance(tableId) {
        return this.db.collection('tableBalance').findOne({ tableId: tableId.toString() });
    }
    getTableBalancesByUserGuid(userGuid) {
        return this.db.collection('tableBalance').find({ 'accounts.userGuid': userGuid }).toArray();
    }
    getUsers(searchTerm, limit, includeAnon) {
        var collection = this.db.collection('users');
        var obj = {};
        if (!includeAnon) {
            obj = { email: { $exists: true } };
        }
        if (searchTerm && searchTerm.trim()) {
            if (searchTerm.length > 10)
                obj = { guid: searchTerm };
            else
                obj = { $or: [{ screenName: { '$regex': searchTerm, '$options': 'i' }, }, { email: { '$regex': searchTerm, '$options': 'i' }, }] };
        }
        return collection.find(obj, { screenName: 1, email: 1, guid: 1 }).sort({ _id: -1 }).limit(limit).toArray();
    }
    getGamesByUserGuid(userGuid, currency) {
        return this.db.collection('games').find({ "players.guid": userGuid, "currency": currency }).sort({ _id: -1 }).toArray();
    }
    saveReconcilliationView(view) {
        return this.db.collection('reconcilliationViews').save(view);
    }
    async getReconcilliationView() {
        let arr = await this.db.collection('reconcilliationViews').find().sort({ _id: -1 }).limit(1).toArray();
        if (arr.length)
            return arr[0];
        return null;
    }
    getPaymentByTxId(currency, txId) {
        return this.db.collection('payments').findOne({ currency: currency, txId: txId });
    }
    getPaymentIncomingByTournamentId(tournamentId, userGuid) {
        return this.db.collection('payments').findOne({ tournamentId: tournamentId, guid: userGuid, type: PaymentType_1.PaymentType.incoming });
    }
    getPaymentById(id) {
        return this.db.collection('payments').findOne({ '_id': ObjectID(id) });
    }
    getUsersByScreenName(screenName) {
        return this.db.collection('users').find({ screenName: { '$regex': screenName, '$options': 'i' } }).toArray()
            .then((arr) => {
            for (let user of arr)
                Object.setPrototypeOf(user, User_1.User.prototype);
            return arr;
        });
    }
    mergeGames(mergeFromGuid, mergeToGuid) {
        return this.db.collection('games').find({ "players.guid": mergeFromGuid }).toArray()
            .then((games) => {
            return Promise.all(games.map(g => { this.mergeGame(g, mergeFromGuid, mergeToGuid); }));
        });
    }
    mergeGame(game, mergeFromGuid, mergeToGuid) {
        for (let player of game.players) {
            if (player.guid === mergeFromGuid)
                player.guid = mergeToGuid;
        }
        for (let auditEvent of game.auditEvents) {
            if (auditEvent.userGuid === mergeFromGuid)
                auditEvent.userGuid = mergeToGuid;
        }
        for (let potResult of game.potResults) {
            for (let allocation of potResult.allocations) {
                if (allocation.player.guid === mergeFromGuid)
                    allocation.player.guid = mergeToGuid;
            }
        }
        return this.saveGame(game);
    }
    mergePayments(mergeFromGuid, mergeToGuid) {
        return this.db.collection('payments').updateMany({ "guid": mergeFromGuid }, { $set: { "guid": mergeToGuid } });
    }
    deleteUserReconcilliation(guid) {
        return this.db.collection('userReconcilliationResults').remove({ userGuid: guid });
    }
    saveTournmanet(tournmanet) {
        if (tournmanet._id && typeof tournmanet._id === 'string') {
            tournmanet._id = ObjectID.createFromHexString(tournmanet._id);
        }
        return this.db.collection('tournmanets').save(tournmanet);
    }
    ;
    async getTournaments(args, limit, meta) {
        let query = this.db.collection('tournmanets').find(args || {}).sort({ _id: -1 });
        if (limit) {
            query.limit(limit);
        }
        if (meta) {
            meta.count = await query.count();
        }
        return query.toArray();
    }
    ;
    getTournmanetById(id) {
        return this.db.collection('tournmanets').findOne({ '_id': ObjectID(id) });
    }
    ;
    deleteTournmanet(id) {
        return this.db.collection('tournmanets').remove({ _id: ObjectID(id) });
    }
    saveTournamentRegistration(registration) {
        let collection = this.db.collection('tournamentRegistration');
        return collection.replaceOne({ 'tournamentId': registration.tournamentId, 'userGuid': registration.userGuid }, registration, { upsert: true });
    }
    getTournamentRegistrations(args) {
        return this.db.collection('tournamentRegistration').find(args).toArray();
    }
    ;
    getTournamentPlayerCount(tournamentId) {
        return this.db.collection('tournamentRegistration').count({ tournamentId: tournamentId });
    }
    ;
    saveTableStates(states) {
        return Promise.all(states.map(state => {
            if (typeof state._id === 'string') {
                state._id = ObjectID.createFromHexString(state._id);
            }
            return this.db.collection('tableState').save(state);
        }));
    }
    getTableStates(args) {
        return this.db.collection('tableState').find(args || {}).sort({ _id: 1 }).toArray();
    }
    ;
    saveTournamentResult(results) {
        return Promise.all(results.map(result => {
            return this.db.collection('tournamentResults').save(result);
        }));
    }
    getTournamentResults(tournamentId) {
        return this.db.collection('tournamentResults').find({ tournamentId: tournamentId }).sort({ placing: 1 }).toArray();
    }
    deleteTournamentResult(tournamentId, userGuid) {
        return this.db.collection('tournamentResults').remove({ tournamentId: tournamentId, userGuid: userGuid });
    }
    updateTournamentHasAwardedPrizes(tournamentId) {
        return this.db.collection('tournmanets').update({ $and: [{ _id: ObjectID(tournamentId) }, { hasAwardedPrizes: false }] }, { $set: { hasAwardedPrizes: true } });
    }
    getAddressInfo(guid, currency, processed) {
        return this.db.collection('addressInfo').find({ userGuid: guid, currency: currency, processed: processed }).toArray();
    }
    getAddressInfoByAddress(address) {
        return this.db.collection('addressInfo').find({ address: address }).toArray();
    }
    saveAddress(info) {
        return this.db.collection('addressInfo').save(info);
    }
    async getLastPaymentUpdate() {
        let results = await this.db.collection('payments').find({}).sort({ updated: -1 }).limit(1).toArray();
        if (results && results.length) {
            return results[0];
        }
        return null;
    }
    ;
    saveChangeSeatHistory(history) {
        return this.db.collection('changeSeatHistory').save(history);
    }
    ;
    saveTableProcessorMessage(message) {
        return this.db.collection('tableProcessorMessages').save(message);
    }
    ;
    getBlockedCountries() {
        return this.db.collection('blockedCountry').find({}).toArray();
    }
    ;
    async createNextUserDocument() {
        await this.db.collection('userIndex').updateOne({}, { "$setOnInsert": { "index": -1 }, }, { upsert: true });
    }
    async getNextUserIndex() {
        let result = await this.db.collection('userIndex').findOneAndUpdate({}, { $inc: { "index": 1 } }, { returnOriginal: false });
        if (!result.ok || result.value == null) {
            throw new Error(`result != ok ${(0, util_1.inspect)(result)}`);
        }
        return result.value.index;
    }
    ;
    async getUserBalances(currency) {
        let accounts = await this.db.collection('userAccounts').find({ currency }).sort({ balance: -1 }).toArray();
        let arr = [];
        for (let account of accounts) {
            let user = await this.db.collection('users').findOne({ guid: account.guid });
            if (user) {
                arr.push({ screenName: user.screenName, joined: user._id.getTimestamp().toISOString(), email: user.email, balance: account.balance });
            }
        }
        return arr;
    }
}
exports.DataRepository = DataRepository;
//# sourceMappingURL=DataRepository.js.map