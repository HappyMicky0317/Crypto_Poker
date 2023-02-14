"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentSubscriptionResult = exports.SetAccountSettingsResult = exports.GetAccountSettingsResult = exports.Account = exports.SubscribeTableResult = exports.PotResult = exports.GameEvent = exports.BlindsChangingEvent = exports.GameStartingEvent = exports.DealHoleCardsEvent = exports.TableSeatEvent = exports.TableSeatEvents = exports.AccountWithdrawlResult = exports.AccountFunded = exports.FundAccountResult = exports.PokerError = exports.ChatMessage = exports.ChatMessageResult = exports.UserStatus = exports.GlobalUsers = exports.TableConfigs = exports.GlobalChatResult = exports.Version = exports.UserData = exports.TxFee = exports.CashOutAccount = exports.CashOutRequestResult = exports.SetTableOptionResult = exports.TableClosed = exports.LeaderboardUser = exports.LeaderboardResult = exports.TransferFundsResult = exports.ExchangeRateResult = exports.Pong = exports.PaymentHistoryRowView = exports.DuplicateIpAddress = exports.PaymentHistoryResult = exports.DataContainer = void 0;
class DataContainer {
}
exports.DataContainer = DataContainer;
class PaymentHistoryResult {
}
exports.PaymentHistoryResult = PaymentHistoryResult;
class DuplicateIpAddress {
}
exports.DuplicateIpAddress = DuplicateIpAddress;
class PaymentHistoryRowView {
}
exports.PaymentHistoryRowView = PaymentHistoryRowView;
class Pong {
}
exports.Pong = Pong;
class ExchangeRateResult {
}
exports.ExchangeRateResult = ExchangeRateResult;
class TransferFundsResult {
}
exports.TransferFundsResult = TransferFundsResult;
class LeaderboardResult {
    constructor() {
        this.users = [];
    }
}
exports.LeaderboardResult = LeaderboardResult;
class LeaderboardUser {
    constructor(screenName, currency, handsPlayed, profitLoss) {
        this.screenName = screenName;
        this.currency = currency;
        this.handsPlayed = handsPlayed;
        this.profitLoss = profitLoss;
    }
}
exports.LeaderboardUser = LeaderboardUser;
class TableClosed {
    constructor(tableId) {
        this.tableId = tableId;
    }
}
exports.TableClosed = TableClosed;
class SetTableOptionResult {
}
exports.SetTableOptionResult = SetTableOptionResult;
class CashOutRequestResult {
    constructor() {
        this.accounts = [];
    }
}
exports.CashOutRequestResult = CashOutRequestResult;
class CashOutAccount {
}
exports.CashOutAccount = CashOutAccount;
class TxFee {
    constructor(obj = {}) {
        let { currency = '', amount = 0 } = obj;
        this.currency = currency;
        this.amount = amount;
    }
}
exports.TxFee = TxFee;
TxFee.DashFeeDefault = 2000;
class UserData {
    constructor() {
        this.accounts = [];
    }
}
exports.UserData = UserData;
class Version {
    constructor(version, appName, appSupportEmail, cdn) {
        this.version = version;
        this.appName = appName;
        this.appSupportEmail = appSupportEmail;
        this.cdn = cdn;
    }
}
exports.Version = Version;
class GlobalChatResult {
    constructor() {
        this.messages = [];
    }
}
exports.GlobalChatResult = GlobalChatResult;
class TableConfigs {
}
exports.TableConfigs = TableConfigs;
class GlobalUsers {
    constructor() {
        this.users = [];
    }
}
exports.GlobalUsers = GlobalUsers;
class UserStatus {
    constructor(screenName, online, countryCode, country) {
        this.screenName = screenName;
        this.online = online;
        this.countryCode = countryCode;
        this.country = country;
    }
}
exports.UserStatus = UserStatus;
class ChatMessageResult {
    constructor() {
        this.messages = [];
    }
}
exports.ChatMessageResult = ChatMessageResult;
class ChatMessage {
}
exports.ChatMessage = ChatMessage;
class PokerError {
    constructor(message) {
        this.message = message;
    }
}
exports.PokerError = PokerError;
class FundAccountResult {
}
exports.FundAccountResult = FundAccountResult;
class AccountFunded {
}
exports.AccountFunded = AccountFunded;
class AccountWithdrawlResult {
    constructor() {
        this.success = false;
    }
}
exports.AccountWithdrawlResult = AccountWithdrawlResult;
class TableSeatEvents {
    constructor(tableId) {
        this.tableId = tableId;
        this.seats = [];
    }
}
exports.TableSeatEvents = TableSeatEvents;
class TableSeatEvent {
}
exports.TableSeatEvent = TableSeatEvent;
class DealHoleCardsEvent {
    constructor(tableId) {
        this.tableId = tableId;
    }
}
exports.DealHoleCardsEvent = DealHoleCardsEvent;
class GameStartingEvent {
    constructor(tableId) {
        this.tableId = tableId;
    }
}
exports.GameStartingEvent = GameStartingEvent;
class BlindsChangingEvent {
    constructor(smallBlind, bigBlind) {
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
    }
}
exports.BlindsChangingEvent = BlindsChangingEvent;
class GameEvent {
    constructor(tableId) {
        this.tableId = tableId;
        this.pot = [];
    }
}
exports.GameEvent = GameEvent;
class PotResult {
    constructor() {
        this.seatWinners = [];
    }
}
exports.PotResult = PotResult;
class SubscribeTableResult {
}
exports.SubscribeTableResult = SubscribeTableResult;
class Account {
    constructor(currency, balance) {
        this.currency = currency;
        this.balance = balance;
    }
}
exports.Account = Account;
class GetAccountSettingsResult {
}
exports.GetAccountSettingsResult = GetAccountSettingsResult;
class SetAccountSettingsResult {
    constructor(success, errorMessage) {
        this.success = success;
        this.errorMessage = errorMessage;
    }
}
exports.SetAccountSettingsResult = SetAccountSettingsResult;
class TournamentSubscriptionResult {
    constructor() {
        this.tournaments = [];
    }
}
exports.TournamentSubscriptionResult = TournamentSubscriptionResult;
//# sourceMappingURL=DataContainer.js.map