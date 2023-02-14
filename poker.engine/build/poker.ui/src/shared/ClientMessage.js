"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRequest = exports.SetTableOptionRequest = exports.LeaveTableRequest = exports.JoinTableRequest = exports.ListTablesRequest = exports.Ping = exports.GlobalChatRequest = exports.TournamentRegisterRequest = exports.TournamentSubscriptionRequest = exports.SubscribeToTableRequest = exports.TransferFundsRequest = exports.SetAccountSettingsRequest = exports.GetAccountSettingsRequest = exports.AccountWithdrawlRequest = exports.FundAccountRequest = exports.BetRequest = exports.FoldRequest = exports.RebuyRequest = exports.CashOutRequest = exports.ExchangeRatesRequest = exports.PaymentHistoryRequest = exports.ClientMessage = void 0;
class ClientMessage {
}
exports.ClientMessage = ClientMessage;
class PaymentHistoryRequest {
    getFieldName() {
        return 'paymentHistoryRequest';
    }
}
exports.PaymentHistoryRequest = PaymentHistoryRequest;
class ExchangeRatesRequest {
    getFieldName() {
        return 'exchangeRatesRequest';
    }
}
exports.ExchangeRatesRequest = ExchangeRatesRequest;
class CashOutRequest {
    getFieldName() {
        return 'cashOutRequest';
    }
}
exports.CashOutRequest = CashOutRequest;
class RebuyRequest {
    constructor(tournamentId) {
        this.tournamentId = tournamentId;
    }
    getFieldName() {
        return 'rebuyRequest';
    }
}
exports.RebuyRequest = RebuyRequest;
class FoldRequest {
}
exports.FoldRequest = FoldRequest;
class BetRequest {
}
exports.BetRequest = BetRequest;
class FundAccountRequest {
    constructor(currency) {
        this.currency = currency;
    }
    getFieldName() {
        return 'fundAccountRequest';
    }
}
exports.FundAccountRequest = FundAccountRequest;
class AccountWithdrawlRequest {
    getFieldName() {
        return 'accountWithdrawlRequest';
    }
}
exports.AccountWithdrawlRequest = AccountWithdrawlRequest;
class GetAccountSettingsRequest {
}
exports.GetAccountSettingsRequest = GetAccountSettingsRequest;
class SetAccountSettingsRequest {
}
exports.SetAccountSettingsRequest = SetAccountSettingsRequest;
class TransferFundsRequest {
}
exports.TransferFundsRequest = TransferFundsRequest;
class SubscribeToTableRequest {
    getFieldName() {
        return 'subscribeToTableRequest';
    }
}
exports.SubscribeToTableRequest = SubscribeToTableRequest;
class TournamentSubscriptionRequest {
    getFieldName() {
        return 'tournamentSubscriptionRequest';
    }
}
exports.TournamentSubscriptionRequest = TournamentSubscriptionRequest;
class TournamentRegisterRequest {
    constructor(id) {
        this.tournamentId = id;
    }
    getFieldName() {
        return 'tournamentRegisterRequest';
    }
}
exports.TournamentRegisterRequest = TournamentRegisterRequest;
class GlobalChatRequest {
    constructor(message, initialData) {
        this.message = message;
        this.initialData = initialData;
    }
    getFieldName() {
        return 'globalChatRequest';
    }
}
exports.GlobalChatRequest = GlobalChatRequest;
class Ping {
    constructor() {
    }
    getFieldName() {
        return 'ping';
    }
}
exports.Ping = Ping;
class ListTablesRequest {
    constructor() {
    }
    getFieldName() {
        return 'listTablesRequest';
    }
}
exports.ListTablesRequest = ListTablesRequest;
class JoinTableRequest {
    constructor() {
    }
    getFieldName() {
        return 'joinTableRequest';
    }
}
exports.JoinTableRequest = JoinTableRequest;
class LeaveTableRequest {
    constructor(tableId) {
        this.tableId = tableId;
    }
    getFieldName() {
        return 'leaveTableRequest';
    }
}
exports.LeaveTableRequest = LeaveTableRequest;
class SetTableOptionRequest {
    constructor(tableId, sitOutNextHand, autoFold, autoCheck) {
        this.tableId = tableId;
        this.sitOutNextHand = sitOutNextHand;
        this.autoFold = autoFold;
        this.autoCheck = autoCheck;
    }
    getFieldName() {
        return 'setTableOptionRequest';
    }
}
exports.SetTableOptionRequest = SetTableOptionRequest;
class ChatRequest {
    constructor(tableId, message) {
        this.tableId = tableId;
        this.message = message;
    }
    getFieldName() {
        return 'chatRequest';
    }
}
exports.ChatRequest = ChatRequest;
//# sourceMappingURL=ClientMessage.js.map