"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountView = exports.UserDetailView = void 0;
class UserDetailView {
    constructor() {
        this.guid = undefined;
        this.screenName = undefined;
        this.email = undefined;
        this.password = undefined;
        this.activated = undefined;
        this.notifyUserStatus = undefined;
        this.disabled = undefined;
        this.accounts = [];
        this.depositIndex = undefined;
    }
}
exports.UserDetailView = UserDetailView;
class AccountView {
    constructor(currency, balance) {
        this.currency = currency;
        this.balance = balance;
    }
}
exports.AccountView = AccountView;
//# sourceMappingURL=user-detail-view.js.map