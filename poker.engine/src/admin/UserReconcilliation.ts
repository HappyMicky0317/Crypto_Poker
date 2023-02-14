// import { Decimal } from '../../../poker.ui/src/shared/decimal';
// import { CurrencyConfig } from './../../../poker.ui/src/shared/currency-config';
// import { CurrencyUnit } from './../../../poker.ui/src/shared/DataContainer';
// import environment from '../environment';
// const ci = require('case-insensitive');
// import { IDataRepository } from "../services/documents/IDataRepository";
// import { Payment } from "../model/Payment";
// import {DbGameResults} from "../table";
// import {User} from "../model/User";
// import {Account, Currency, LeaderboardUser } from "../../../poker.ui/src/shared/DataContainer";
// import {IReconcilliationView, WalletSummaryView} from "../../../poker.admin.ui/src/shared/IReconcilliationView";
// import {UserTableAccount, TableBalance } from "../model/TableBalance";
// import { Helpers } from '../helpers';
// var logger = require('log4js').getLogger();
// var _ = require('lodash');

// export class UserReconcilliation {

//   private reconcilliations: UserReconcilliationResult[];
//   private leaderboardUsers: LeaderboardUser[];

  
//   constructor() {    
//   }

//   async run(userGuid: string, dataRepository: IDataRepository, erc20Tokens:CurrencyConfig[]): Promise<UserReconcilliationResult[]> {
//     let user: User;
//     let tableBalances: TableBalance[];
    
//     return dataRepository.getUser(userGuid)
//       .then((u: User) => { user = u; })
//       .then(() => dataRepository.getTableBalancesByUserGuid(userGuid))
//       .then((arr: TableBalance[]) => { tableBalances = arr; })
//       .then(() => dataRepository.getPayments(userGuid))
//       .then((payments: Payment[]) => {
//         return Promise.all(user.accounts.filter(acc => acc.currency.toLowerCase() !== Currency.free).map(acc => { 
//           return this.getUserReconcilliationResult(user, acc, dataRepository, payments, tableBalances, erc20Tokens.find(t=>t.name==acc.currency)); }));
//       });
//   }

//   load(dataRepository: IDataRepository) : Promise<any>{
    
//     return this.reconcileAll(dataRepository)
//     .then((arr:UserReconcilliationResult[]) =>{
//       let invalidResults = arr.filter(r=>r.difference != 0);
//       if(invalidResults.length){
//         let message = `There are ${invalidResults.length} invalid reconcile results. screenNames: ${invalidResults.map(r=>r.screenName).join()}`;
//         if(environment.debug){
//           logger.info(message);
//         }else{
//           logger.warn(message);
//         }
        
//       }
//     })
//   }

//   async reconcileAll(dataRepository: IDataRepository) : Promise<UserReconcilliationResult[]>{
    
//     let allRecons: UserReconcilliationResult[] = [];
//     let erc20Tokens = await dataRepository.getErc20Tokens();
//     let users: User[] = await dataRepository.getUsers(null);
//           return Promise.all(users.map(u => {
//                 return this.run(u.guid, dataRepository, erc20Tokens)
//                   .then((arr: UserReconcilliationResult[]) => {
//                     for (let result of arr) {
//                       if (result.difference === 0 && result.numGames > 0)
//                         dataRepository.saveUserReconcilliationResult(result);
//                     }
//                     Array.prototype.push.apply(allRecons, arr);
//                   });
//               }))
//             .then(() => {
//               this.reconcilliations = allRecons;
//               this.setLeaderboardUsers();
//               return allRecons;
//             });
        
//   }

//   getCached() : LeaderboardUser[] {
//     return this.leaderboardUsers;
//   }

//   setLeaderboardUsers() : void {
//     this.leaderboardUsers = this.reconcilliations.filter(r=>r.numGames>0).map(r => { return this.getLeaderboardUser(r)});          
//     this.sortLeaderboard();
//   }
  
//   sortLeaderboard(){
//     this.leaderboardUsers.sort((p1: LeaderboardUser, p2: LeaderboardUser) => { return p2.profitLoss-p1.profitLoss });
//   }

//   getLeaderboardUser(r:UserReconcilliationResult) : LeaderboardUser{
//     return new LeaderboardUser(r.screenName, r.currency, r.numGames, r.profitLossTotal);
//   }

//   update(guid:string, screenName:string, profitLoss:number,currency:string) : LeaderboardUser {
//     let reconcilliation:UserReconcilliationResult = this.reconcilliations.find(r=>r.userGuid===guid && r.currency === currency);
//     if(reconcilliation!=null){
//       reconcilliation.profitLossTotal += profitLoss;
//       reconcilliation.numGames++; 
//     }      
//     else{
//       reconcilliation = new UserReconcilliationResult();
//       reconcilliation.numGames = 1;
//       reconcilliation.userGuid = guid;      
//       reconcilliation.screenName = screenName;      
//       reconcilliation.currency = currency;      
//       reconcilliation.profitLossTotal = profitLoss;
//       this.reconcilliations.push(reconcilliation);
//     }

//     for (let i = this.leaderboardUsers.length - 1; i >= 0; i--) {
//       if (this.leaderboardUsers[i].screenName === screenName && this.leaderboardUsers[i].currency===currency) {
//         this.leaderboardUsers.splice(i, 1);
//         break;
//       }
//     }

//     let leaderboardUser = this.getLeaderboardUser(reconcilliation);
//     this.leaderboardUsers.push(leaderboardUser);
//     this.sortLeaderboard();
//     return leaderboardUser;
//   }

//   updateScreenName(guid:string, oldName:string, newName:string){

//   }

//   async getUserReconcilliationResult(user: User, account: Account, dataRepository: IDataRepository, p: Payment[], tableBalances: TableBalance[], erc20Token:CurrencyConfig) :Promise<UserReconcilliationResult> {
//     let currency = account.currency.toLowerCase();
    
//     let payments = p.filter(p => ci(p.currency).equals(currency));
//     let userTableAccounts: UserTableAccount[] = tableBalances.filter(t => ci(t.currency).equals(currency)).map(b => b.accounts).reduce((a, b) => { return a.concat(b) }, []).filter(acc => acc.userGuid === user.guid);
//     let tableBalanceTotal = userTableAccounts.map(p => parseFloat(''+p.balance)).reduce((a, b) => a + b, 0);
//     let games: DbGameResults[] = await dataRepository.getGamesByUserGuid(user.guid, currency) 
//     let result: UserReconcilliationResult = new UserReconcilliationResult();
//     result.userGuid = user.guid;
//     result.screenName = user.screenName;
//     result.currency = currency;
//     result.numGames = games.length;
//     result.tableBalanceTotal = tableBalanceTotal;
//     let incomingPayments = payments.filter(p => p.type === 'incoming');
//     let outgoingPayments = payments.filter(p => p.type === 'outgoing');
//     result.remainderTotal = incomingPayments.map(p => p.remainder).reduce((a, b) => a.add(new Decimal(b)), new Decimal(0));
//     result.paymentsIncomingTotal = incomingPayments.map(p => p.amount).reduce((a, b) => a + b, 0);
//     result.sweepFeeTotal = payments.filter(p => p.type === 'incoming' && p.sweepFee).map(p => p.sweepFee).reduce((a, b) => a.add(new Decimal(b)), new Decimal(0));    
//     result.paymentsOutgoingTotal = outgoingPayments.map(p => p.amount).reduce((a, b) => a + b, 0);
//     let feesTotal = outgoingPayments.map(p => p.fees).reduce((a, b) => a.add(new Decimal(b)), new Decimal(0));
//     if(erc20Token != null){
//       result.ethFeesTotal = feesTotal;
//       result.feesTotal = new Decimal(0);
//     }      
//     else    {
//       result.feesTotal = feesTotal;
//       result.ethFeesTotal = new Decimal(0);
//     }
      
//     for (let game of games) {
//       let player = game.players.find(p => p.guid === user.guid);
//       result.profitLossTotal += player.profitLoss;
//       result.rakeTotal += player.rake;
//     }    

//     //sweepFeeTotal is not used in reconcilliation of expectedBalance as the user does not pay the sweep fee. rather it is used later when reconcilling the expected wallet balance.
//     result.expectedBalance = new Decimal(result.paymentsIncomingTotal).minus(new Decimal(result.paymentsOutgoingTotal)).minus(result.feesTotal).add(new Decimal(result.profitLossTotal)).toNumber();
//     result.accountBalance = account.balance;
//     result.actualBalance = account.balance + tableBalanceTotal;
//     result.difference = result.expectedBalance - result.actualBalance;

    

//     return result;
//   }

//   getUserReconcilliationResultViews(currency:string, results:UserReconcilliationResult[]) :UserReconcilliationResult[]{
//     let unit = CurrencyUnit.getCurrencyUnit(currency);
//     let divisor = new Decimal(unit);
//     let arr:UserReconcilliationResult[] = [];
//     if(results){
//       for(let result of results){
//         let view:UserReconcilliationResult = Object.assign({}, result);
//         view.tableBalanceTotal = this.convert(result.tableBalanceTotal, divisor);
//         view.paymentsIncomingTotal = this.convert(result.paymentsIncomingTotal, divisor);
//         view.sweepFeeTotal = <any>(result.sweepFeeTotal.dividedBy(divisor).toString());      
//         view.paymentsOutgoingTotal = this.convert(result.paymentsOutgoingTotal, divisor);
//         view.profitLossTotal = this.convert(result.profitLossTotal, divisor);      
//         view.feesTotal = <any>(result.feesTotal.dividedBy(divisor).toString());
//         view.rakeTotal = this.convert(result.rakeTotal, divisor);
//         view.expectedBalance = this.convert(result.expectedBalance, divisor);
//         view.accountBalance= this.convert(result.accountBalance, divisor);
//         view.actualBalance = this.convert(result.actualBalance, divisor);
//         view.difference = this.convert(result.difference, divisor);
//         arr.push(view);
//       } 
//     }
//     return arr;
//   }

//   convertToBaseUnits(currency:string, wallet:WalletSummaryView){    
//     let unit = CurrencyUnit.getCurrencyUnit(currency);
//     let divisor = new Decimal(unit);
    
    
//     wallet.accountBalanceTotal = this.convert(wallet.accountBalanceTotal, divisor);
//     wallet.rakeTotal = this.convert(wallet.rakeTotal, divisor);
//     wallet.sweepTotal = this.convert(wallet.sweepTotal, divisor);
//     wallet.expectedWalletBalance = this.convert(wallet.expectedWalletBalance, divisor);
//     wallet.walletBalance = this.dividedBy(wallet.walletBalance, divisor).toString();
//     wallet.difference = this.convert(wallet.difference, divisor);
//     wallet.seedAmount = this.convert(wallet.seedAmount, divisor);
//   }

//   convert(val:any, divisor:Decimal){
//     return this.dividedBy(val, divisor).toNumber();
//   }
//   dividedBy(val:any, divisor:Decimal){
//     return new Decimal(val || 0).dividedBy(divisor);
//   }

//   async getView(reconcilliations:UserReconcilliationResult[], dataRepository: IDataRepository) : Promise<IReconcilliationView> {
//     let view :IReconcilliationView =  { reconcilliations: [], wallets:[], timestamp:new Date() };
    
//     let groups = _.groupBy(reconcilliations, (r: UserReconcilliationResult) => r.currency);
    
//     let erc20Tokens = await dataRepository.getErc20Tokens();    
//     let currencies = (await dataRepository.getCurrencyConfigs()).map(t=>t.name);   
//     let ethFeesForErc20TokenTransfers = reconcilliations.map(p => p.ethFeesTotal).reduce((a, b) => a.add(b), new Decimal(0));    
    
//     for (let currency of currencies.sort()){
//       let group = <UserReconcilliationResult[]>groups[currency];      
//       let wallet:WalletSummaryView = { currency: currency }
//       let sweepTotal:Decimal = new Decimal(0);
//       let remainderTotal:Decimal = new Decimal(0);
//       if(group){
//         wallet.accountBalanceTotal = group.map(p => p.actualBalance).reduce((a, b) => a + b, 0);
//         wallet.rakeTotal = group.map(p => p.rakeTotal).reduce((a, b) => a + b, 0);
//         sweepTotal = group.map(p => p.sweepFeeTotal).reduce((a, b) => a.add(b), new Decimal(0));
//         remainderTotal = group.map(p => p.remainderTotal).reduce((a, b) => a.add(b), new Decimal(0));
//         wallet.sweepTotal = sweepTotal.toNumber();
//       }      
      
//       await this.setWalletBalance(wallet, erc20Tokens, dataRepository);//.minus(ethFeesForErc20TokenTransfers).toNumber();
//       let expectedWalletBalance = new Decimal(wallet.accountBalanceTotal).add(remainderTotal).add(new Decimal(wallet.rakeTotal)).minus(sweepTotal).add(new Decimal(wallet.seedAmount || 0))
//       if(currency==Currency.eth)
//         expectedWalletBalance = expectedWalletBalance.minus(ethFeesForErc20TokenTransfers);
//       wallet.expectedWalletBalance = expectedWalletBalance.toNumber();
//       wallet.difference = new Decimal(wallet.walletBalance||0).minus(new Decimal(wallet.expectedWalletBalance)).toNumber(); 
//       view.reconcilliations = this.getUserReconcilliationResultViews(currency, group);
//       this.convertToBaseUnits(currency, wallet);
//       view.wallets.push(wallet);      
//     }
//     return view;
//   }

//   async setWalletBalance(wallet:WalletSummaryView, erc20Tokens:CurrencyConfig[],dataRepository: IDataRepository){
//     wallet.walletBalance=null;
//     wallet.walletFetchError=null;
//     let erc20Token = erc20Tokens.find(t=>t.name==wallet.currency);
//     try{
//       if(wallet.currency === Currency.dash){
//         let data = await new DashCoreBlockService().getWalletInfo()
//         if(typeof data.balance === 'number')  {
//           wallet.walletBalance = new Decimal(data.balance).mul(CurrencyUnit.dash).toString();
//         }          
//         wallet.walletFetchError=data.error;
//       }else if(wallet.currency === Currency.eth || erc20Token != null){
//           let ethConfig = await dataRepository.getCurrencyConfig(Currency.eth);
//           let currencyConfig = await dataRepository.getCurrencyConfig(wallet.currency);
//           if(currencyConfig != null && currencyConfig.masterSeedAmount)
//             wallet.seedAmount = new Decimal(currencyConfig.masterSeedAmount).mul(100000000).toNumber();
//           if(ethConfig.masterAccount != null){
//             let amount = await this.blockCypherService.getEthAddrBal(ethConfig.masterAccount.public, erc20Token);            
//             wallet.walletBalance = Helpers.convertToLocalAmount(Currency.eth, amount);
//           }
//       }

//     }
//     catch(err)  {
//       wallet.walletFetchError=err;
//     };
//   }
// }

// export class UserReconcilliationResult {
//   numGames: number;
//   paymentsIncomingTotal: number;
//   paymentsOutgoingTotal: number;
//   feesTotal?: Decimal;
//   ethFeesTotal?: Decimal;
//   remainderTotal?: Decimal;
//   profitLossTotal: number=0;
//   rakeTotal: number=0;
//   sweepFeeTotal: Decimal=new Decimal(0);  
//   expectedBalance: number;
//   actualBalance: number;
//   difference: number;
//   payments: Payment[];
//   games: DbGameResults[];
//   currency:string;
//   userGuid:string;
//   screenName:string;
//   tableBalanceTotal:number;
//   accountBalance:number;
// }