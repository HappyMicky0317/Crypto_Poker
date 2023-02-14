import { TournamentResult } from './model/TournamentResult';

import { Currency, CurrencyUnit } from "../../poker.ui/src/shared/Currency";
import { Decimal } from './../../poker.ui/src/shared/decimal';
import {  UserStatus, UserData, DataContainer, FundAccountResult } from "../../poker.ui/src/shared/DataContainer";
import bcrypt = require('bcrypt');
import { WebSocketHandle, IWebSocket } from './model/WebSocketHandle';
import { User } from './model/User';
import { Table } from './table';
import { TableBalance } from './model/TableBalance';
import { IDataRepository } from './services/documents/IDataRepository';
import { TableViewRow } from '../../poker.ui/src/shared/TableViewRow';
import { TableConfig } from './model/TableConfig';
import { BlindConfig, Tournament } from './model/tournament';
import { Logger, getLogger } from "log4js";
var logger:Logger = getLogger();
import * as _ from "lodash";
import { TournamentViewRow } from '../../poker.ui/src/shared/tournmanet-view-row';
import { TableProcessor } from './admin/processor/table-processor/TableProcessor';
import { ITimerProvider } from './model/table/ITimerProvider';
import { AdminTournamentResultsView, TournamentResultView } from '../../poker.admin.ui.angular/src/app/shared/AdminTournamentResultsView';
import { TournmanetStatus } from '../../poker.ui/src/shared/TournmanetStatus';
import { to } from './shared-helpers';
import { Payment } from './model/Payment';
import { PaymentType } from '../../poker.ui/src/shared/PaymentType';
import { PaymentStatus } from '../../poker.ui/src/shared/PaymentStatus';
import { UserSmall } from './model/UserSmall';
import { TournamentPaymentMeta } from './model/TournamentPaymentMeta';
import { Http } from './services/Http';
const QRCode = require('qrcode')
var md5 = require('md5');

export class Helpers {

    
    public static isNullOrWhitespace( input:string ):boolean {
        return !input || !input.trim();
      }          
}

  
export function hashPassword(password: string): Promise<string> {
    return new Promise<any>((resolve, reject) => {
        let saltFactor = 5;
        bcrypt.genSalt(saltFactor, (err: any, salt: any) => {
            if (err) {
                reject(err);
            }
            bcrypt.hash(password, salt, (err: any, hash: any) => {
                if (err) {
                    reject(err);
                }
                resolve(hash);
            });
        });
    });
}


export function removeItem(array:any[], item:any) : boolean{
    let index = array.indexOf(item);
    if(index > -1){
        array.splice(index, 1);
        return true;
    }
    return false;
}





export function toUserStatus(wsHandle: WebSocketHandle, online:boolean) : UserStatus{
    return new UserStatus(wsHandle.user.screenName, online, wsHandle.countryCode, wsHandle.country);
  }

export async function getUserData(user: User, dataRepository:IDataRepository, initialData:boolean=true) : Promise<UserData>{
    let data = new UserData();
    data.initialData = initialData;
    data.guid = user.guid;
    data.screenName = user.screenName;    
    data.accounts = await dataRepository.getUserAccounts(user.guid);
    data.notifyUserStatus = user.notifyUserStatus;
    data.activated = user.activated;
    data.muteSounds = user.muteSounds;
    return data;
}

export async function getGravatar(email:string) : Promise<string>{
    let md5sum = md5(email.toLowerCase());
    const http = new Http();
    let [err,data] = await to(http.get(`https://www.gravatar.com/${md5sum}`));
    if(data){
        let gravatar = `https://www.gravatar.com/avatar/${md5sum}.jpg`;
        return gravatar;
    }
    return null;        
}


export function getTableViewRow(table:Table): TableViewRow{
    let t = table.tableConfig;
    let view = new TableViewRow();

    //do not use Object.assign. these exact fields only
    view._id = t._id.toString();
    view.name = t.name;
    view.smallBlind = t.smallBlind;
    view.smallBlindUsd = t.smallBlindUsd;
    view.bigBlind = t.bigBlind;
    view.bigBlindUsd = t.bigBlindUsd;
    view.currency = t.currency;
    view.exchangeRate = t.exchangeRate;
    view.timeToActSec = t.timeToActSec;
    view.maxPlayers = t.maxPlayers;
    view.tournamentId = table.tournamentId;
    view.maxBuyIn = t.maxBuyIn;
    view.numPlayers = table.getPlayerCount();
    return view;
}

export async function setupTable(config: TableConfig, dataRepository:IDataRepository, processor:TableProcessor, timerProviderFactory:(p:TableProcessor)=>ITimerProvider): Promise<Table|null> {
    let table = new Table(config);
    table.processor = processor;
    table.timerProvider = timerProviderFactory(processor);
    table.dataRepository = dataRepository;

    if(config._id){
        let data = await dataRepository.getChatMessages(config._id);
        table.chatMessages = data.reverse();
        for (let message of table.chatMessages) {
          message.tableId = undefined;
        }
    }
    

    if (config.currency === Currency.free) {
      config.smallBlind = config.smallBlindUsd * 100;
      config.bigBlind = config.bigBlindUsd * 100;
      config.exchangeRate = 1;
    } else if (config.currency !== Currency.tournament) {
      let exchangeRate = await dataRepository.getExchangeRate(config.currency);
      if (exchangeRate) {
        table.updateExchangeRate(exchangeRate.price);
      } else {
        let message = `for table ${table.tableConfig.name} exchangeRate not defined for currency: ${config.currency}`;
        logger.warn(message);
        return null;
      }
    }

    if (config.currency !== Currency.tournament){
        let tableBalance: TableBalance = await dataRepository.ensureTableBalance(config._id, config.currency);
        await Promise.all(tableBalance.accounts.map(acc => {
          return table.removeTableBalance(acc.userGuid)
            .then(() => {
                return transferTableBalance(acc.userGuid, acc.balance, table.tableConfig.currency, dataRepository, `table ${table.tableConfig.name}`);
            });
        }))
    }
    
    

    return table;

  }

  export async function transferTableBalance(guid:string, stack:number, currency:string, dataRepository:IDataRepository, type:string) : Promise<any> {     
    logger.info(`${guid} adding stack of ${stack} to player account (from ${type}): ${currency}`);
    await dataRepository.updateUserAccount(guid, currency, stack)         
  }

  export function getBlindConfig(blindsStartTime:Date, blindConfig:BlindConfig[]) : BlindConfigResult {
    
    let now = new Date();    
    let totalTime:number = 0;
    for(let blinds of blindConfig){
      totalTime += blinds.timeMin * 60 * 1000;
      let blindPeriod = new Date(blindsStartTime.getTime() + totalTime);
      if(blindPeriod > now){
        let remainingTimeSec = (blindPeriod.getTime()-now.getTime())/1000;        
        return { blinds:blinds, remainingTimeSec:remainingTimeSec };
      }
    }
    return { blinds:blindConfig[blindConfig.length-1], remainingTimeSec:0 };
   }
   export interface BlindConfigResult { 
       blinds:BlindConfig;
       remainingTimeSec : number;
   }

   export async function getAdminTournamentResultsView(tournament:Tournament, dataRepository:IDataRepository) : Promise<{view:AdminTournamentResultsView, results:TournamentResult[]}>{
    let view:AdminTournamentResultsView = new AdminTournamentResultsView();
    view.hasAwardedPrizes = tournament.hasAwardedPrizes;
    const tournamentId = tournament._id.toString();
    let results = <TournamentResult[]>await dataRepository.getTournamentResults(tournamentId);
    let buyInTotal = await dataRepository.getTournamentBuyIns(tournamentId);  
    view.canAwardPrizes = tournament.status == TournmanetStatus.Complete && !tournament.hasAwardedPrizes;
    if(view.canAwardPrizes){
      awardPrizes(tournament, results, buyInTotal);
    }
    
    for(let result of results){
      view.results.push(new TournamentResultView(result.screenName, result.placing, result.prize))
    }
    return { view: view, results: results };
  }

  export function getCalculatedPrizes(tournament:Tournament, buyInTotal:Decimal) : string[] {    
    let totalPrize = getTotalPrize(tournament, buyInTotal);
    let prizes = tournament.prizes.map(p=>new Decimal(p).mul(totalPrize));
    return prizes.map(p=>p.toString());
  }

  export function getTotalPrize(tournament:Tournament, buyInTotal:Decimal) : Decimal {
   
    let percentageTotal = tournament.prizes.map(p=>new Decimal(p)).reduce((a,b)=>a.add(b), new Decimal(0));
    if(!percentageTotal.equals(1)){
        throw new Error(`percentage array must add up to 1. percentageTotal:${percentageTotal} ${tournament._id.toString()}`)
    }
    let totalPrize = new Decimal(tournament.housePrize).add(buyInTotal);
    return totalPrize;
  }

   export function awardPrizes(tournament:Tournament, results: TournamentResult[], buyInTotal:Decimal, roundDecimalPlaces:number=4) : void{
    let prizes = getCalculatedPrizes(tournament, buyInTotal).map(p=>new Decimal(p));
    let groups = _.groupBy(results , (r: TournamentResult) => r.placing);
    let tmpText = '1';
    for (let i = 0; i < roundDecimalPlaces; i++) {
        tmpText+='0';        
    }
    let roundingMultiplier = new Decimal(tmpText);
    let sortedKeys = _.keys(groups).map(k=>parseInt(k)).sort((a,b)=> a-b);
    

    for(let key of sortedKeys){
        
        let group = groups[key.toString()];
        let groupPrizes = prizes.splice(0, group.length);
        let totalGroupPrize = groupPrizes.reduce((a,b)=>a.add(b), new Decimal(0));
        if(totalGroupPrize.greaterThan(0)){            
            let individualPrize = totalGroupPrize.dividedBy(group.length).mul(roundingMultiplier).floor().dividedBy(roundingMultiplier);        
            for(let tournamentResult of group){
                tournamentResult.prize = individualPrize.toString();
            }
        }else{
            break;
        }
        
    }
   }

   export function getRandomItem<T>(arr:T[]) : T {
    let result = getRandomItemAndIndex(arr);
    return result.item;
   }
   export function getRandomItemAndIndex<T>(arr:T[]) : { item:T, index:number} {
    let randomIndex = Math.round((arr.length-1)*Math.random());
    return { item:arr[randomIndex], index:randomIndex };
   }

   export function getIpAddress(ws:IWebSocket, request:any){      
    return request.headers['x-forwarded-for'] || ws._socket.remoteAddress.replace('::ffff:', '');
  }

  export async function getFundAccountResult(currency:string, requiredConfirmations:number, address:string){
    let data = new DataContainer();
    data.fundAccountResult = new FundAccountResult();
    data.fundAccountResult.currency = currency;
    data.fundAccountResult.requiredConfirmations = requiredConfirmations;
    data.fundAccountResult.paymentAddress = address;
    data.fundAccountResult.addressQrCode = await QRCode.toDataURL(address, { width: 115, height: 115 });
    return data;
  }

  export async function getTournamentViewRow(tournament:Tournament, dataRepository:IDataRepository) : Promise<TournamentViewRow> {
    let view = new TournamentViewRow();
    view.id = '' + tournament._id;            
    view.status = tournament.status;
    view.name = tournament.name;
    view.currency = tournament.currency;
    view.startTime = tournament.startTime;
    view.playerCount = await dataRepository.getTournamentPlayerCount(view.id)
    let buyInTotal = await dataRepository.getTournamentBuyIns(view.id);
    let prizeTotal = getTotalPrize(tournament, buyInTotal)
    
    view.totalPrize = prizeTotal.toString();
    view.lateRegistrationMin = tournament.lateRegistrationMin;
    view.buyIn = tournament.buyIn;
    
    return view;
  }

  export function isWithinLateRegistration(tournament:Tournament) : boolean {
    return tournament.status==TournmanetStatus.Started 
    && isWithinPeriod(tournament.startTime, tournament.lateRegistrationMin);
    
  }

  export function isWithinPeriod(startTimeStr:string, intervalMin:number) : boolean {
    if (intervalMin){
        let startTime = new Date(startTimeStr);
        let cutOff = new Date(startTime.getTime() + intervalMin*60*1000);
        let beforeCutoff = cutOff.getTime() - new Date().getTime();
        if(beforeCutoff > 0){
          return true;
        }
    }
    return false;
  }

  export async function debitAccount(user:UserSmall, currency: string, buyIn: string, dataRepository:IDataRepository, comment:string, tournamentPaymentMeta:TournamentPaymentMeta) : Promise<string> {
    let { guid } = user;
    let account = await dataRepository.getUserAccount(guid, currency)

    let currencyUnit = CurrencyUnit.getCurrencyUnit(currency);
    let requiredAmount = new Decimal(buyIn).mul(currencyUnit);
    if (!account) {
        return `Account does not exist for currency ${currency}`;
    } else if (new Decimal(account.balance).lessThan(requiredAmount)) {

        return `Insufficient balance: Required amount ${requiredAmount.dividedBy(currencyUnit)} however account balance is ${account.balance / currencyUnit}`;
    }

    let updateResult: any = await dataRepository.updateUserAccount(guid, currency, -requiredAmount.toNumber(), account.updateIndex)
    if (updateResult.result.nModified !== 1) {
        throw new Error(`debitAccount: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${guid} currency: ${currency} buyIn:${buyIn}`);
    }
    
    let payment = new Payment();
    payment.type = PaymentType.outgoing;
    payment.amount = requiredAmount.toString();
    payment.currency = currency;
    payment.guid = guid;
    payment.screenName = user.screenName;
    payment.timestamp = new Date();
    payment.status = PaymentStatus.complete;
    payment.comment = comment;
    if(tournamentPaymentMeta != null){
        payment.tournamentId = tournamentPaymentMeta.tournamentId;
        payment.tournamentName = tournamentPaymentMeta.tournamentName;
        payment.isTournamentRebuy = tournamentPaymentMeta.isTournamentRebuy;
        payment.tournamentPlacing = tournamentPaymentMeta.placing;
    }
    

    await dataRepository.savePayment(payment);
    return '';
}

