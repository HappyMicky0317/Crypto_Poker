import { TableViewRow } from './TableViewRow';
import { ExchangeRate } from "./ExchangeRate";
import { LoginResult, LogoutResult } from "./login-request";
import { RegisterResult } from "./signup-request";
import { TournamentViewRow } from "./tournmanet-view-row";
import { ForgotResult } from "./forgot-request";
import { Currency } from "./Currency"
import { TournamentInfoResult } from './TournamentInfoRequest';
import { TournamentResultView } from './TournamentResultView';
import { NextBlind } from './NextBlind';

export class DataContainer {

  loginResult: LoginResult;
  user: UserData;
  version: Version;
  globalChatResult: GlobalChatResult;
  tableConfigs: TableConfigs;
  chatMessageResult: ChatMessageResult;
  subscribeTableResult: SubscribeTableResult;
  game: GameEvent;
  tableSeatEvents: TableSeatEvents;
  gameStarting: GameStartingEvent;
  deal: DealHoleCardsEvent;
  error: PokerError;
  fundAccountResult: FundAccountResult;
  accountFunded: AccountFunded;
  accountWithdrawlResult: AccountWithdrawlResult;
  globalUsers: GlobalUsers;
  cashOutRequestResult: CashOutRequestResult;
  setTableOptionResult: SetTableOptionResult;
  accountSettings: GetAccountSettingsResult;
  setAccountSettingsResult: SetAccountSettingsResult;
  tableClosed: TableClosed;
  // leaderboardResult: LeaderboardResult;    
  transferFundsResult: TransferFundsResult;
  exchangeRates: ExchangeRateResult;
  pong: Pong;
  logoutResult: LogoutResult;
  registerResult: RegisterResult;
  tournamentSubscriptionResult: TournamentSubscriptionResult;
  forgotResult: ForgotResult;
  tournamentResult: TournamentResultView;
  paymentHistoryResult: PaymentHistoryResult;
  tournamentInfoResult: TournamentInfoResult;
  duplicateIpAddress: DuplicateIpAddress;
}

export class PaymentHistoryResult {
  payments: PaymentHistoryRowView[];
}

export class DuplicateIpAddress {

}

export class PaymentHistoryRowView {
  timestamp: string;
  type: string;
  currency: string;
  amount: string;
  status: string;
  confirmations: number;
  requiredConfirmations: number;
  txHash: string;
  comment: string;
}
export class Pong {

}
export class ExchangeRateResult {
  rates: ExchangeRate[];
}
export class TransferFundsResult {
  success: boolean;
  errorMessage: string;
  amount: number;
  currency: string;
  screenName: string;
}
export class LeaderboardResult {
  users: LeaderboardUser[] = [];
}
export class LeaderboardUser {
  constructor(public screenName: string, public currency: string, public handsPlayed: number, public profitLoss: number) { }
}
export class TableClosed {
  constructor(public tableId: string){

  }
}

export class SetTableOptionResult {
  tableId: string;
  sitOutNextHand: boolean;
  autoFold: boolean;
  autoCheck: boolean;
}

export class CashOutRequestResult {
  accounts: CashOutAccount[] = [];
}

export class CashOutAccount {
  currency: string
  balance: number
  insufficientBalance: boolean;
  refundAddress: string;
  refundAddressCount: number;
}

export class TxFee {
  public static DashFeeDefault: number = 2000;

  currency?: string;
  amount?: number;
  constructor(obj: TxFee = {} as TxFee) {
    let {
      currency = '',
      amount = 0
    } = obj;

    this.currency = currency;
    this.amount = amount;
  }
}

export class UserData {
  guid: string;
  screenName: string;
  accounts: Account[] = [];
  initialData: boolean;
  notifyUserStatus: boolean;
  activated: boolean;
  muteSounds: boolean;
}

export class Version {
  constructor(public version:string, public appName:string, public appSupportEmail:string, public cdn:string){
    
  }
}

export class GlobalChatResult {
  initialData: boolean;
  messages: ChatMessage[] = [];
}

export class TableConfigs{
  rows:TableViewRow[];
}

export class GlobalUsers {
  users: UserStatus[] = [];
  initialData: boolean;
}

export class UserStatus {
  constructor(public screenName: string, public online: boolean, public countryCode?: string | null, public country?: string | null) { }
}

export class ChatMessageResult {
  tableId: string;
  initialData: boolean;
  messages: ChatMessage[] = [];
}

export class ChatMessage {
  tableId: string;
  message: string;
  screenName: string;    
}

export class PokerError {
  message: string;
  constructor(message?: string) {
    this.message = message;
  }
}
export class FundAccountResult {
  paymentAddress: string;
  addressQrCode: string;
  currency: string;
  requiredConfirmations: number;
}

export class AccountFunded {
  paymentReceived: number;//amount received to this address
  balance: number;//users account balance
  currency: string;
  confirmations: number;//number of block confirmations
}

export class AccountWithdrawlResult {
  success: boolean = false;
  fees: string;
  sentAmount: string;
  balance: string;
  errorMessage: string;
  txHash: string;
  txHashLink: string;
  currency: string;
}

export interface ITableEvent {

}

export class TableSeatEvents {
  constructor(public tableId:string){}
  seats:TableSeatEvent[] = [];
}
export class TableSeatEvent implements ITableEvent {
  name: string;
  seat: number;
  stack: number;
  empty: boolean;
  playing: boolean;
  guid: string;
  playercards: string[];
  bet: number;
  myturn: boolean;
  hasFolded: boolean;
  hasRaised: boolean;
  hasCalled: boolean;
  isSittingOut: boolean;
  timeToActSec: number;
  avatar: string;
}

export class DealHoleCardsEvent {
  constructor(public tableId:string){
    
  }
  holecards: string[];
  board: string[];
}

export class GameStartingEvent {
  constructor(public tableId:string){

  }
  startsInNumSeconds: number;
  isStarting: boolean;//set to false when a game fails to start because of not enough players
  blindsChanging: BlindsChangingEvent;
  nextBlind: NextBlind;
}
export class BlindsChangingEvent {
  constructor(public smallBlind: number, public bigBlind: number) {

  }

}
export class GameEvent {
  constructor(public tableId: string){

  }
  pot: number[] = [];
  tocall: number;
  lastRaise: number;
  action: string;
  chipsToPot: boolean;
  street: string;
  potResults: PotResult[];
  dealer: number;
  board: string[];
}
export class PotResult {
  seatWinners: number[] = [];
  winningHand: string;
  bestHandCards: string[];
  amount: number;
  amountFormatted: string;
}
export class SubscribeTableResult {
  tableId: string;
  tournamentId: string;
  tableConfig: TableViewRow;
  shutdownRequested: boolean;
  nextBlind: NextBlind;
}
export class Account {
  constructor(currency: string, balance: number) {
    this.currency = currency;
    this.balance = balance;
  }

  guid: string;
  currency: string;
  balance: number;
  updateIndex: number;
}





export class GetAccountSettingsResult {
  screenName: string;
  email: string;
  muteSounds: boolean;
}

export class SetAccountSettingsResult {
  success: boolean;
  errorMessage: string;

  constructor(success: boolean, errorMessage: string) {
    this.success = success;
    this.errorMessage = errorMessage;
  }
}

export class TournamentSubscriptionResult {
  tournaments: TournamentViewRow[] = [];
  tournamentCount: number;
}


