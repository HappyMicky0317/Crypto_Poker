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
const TableState_1 = require("./../../../src/model/TableState");
const assert = __importStar(require("assert"));
var mongo = require('mongodb');
var clean = require('mongo-clean');
const DataRepository_1 = require("../../../src/services/documents/DataRepository");
const User_1 = require("../../../src/model/User");
const Currency_1 = require("../../../../poker.ui/src/shared/Currency");
const TableBalance_1 = require("../../../src/model/TableBalance");
const TableConfig_1 = require("../../../src/model/TableConfig");
const TournamentResult_1 = require("../../../src/model/TournamentResult");
const tournament_1 = require("../../../src/model/tournament");
const PaymentType_1 = require("../../../../poker.ui/src/shared/PaymentType");
describe('#DataRepository()', function () {
    let dbName = 'pokerGameServerUnitTests';
    let repository;
    let setup;
    beforeEach(function () {
        repository = new DataRepository_1.DataRepository(dbName);
        setup = repository.init()
            .then(() => cleanDb(repository.db))
            .then(() => ensureInitialData());
    });
    let ensureInitialData = async () => {
        var collection = repository.db.collection('tableConfig');
        let dbTables = await collection.find({}).toArray();
        if (dbTables.length == 0) {
            let table1 = new TableConfig_1.TableConfig('Free Table 1', 1, 2, Currency_1.Currency.free.toUpperCase());
            let table2 = new TableConfig_1.TableConfig('Free Table 2', 1, 2, Currency_1.Currency.free.toUpperCase());
            let table3 = new TableConfig_1.TableConfig('Sit n Go 1', 0.1, 0.2, Currency_1.Currency.dash.toUpperCase());
            let table4 = new TableConfig_1.TableConfig('Sit n Go 2', 0.05, 0.1, Currency_1.Currency.dash.toUpperCase());
            return collection.insertMany([
                table1, table2, table3, table4
            ]);
        }
    };
    it('getTablesConfig', function () {
        return setup
            .then(() => repository.getTablesConfig())
            .then((returnValue) => {
            assert.equal(returnValue.length, 4);
            assert.equal(returnValue[0].name, 'Free Table 1');
            assert.equal(returnValue[1].name, 'Free Table 2');
            assert.equal(returnValue[2].name, 'Sit n Go 1');
            assert.equal(returnValue[3].name, 'Sit n Go 2');
        });
    });
    it('getUser', function () {
        let user1 = new User_1.User();
        user1.guid = "guid-1";
        let user2 = new User_1.User();
        user2.guid = "guid-2";
        let user3 = new User_1.User();
        user3.guid = "guid-3";
        return setup
            .then(() => repository.saveUser(user1))
            .then(() => repository.saveUser(user2))
            .then(() => repository.saveUser(user3))
            .then(() => repository.getUser("guid-2"))
            .then((returnValue) => {
            assert.equal(returnValue.guid, "guid-2");
        });
    });
    it('getUser null user', function () {
        return setup
            .then(() => repository.getUser('foo'))
            .then((returnValue) => {
            assert.equal(returnValue, null);
        });
    });
    it('saveUser', async () => {
        await setup;
        let user = new User_1.User();
        user.guid = 'guid1';
        user.screenName = 'screenName1';
        await repository.saveUser(user);
        let dbUser1 = await repository.getUser(user.guid);
        let dbUser2 = await repository.getUser(user.guid);
        dbUser1.screenName = 'screenName2';
        await repository.saveUser(dbUser1);
        let error;
        try {
            dbUser2.screenName = 'screenName3';
            await repository.saveUser(dbUser2);
        }
        catch (e) {
            error = e;
        }
        assert.equal(error, 'Error: expecting modified count of 1 instead it is 0');
        let finalDbUser = await repository.getUser(user.guid);
        assert.equal(finalDbUser.screenName, 'screenName2');
    });
    it('getPaymentAddress', async () => {
        let user1 = new User_1.User();
        user1.guid = "guid-1";
        let user2 = new User_1.User();
        user2.guid = "guid-2";
        await setup;
        await repository.saveUser(user1);
        await repository.saveUser(user2);
        let returnValue = await repository.getUser("guid-2");
        assert.equal(returnValue.guid, "guid-2");
    });
    it('saveTableConfig', async () => {
        let config = new TableConfig_1.TableConfig();
        config.name = 'new_random_name';
        await setup;
        await repository.saveTableConfig(config);
        assert.notEqual(config._id, null);
        config._id = config._id.toString();
        config.timeToActSec = 30;
        await repository.saveTableConfig(config);
        let configs = (await repository.getTablesConfig()).filter(t => t.name == 'new_random_name');
        assert.equal(1, configs.length);
        assert.equal(30, configs[0].timeToActSec);
    });
    it('updateUserAccount', async () => {
        await setup;
        await repository.updateUserAccount("guid-1", Currency_1.Currency.free, 1);
        await repository.updateUserAccount("guid-1", Currency_1.Currency.dash, 2);
        await repository.updateUserAccount("guid-2", Currency_1.Currency.free, 3);
        await repository.updateUserAccount("guid-2", Currency_1.Currency.dash, 4);
        await repository.updateUserAccount("guid-2", Currency_1.Currency.bcy, 5);
        let data = await repository.updateUserAccount("guid-2", 'DASH', 6);
        assert.equal(data.result.nModified, 1);
        let accounts1 = await repository.getUserAccounts("guid-1");
        assert.equal(accounts1.length, 2);
        assert.equal(accounts1.find(a => a.currency == Currency_1.Currency.free).balance, 1);
        assert.equal(accounts1.find(a => a.currency == Currency_1.Currency.dash).balance, 2);
        let accounts2 = await repository.getUserAccounts("guid-2");
        assert.equal(accounts2.length, 3);
        assert.equal(accounts2.find(a => a.currency == Currency_1.Currency.free).balance, 3);
        assert.equal(accounts2.find(a => a.currency == Currency_1.Currency.dash).balance, 10);
        assert.equal(accounts2.find(a => a.currency == Currency_1.Currency.bcy).balance, 5);
    });
    it('updateUserAccount where account does not exist', async () => {
        await setup;
        let data = await repository.updateUserAccount('guid1', 'DASH', 6);
        assert.equal(data.result.n, 1);
        assert.equal(data.result.nModified, 0);
        let account = await repository.getUserAccount('guid1', 'DASH');
        assert.equal(account.guid, 'guid1');
        assert.equal(account.currency, 'dash');
        assert.equal(account.balance, 6);
    });
    it('updateUserAccount where account exists', async () => {
        await setup;
        await repository.updateUserAccount('guid1', 'DASH', 2000000);
        let data = await repository.updateUserAccount('guid1', 'DASH', 3123456);
        assert.equal(data.result.n, 1);
        assert.equal(data.result.nModified, 1);
        let account = await repository.getUserAccount('guid1', 'DASH');
        assert.equal(account.guid, 'guid1');
        assert.equal(account.currency, 'dash');
        assert.equal(account.balance, 5123456);
    });
    it('decrement player balance', async () => {
        await setup;
        await repository.updateUserAccount('guid1', Currency_1.Currency.dash, 2000000);
        let result = await repository.updateUserAccount('guid1', Currency_1.Currency.dash, -500000, 0);
        let account = await repository.getUserAccount('guid1', 'DASH');
        assert.equal(account.balance, 1500000);
    });
    it('updateUserAccount-large-amount', async () => {
        await setup;
        await repository.updateUserAccount('guid-1', Currency_1.Currency.eth, 1);
        let data = await repository.updateUserAccount('guid-1', 'eth', 5000000000000000);
        assert.equal(data.result.nModified, 1);
        let accounts = await repository.getUserAccounts('guid-1');
        assert.equal(accounts.length, 1);
        assert.equal(accounts[0].currency, Currency_1.Currency.eth);
        assert.equal(accounts[0].balance, 5000000000000001);
    });
    it('updateUserAccount race condition', async () => {
        let guid = 'guid-1';
        await setup;
        await repository.updateUserAccount(guid, Currency_1.Currency.dash, 100000000);
        let dbAccount1 = await repository.getUserAccount(guid, Currency_1.Currency.dash);
        let dbAccount2 = await repository.getUserAccount(guid, Currency_1.Currency.dash);
        await repository.updateUserAccount(guid, Currency_1.Currency.dash, -1, dbAccount1.updateIndex);
        let error;
        try {
            await repository.updateUserAccount(guid, Currency_1.Currency.dash, -2, dbAccount1.updateIndex);
        }
        catch (e) {
            error = e;
        }
        assert.equal(error, 'Error: expecting modified count of 1 instead it is 0');
        let finalAccount = await repository.getUserAccount(guid, Currency_1.Currency.dash);
        assert.equal(finalAccount.balance, 99999999);
        let accounts = await repository.getUserAccounts(guid);
        assert.equal(accounts.length, 1);
    });
    it('increment-test', function () {
        let db = repository.db;
        return setup
            .then(() => {
            return db.collection('product').save({ name: 'product1', amount: 0 });
        })
            .then(() => {
            return db.collection('product').update({}, { $inc: { "amount": mongo.Long.fromString("5000000000000000") } });
        })
            .then(() => {
            return db.collection('product').find({}).toArray();
        })
            .then((results) => {
            assert.equal(results[0].amount, 5000000000000000);
        });
    });
    it('updateTableBalance', function () {
        let tableId;
        return setup
            .then(() => {
            return repository.getTablesConfig();
        })
            .then((arr) => {
            tableId = arr[0]._id;
            return Promise.all(arr.map((t) => repository.ensureTableBalance(t._id, t.currency)));
        })
            .then((res) => {
            return repository.updateTableBalance(tableId, new TableBalance_1.UserTableAccount('guid-1', 'user1', 1000));
        })
            .then(() => { return repository.getTableBalance(tableId); })
            .then((tableBalance) => {
            assert.equal(tableBalance.accounts.length, 1);
            assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-1').balance, 1000);
        })
            .then(() => repository.updateTableBalance(tableId, new TableBalance_1.UserTableAccount('guid-2', 'user2', 850)))
            .then(() => repository.updateTableBalance(tableId, new TableBalance_1.UserTableAccount('guid-3', 'user3', 550)))
            .then(() => { return repository.getTableBalance(tableId); })
            .then((tableBalance) => {
            assert.equal(tableBalance.accounts.length, 3);
            assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-1').balance, 1000);
            assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-2').balance, 850);
            assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-3').balance, 550);
        })
            .then(() => repository.removeTableBalance(tableId, 'guid-2'))
            .then(() => { return repository.getTableBalance(tableId); })
            .then((tableBalance) => {
            assert.equal(tableBalance.accounts.length, 2);
            assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-1').balance, 1000);
            assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-3').balance, 550);
        });
    });
    it('saveTableStates', async () => {
        await setup;
        let id;
        {
            let state = new TableState_1.TableState();
            state.tournamentId = "1234";
            await repository.saveTableStates([state]);
            id = state._id;
            let dbStates = await repository.getTableStates();
            assert.equal(1, dbStates.length);
        }
        {
            let state = new TableState_1.TableState();
            state.tournamentId = "5678";
            state._id = id;
            let foo = await repository.saveTableStates([state]);
            let dbStates = await repository.getTableStates();
            assert.equal(1, dbStates.length);
            assert.equal("5678", dbStates[0].tournamentId);
        }
        {
            let state = new TableState_1.TableState();
            state.tournamentId = "1111";
            state._id = id.toString();
            let foo = await repository.saveTableStates([state]);
            let dbStates = await repository.getTableStates();
            assert.equal(1, dbStates.length);
            assert.equal("1111", dbStates[0].tournamentId);
        }
    });
    it('saveTournamentResult', async () => {
        await setup;
        let result3;
        {
            let results = [
                new TournamentResult_1.TournamentResult("id1", "userGuid1", "userGuid1", 1, new Date()),
                new TournamentResult_1.TournamentResult("id2", "userGuid3", "userGuid3", 3, new Date()),
                new TournamentResult_1.TournamentResult("id2", "userGuid2", "userGuid2", 2, new Date()),
                new TournamentResult_1.TournamentResult("id2", "userGuid4", "userGuid4", 4, new Date()),
            ];
            result3 = results[2];
            await repository.saveTournamentResult(results);
        }
        {
            let results = await repository.getTournamentResults("id2");
            assert.equal(results.length, 3);
            assert.equal(results[0].userGuid, "userGuid2");
            assert.equal(results[1].userGuid, "userGuid3");
            assert.equal(results[2].userGuid, "userGuid4");
        }
        result3.prize = "0.2";
        await repository.saveTournamentResult([result3]);
        {
            let results = await repository.getTournamentResults("id2");
            assert.equal(results.find(r => r.userGuid == "userGuid2").prize, "0.2");
        }
    });
    it('updateTournamentHasAwardedPrizes', async () => {
        await setup;
        let tournament = new tournament_1.Tournament();
        await repository.saveTournmanet(tournament);
        let tournamentId = tournament._id.toString();
        let commandResult = await repository.updateTournamentHasAwardedPrizes(tournamentId);
        assert.equal(commandResult.result.nModified, 1);
    });
    it('getLastIncomingPaymentUpdate', async () => {
        await setup;
        let now = new Date();
        await repository.savePayment({ guid: '1', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 5) });
        await repository.savePayment({ guid: '2', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 10) });
        await repository.savePayment({ guid: '3', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 20) });
        await repository.savePayment({ guid: '4', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 1) });
        await repository.savePayment({ guid: '5', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 2) });
        await repository.savePayment({ guid: '6', type: PaymentType_1.PaymentType.incoming, updated: new Date(now.getTime() - 1000 * 60 * 7) });
        let result = await repository.getLastPaymentUpdate();
        assert.equal(result.guid, '4');
    });
    it('get payments', async () => {
        await setup;
        await repository.savePayment({ screenName: 'Foo', type: PaymentType_1.PaymentType.incoming, amount: '3000000' });
        await repository.savePayment({ screenName: 'Foo', type: PaymentType_1.PaymentType.outgoing, amount: '3000000' });
        await repository.savePayment({ screenName: 'John', type: PaymentType_1.PaymentType.outgoing, amount: '3000000' });
        let result = await repository.getPayments({ type: 'outgoing', screenName: 'foo' });
        assert.equal(result.length, 1);
        assert.equal(result[0].screenName, 'Foo');
    });
    it('getUserByEmail', async () => {
        await setup;
        let user = new User_1.User();
        user.email = "foo@bar.com";
        await repository.saveUser(user);
        let dbUser = await repository.getUserByEmail("foo@bar.com");
        assert.equal(dbUser.email, user.email);
        dbUser = await repository.getUserByEmail("Foo@bar.com");
        assert.equal(dbUser.email, user.email);
    });
    it('getUsersByScreenName', async () => {
        await setup;
        let user = new User_1.User();
        user.screenName = "john";
        await repository.saveUser(user);
        let users = await repository.getUsersByScreenName("John");
        assert.equal(1, users.length);
    });
    it('getUserIndex', async () => {
        await setup;
        await repository.createNextUserDocument();
        await repository.createNextUserDocument();
        let users = [];
        for (let i = 0; i < 10; i++) {
            let user = new User_1.User();
            user.screenName = `user${i + 1}`;
            user.guid = user.screenName;
            await repository.saveUser(user);
            users.push(user);
        }
        for (let i = 0; i < 10; i++) {
            let index = await repository.getNextUserIndex();
            assert.equal(index, i);
        }
        await repository.createNextUserDocument();
        for (let i = 10; i < 20; i++) {
            let user = new User_1.User();
            user.screenName = `user${i + 1}`;
            user.guid = user.screenName;
            await repository.saveUser(user);
            users.push(user);
        }
        for (let i = 10; i < 20; i++) {
            let index = await repository.getNextUserIndex();
            assert.equal(index, i);
        }
    });
});
function cleanDb(db) {
    return new Promise((fulfill, reject) => {
        clean(db, (err, db) => {
            if (err)
                reject();
            else
                fulfill();
        });
    });
}
//# sourceMappingURL=DataRepositoryFixture.js.map