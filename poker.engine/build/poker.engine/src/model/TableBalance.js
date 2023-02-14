"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTableAccount = exports.TableBalance = void 0;
class TableBalance {
    constructor(tableId, currency) {
        this.tableId = tableId;
        this.currency = currency;
        this.accounts = [];
    }
}
exports.TableBalance = TableBalance;
class UserTableAccount {
    constructor(userGuid, screenName, balance) {
        this.userGuid = userGuid;
        this.screenName = screenName;
        this.balance = balance;
    }
}
exports.UserTableAccount = UserTableAccount;
//# sourceMappingURL=TableBalance.js.map