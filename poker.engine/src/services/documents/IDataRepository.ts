import { TableState } from './../../model/TableState';
import { IReconcilliationView } from './../../../../poker.admin.ui.angular/src/app/shared/IReconcilliationView';
import {User} from "../../model/User";
import {ChatMessage, Account} from "../../../../poker.ui/src/shared/DataContainer";
import { ExchangeRate } from "../../../../poker.ui/src/shared/ExchangeRate";
import { Payment } from "../../model/Payment";
import {TableBalance, UserTableAccount } from "../../model/TableBalance";
import { ClientMessage } from '../../../../poker.ui/src/shared/ClientMessage';
import { Tournament } from '../../model/tournament';
import { TournamentRegistration } from '../../model/TournamentRegistration';
import { TableConfig } from '../../model/TableConfig';
import { TournamentResult } from '../../model/TournamentResult';
import { CurrencyConfig } from '../../model/CurrencyConfig';
import { AddressInfo } from '../../model/AddressInfo';
import { UserSmall } from '../../model/UserSmall';
import { ChangeSeatHistory } from '../../model/ChangeSeatHistory';
import { TableProcessorMessage, DbTableProcessorMessage } from '../../admin/processor/table-processor/TableProcessor';
import { DbGameResults } from '../../model/table/DbGameResults';
import { Decimal } from '../../../../poker.ui/src/shared/decimal';
import { QueryMeta } from './QueryMeta';
import { Admin } from '../../model/Admin';

export class IDataRepository {
  getTablesConfig(): Promise<TableConfig[]> { throw new Error("Not implemented"); };
  getUser(guid: string): Promise<User|null> { throw new Error("Not implemented"); };  
  getUserAccount(guid: string, currency: string) : Promise<Account> { throw new Error("Not implemented"); };  
  getUserAccounts(guid: string) : Promise<Account[]> { throw new Error("Not implemented"); };  
  saveUser(user: User): Promise<void> { throw new Error("Not implemented"); };
  saveGame(game: DbGameResults): any { throw new Error("Not implemented"); };  
  saveExchangeRate(exchangeRate: ExchangeRate): any { throw new Error("Not implemented"); };
  getExchangeRate(base: string): Promise<ExchangeRate> { throw new Error("Not implemented"); };
  getExchangeRates(): Promise<ExchangeRate[]> { throw new Error("Not implemented"); };
  saveClientMessage(message: ClientMessage, tableId: string, guid: string): Promise<any> { throw new Error("Not implemented"); };  
  getPayments(args:{guid?:string, currency?:string, type?:string}): Promise<Payment[]> { throw new Error("Not implemented"); };
  getPaymentsSince(id:string): Promise<Payment[]> { throw new Error("Not implemented"); };
  getLastPaymentUpdate(): Promise<Payment|null> { throw new Error("Not implemented"); };
  
  savePayment(payment: Payment): any { throw new Error("Not implemented"); };  
  saveTableConfig(tableConfig: TableConfig): Promise<any> { throw new Error("Not implemented"); };
  deleteTableConfig(id: string): Promise<any> { throw new Error("Not implemented"); };
  deleteUser(guid: string): Promise<any> { throw new Error("Not implemented"); };
  saveChat(globalChatRequest: ChatMessage): Promise<any> { throw new Error("Not implemented"); };
  getChatMessages(tableId?: string): Promise<ChatMessage[]> { throw new Error("Not implemented"); };
  getGames(tableId: string, userGuid:string, tournamentId:string, skip?: number, limit?: number): Promise<DbGameResults[]> { throw new Error("Not implemented"); };
  getGamesByUserGuid(userGuid: string, currency: string): Promise<DbGameResults[]> { throw new Error("Not implemented"); };
  updateUserAccount(guid: string, currency: string, balance: number, updateIndex?:number): Promise<any> { throw new Error("Not implemented"); };
  getUsers(searchTerm: string, limit:number, includeAnon:boolean): Promise<UserSmall[]> { throw new Error("Not implemented"); };
  updateTableBalance(tableId: string, account: UserTableAccount): Promise<any> { throw new Error("Not implemented"); };
  ensureTableBalance(tableId: string, currency:string): Promise<TableBalance> { throw new Error("Not implemented"); };
  removeTableBalance(tableId: string, userGuid: string): Promise<any> { throw new Error("Not implemented"); };
  updateTableBalances(tableId: string, currency:string, accounts: UserTableAccount[]): Promise<any> { throw new Error("Not implemented"); };  
  getPaymentByTxId(currency:string, txId: string): Promise<Payment|null> { throw new Error("Not implemented"); };
  getPaymentIncomingByTournamentId(tournamentId:string, userGuid:string): Promise<Payment|null> { throw new Error("Not implemented"); };
  getTournamentBuyIns(tournamentId:string): Promise<Decimal> { throw new Error("Not implemented"); };
  getPaymentById(id: string): Promise<Payment> { throw new Error("Not implemented"); };
  getTableBalancesByUserGuid(userGuid: string): Promise<TableBalance[]> { throw new Error("Not implemented"); }
  getUsersByScreenName(screenName: string): Promise<User[]> { throw new Error("Not implemented"); }
  getUserByEmail(email: string): Promise<User> { throw new Error("Not implemented"); }
  getUserByActivationToken(token: string): Promise<User> { throw new Error("Not implemented"); }
  getUserByResetPasswordToken(token: string): Promise<User> { throw new Error("Not implemented"); }
  mergeGames(mergeFromGuid: string, mergeToGuid: string): Promise<any> { throw new Error("Not implemented"); }
  mergePayments(mergeFromGuid: string, mergeToGuid: string): Promise<any> { throw new Error("Not implemented"); }
  deleteUserReconcilliation(guid: string): Promise<any> { throw new Error("Not implemented"); }  
  getUnusedSweepPayment(guid:string): Promise<Payment> { throw new Error("Not implemented"); };    
  getAddressInfo(guid: string, currency: string, processed: boolean): Promise<AddressInfo[]> { throw new Error("Not implemented"); };
  getAddressInfoByAddress(address:string): Promise<AddressInfo[]> { throw new Error("Not implemented"); };
  saveAddress(info: AddressInfo): any { throw new Error("Not implemented"); };
  saveReconcilliationView(view: IReconcilliationView): Promise<any> { throw new Error("Not implemented"); };
  getReconcilliationView(): Promise<IReconcilliationView> { throw new Error("Not implemented"); };  
  
  saveTournmanet(tournmanet:Tournament): Promise<any> { throw new Error("Not implemented"); };  
  getTournaments(args?:any, limit?:number, meta?:QueryMeta): Promise<Tournament[]> { throw new Error("Not implemented"); };  
  getTournmanetById(id:string): Promise<Tournament> { throw new Error("Not implemented"); };  
  deleteTournmanet(id: string): Promise<any> { throw new Error("Not implemented"); };  
  saveTournamentRegistration(registration: TournamentRegistration): Promise<void> { throw new Error("Not implemented"); };  
  getTournamentRegistrations(args: { userGuid?: string; tournamentId?: string; }): Promise<TournamentRegistration[]> { throw new Error("Not implemented"); };  
  getTournamentPlayerCount(tournamentId:string): Promise<number> { throw new Error("Not implemented"); };    
  saveTableStates(states:TableState[]): Promise<any[]> { throw new Error("Not implemented"); };  
  getTableStates(args?:any): Promise<TableState[]> { throw new Error("Not implemented"); }; 
  saveTournamentResult(results:TournamentResult[]) : Promise<any> { throw new Error("Not implemented"); }; 
  deleteTournamentResult(tournamentId:string, userGuid:string) : Promise<any> { throw new Error("Not implemented"); }; 
  getTournamentResults(tournamentId:string) : Promise<TournamentResult[]> { throw new Error("Not implemented"); }; 
  updateTournamentHasAwardedPrizes(tournamentId:string) : Promise<any> { throw new Error("Not implemented"); };    
  getCurrencyConfig(currency:string): Promise<CurrencyConfig> { throw new Error("Not implemented"); }; 
  getCurrencyConfigs(): Promise<CurrencyConfig[]> { throw new Error("Not implemented"); };  
  saveCurrencyConfig(token:CurrencyConfig): Promise<any> { throw new Error("Not implemented"); };
  saveChangeSeatHistory(history:ChangeSeatHistory): Promise<any> { throw new Error("Not implemented"); };
  saveTableProcessorMessage(message:DbTableProcessorMessage): Promise<any> { throw new Error("Not implemented"); };
  getBlockedCountries(): Promise<{countryCode:string}[]> { throw new Error("Not implemented"); };
  createNextUserDocument() : Promise<void>  { throw new Error("Not implemented"); };
  getNextUserIndex(): Promise<number> { throw new Error("Not implemented"); };
  getAddressInfoSince(id:string): Promise<AddressInfo[]> { throw new Error("Not implemented"); };
  getUserBalances(currency:string) : Promise<{screenName:string, joined:string, email:string, balance:number}[]> { throw new Error("Not implemented"); };
  getAdmins(): Promise<Admin[]> { throw new Error("Not implemented"); };  
  saveAdmin(admin:Admin): Promise<any> { throw new Error("Not implemented"); };
}