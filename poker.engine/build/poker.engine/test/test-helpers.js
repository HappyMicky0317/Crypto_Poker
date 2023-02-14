"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestHelpers = void 0;
var substitute = require('jssubstitute');
const IDataRepository_1 = require("../src/services/documents/IDataRepository");
const User_1 = require("../src/model/User");
const TableBalance_1 = require("../src/model/TableBalance");
const TableConfig_1 = require("../src/model/TableConfig");
const Currency_1 = require("../../poker.ui/src/shared/Currency");
const JoinTableRequest_1 = require("../src/model/table/JoinTableRequest");
class TestHelpers {
    static addPlayerHandle(table, seat, subscriber) {
        table.addPlayerHandle(new JoinTableRequest_1.JoinTableRequest(seat, subscriber.user.guid, subscriber.user.screenName, subscriber.user.gravatar, 1000));
    }
    static getJoinTableRequest(seat, subscriber) {
        return new JoinTableRequest_1.JoinTableRequest(seat, subscriber.user.guid, subscriber.user.screenName, subscriber.user.gravatar, 1000);
    }
    static getSubstitute(c) {
        let sub = substitute.for(new c());
        return sub;
    }
    static getDataRepository() {
        let dataRepository = TestHelpers.getSubstitute(IDataRepository_1.IDataRepository);
        dataRepository.returns('getTablesConfig', Promise.resolve([new TableConfig_1.TableConfig("table1", 0.1, 0.2, "dash", "id1"), new TableConfig_1.TableConfig("table2", 0.1, 0.2, "usd", "id1")]));
        let user = new User_1.User();
        user.guid = "ABCDEF";
        dataRepository.returns('getUser', Promise.resolve(user));
        dataRepository.returns('saveUser', Promise.resolve());
        dataRepository.returns('saveGame', Promise.resolve());
        dataRepository.returns('saveExchangeRate', Promise.resolve());
        dataRepository.returns('getExchangeRate', Promise.resolve());
        dataRepository.returns('saveClientMessage', Promise.resolve());
        dataRepository.returns('savePayment', Promise.resolve());
        dataRepository.returns('saveChat', Promise.resolve());
        dataRepository.returns('getChatMessages', Promise.resolve([]));
        dataRepository.returns('getGames', Promise.resolve([]));
        dataRepository.returns('updateUserAccount', Promise.resolve({ result: { nModified: 1 } }));
        dataRepository.returns('updateTableBalance', Promise.resolve({ result: { nModified: 1 } }));
        dataRepository.returns('removeTableBalance', Promise.resolve({ result: { nModified: 1 } }));
        dataRepository.returns('ensureTableBalance', Promise.resolve(new TableBalance_1.TableBalance('id1', Currency_1.Currency.free)));
        return dataRepository;
    }
    static getTableConfig() {
        let tableConfig = new TableConfig_1.TableConfig("table1", 1, 2, Currency_1.Currency.free, "id1");
        tableConfig.smallBlind = 1;
        tableConfig.bigBlind = 2;
        tableConfig.exchangeRate = 1;
        return tableConfig;
    }
    static hasDuplicates(array) {
        return (new Set(array)).size !== array.length;
    }
}
exports.TestHelpers = TestHelpers;
//# sourceMappingURL=test-helpers.js.map