import { LoginRequest, LogoutRequest } from "./login-request";
import { RegisterRequest } from "./signup-request";
import { ForgotRequest } from "./forgot-request";
import { TournamentInfoRequest } from "./TournamentInfoRequest";


export class ClientMessage {
  loginRequest: LoginRequest;
  logoutRequest: LogoutRequest;
  registerRequest: RegisterRequest;  
  forgotRequest: ForgotRequest;  
  joinTableRequest: JoinTableRequest;
  listTablesRequest: ListTablesRequest;
  subscribeToTableRequest: SubscribeToTableRequest;
  exchangeRatesRequest: ExchangeRatesRequest;
  globalChatRequest: GlobalChatRequest; 
  tournamentSubscriptionRequest: TournamentSubscriptionRequest;
  leaveTableRequest: LeaveTableRequest;
  fold: FoldRequest;
  bet: BetRequest;  
  fundAccountRequest: FundAccountRequest;  
  accountWithdrawlRequest: AccountWithdrawlRequest;  
  setTableOptionRequest: SetTableOptionRequest;  
  chatRequest: ChatRequest;  
  cashOutRequest: CashOutRequest;  
  getAccountSettingsRequest: GetAccountSettingsRequest;
  setAccountSettingsRequest: SetAccountSettingsRequest;  
  transferFundsRequest: TransferFundsRequest;  
  ping: Ping;
  tournamentRegisterRequest: TournamentRegisterRequest;
  paymentHistoryRequest: PaymentHistoryRequest;
  tournamentInfoRequest: TournamentInfoRequest;
  rebuyRequest: RebuyRequest;
}



export interface IClientServerMessage{
  getFieldName():string;
}

export class PaymentHistoryRequest implements IClientServerMessage{
  getFieldName(){
    return 'paymentHistoryRequest'
  }
}

export class ExchangeRatesRequest implements IClientServerMessage {
  getFieldName(){
    return 'exchangeRatesRequest'
  }
}


export class CashOutRequest implements IClientServerMessage {
  getFieldName(){
    return 'cashOutRequest'
  }
}

export class RebuyRequest  implements IClientServerMessage{
  constructor(public tournamentId:string){
      
  }

  getFieldName(){
    return 'rebuyRequest'
  }
}







export class FoldRequest {
  tableId: string;
}

export class BetRequest {
  tableId: string;
  amount: number;
}

export class FundAccountRequest implements IClientServerMessage {
  
  constructor(public currency: string)  {

  }
  
  getFieldName(){
    return 'fundAccountRequest'
  }
}

export class AccountWithdrawlRequest implements IClientServerMessage {
  currency: string;
  receivingAddress: string;
  amount: string;
  getFieldName(){
    return 'accountWithdrawlRequest'
  }
}
export class GetAccountSettingsRequest {

}
export class SetAccountSettingsRequest {
  screenName: string;
  muteSounds: boolean;
}
export class TransferFundsRequest {
  screenName: string;
  amount: number;
  currency: string;
}

export class SubscribeToTableRequest implements IClientServerMessage{
  tableId: string;
  tournamentId: string;
  getFieldName(){
    return 'subscribeToTableRequest'
  }
}

export class TournamentSubscriptionRequest implements IClientServerMessage{
  getFieldName(){
    return 'tournamentSubscriptionRequest'
  }  
}
export class TournamentRegisterRequest implements IClientServerMessage{
  tournamentId:string;  
  constructor(id?:string) {
    this.tournamentId=id;
  }  
  getFieldName(){
    return 'tournamentRegisterRequest'
  } 
}

export class GlobalChatRequest implements IClientServerMessage{
  constructor(public message: string, public initialData?: boolean) {
  }  
  getFieldName(){
    return 'globalChatRequest'
  } 
}

export class Ping implements IClientServerMessage{
  constructor() {
  } 
  getFieldName(){
    return 'ping'
  }  
}

export class ListTablesRequest implements IClientServerMessage{
  constructor() {
  }
  getFieldName(){
    return 'listTablesRequest'
  }   
}


export class JoinTableRequest implements IClientServerMessage{
  seat: number;
  tableId: string;
  amount: number;//is deserialized as a string

  constructor() {
  }
  getFieldName(){
    return 'joinTableRequest'
  }   
}

export class LeaveTableRequest implements IClientServerMessage {  
  constructor(public tableId: string) {
  }
  getFieldName(){
    return 'leaveTableRequest'
  }   
}

export class SetTableOptionRequest implements IClientServerMessage {

  constructor(public tableId: string, public sitOutNextHand?: boolean, public autoFold?: boolean, public autoCheck?: boolean) {
  }
  getFieldName(){
    return 'setTableOptionRequest'
  }   
}

export class ChatRequest implements IClientServerMessage {

  constructor(public tableId: string, public message: string) {
  } 
  getFieldName(){
    return 'chatRequest'
  }  
}
