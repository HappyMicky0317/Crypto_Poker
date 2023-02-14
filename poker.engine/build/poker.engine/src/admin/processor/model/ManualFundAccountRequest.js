"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualFundAccountResult = exports.ManualFundAccountRequest = void 0;
class ManualFundAccountRequest {
    constructor(guid, currency, amount, comment) {
        this.guid = guid;
        this.currency = currency;
        this.amount = amount;
        this.comment = comment;
    }
}
exports.ManualFundAccountRequest = ManualFundAccountRequest;
class ManualFundAccountResult {
    constructor(success, message) {
        this.success = success;
        this.message = message;
    }
}
exports.ManualFundAccountResult = ManualFundAccountResult;
//# sourceMappingURL=ManualFundAccountRequest.js.map