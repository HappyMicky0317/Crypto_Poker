import { LogoutResult, LoginResult } from './../../poker.ui/src/shared/login-request';
import { Decimal } from './../../poker.ui/src/shared/decimal';
import { Table } from "./table";
import { JoinTableRequest as InternalJoinTableRequest } from "./model/table/JoinTableRequest";
import { WebSocketHandle, IWebSocket } from "./model/WebSocketHandle";
import { IDataRepository } from "./services/documents/IDataRepository";
import { User } from "./model/User";
import { DataContainer, AccountFunded, AccountWithdrawlResult, ChatMessage, UserData, Account,
  CashOutRequestResult, TxFee, PokerError, GetAccountSettingsResult, SetAccountSettingsResult, GlobalChatResult,
  ChatMessageResult, GlobalUsers, UserStatus, LeaderboardResult, LeaderboardUser, TransferFundsResult, ExchangeRateResult, CashOutAccount, Version, DuplicateIpAddress  } from "../../poker.ui/src/shared/DataContainer";
import {ClientMessage, AccountWithdrawlRequest,SetAccountSettingsRequest,TransferFundsRequest, JoinTableRequest } from "../../poker.ui/src/shared/ClientMessage";
import { Currency,CurrencyUnit } from "../../poker.ui/src/shared/Currency";
import { PaymentType } from "../../poker.ui/src/shared/PaymentType";
import {TableBalance, UserTableAccount } from "./model/TableBalance";
import { Payment } from "./model/Payment";
import { IBroadcastService, IPokerTableProvider } from "./services/IBroadcastService";
import { ExchangeRate } from "../../poker.ui/src/shared/ExchangeRate";
import { Helpers, removeItem, toUserStatus, getUserData, setupTable, getIpAddress  } from "./helpers";
import { broadcast as broadcastFunc  } from "./protobuf-helpers";
var logger = require('log4js').getLogger();
var _ = require('lodash');
import to from '../../poker.ui/src/shared/CommonHelpers';
import { GlobalChatRequestHandler } from './handlers/GlobalChatRequestHandler';
import { LoginRequestHandler } from './handlers/LoginRequestHandler';
import { AbstractMessageHandler } from './handlers/AbstractMessageHandler';
import { RegisterRequestHandler } from './handlers/RegisterRequestHandler';
import * as  encryption from './framework/encryption';
import { SessionCookie } from './model/session-cookie';
var url = require('url');
import * as handlerUtils from './handlers/handler-utils';
import environment from './environment';
import protobufConfig from './../../poker.ui/src/shared/protobuf-config';
import { TournamentLogic } from './handlers/TournamentLogic';
import { TableConfig } from './model/TableConfig';
import { GetDepositAddressRequest } from './admin/model/outgoing/GetDepositAddressRequest';
import { AdminSecureSocketService } from './admin/AdminSecureSocketService';
import { PaymentStatus } from '../../poker.ui/src/shared/PaymentStatus';
import { TableProcessor, TableProcessorMessage, TableMessage } from './admin/processor/table-processor/TableProcessor';
import { TimerProvider } from './model/table/TimerProvider';
import { PlayerTableHandle } from './model/table/PlayerTableHandle';
import { version } from 'punycode';
import { IpLookupResult, IpLookup } from './ip-lookup';

export class PokerProcessor implements IBroadcastService,IPokerTableProvider {
  handlers: MessageHandlerDict = { };
  public tournamentLogic:TournamentLogic
  public connectionToPaymentServer:AdminSecureSocketService;
  ipLookup:IpLookup = new IpLookup();
  blockedCountries:string[] = [];
  
  constructor(public dataRepository: IDataRepository) {
        this.dataRepository = dataRepository;
  }

  addHandler<T>(handler:AbstractMessageHandler<T>){
    this.handlers[handler.typeName] = handler;
  }



    
  async init(): Promise<void> {
    this.blockedCountries = (await this.dataRepository.getBlockedCountries()).map(x=>x.countryCode);
    await this.loadTables();

    for(let key in this.handlers)
      await this.handlers[key].init();
  }
  async loadTables() : Promise<void> {
      this.tables = [];
      let tableConfig: TableConfig[] = await this.dataRepository.getTablesConfig();  
      await this.setupTables(tableConfig);
    }

    async setupTables(tableConfig: TableConfig[]) : Promise<void> {
      for (let config of tableConfig) {
        await this.setupNewTable(config);
      }
    }    
    
    async setupNewTable(config:TableConfig) : Promise<void> {      
      let table = await setupTable(config, this.dataRepository, new TableProcessor(this.dataRepository, null), (p:TableProcessor) => new TimerProvider(p));
      this.addTable(table);
    }

    private tables: Table[] = [];
    clients: WebSocketHandle[] = [];    

    getTables(): Table[] {
        return this.tables;
    }

    async updateTable(config:TableConfig){
      let table = this.tables.find(t=>t.tableConfig._id.toString() == config._id.toString());
      if(table){
          Object.assign(table.tableConfig, config);
      }else{
        await this.setupNewTable(config);        
      }
    }

    removeTable(id:string){
      let table = this.tables.find(t=>t.tableConfig._id.toString() == id)
      if(table)
        removeItem(this.tables, table);
    }

    removeTables(options: { tournamentId: string; }): void { 
      for(let i=this.tables.length-1;i>=0;i--){
        if(this.tables[i].tournamentId==options.tournamentId){
          removeItem(this.tables, this.tables[i]);          
        }
      }      
    }

    addTable(table: Table) {
      table.broadcastService = this;
      this.tables.push(table);
      this.tables.sort((t1: Table, t2: Table) => { return t1.tableConfig.orderIndex - t2.tableConfig.orderIndex });
    }
    async verifyClient(info:any, done:any) : Promise<void> {
      let query = url.parse(info.req.url, true).query;
      
      let sessionCookie:SessionCookie;   
      if(query.sid){
        try {
          sessionCookie = <SessionCookie>JSON.parse(encryption.decrypt(query.sid));
        } catch (error) {
          logger.info(`decrypt sid failed: ${error}`);
        }        
      }
      let user:User;
      let guid:string;
      if(sessionCookie){        
        user = await this.dataRepository.getUser(sessionCookie.guid);
        if(user && !user.disabled){
          guid = sessionCookie.guid;
        }else{
          user = null;          
        }
          
      }
      info.req.customData = { user:user, sid: query.sid, guid:guid, version:query.version };
      done(true);
    }
    
    async connection(ws: IWebSocket, request: IHttpIncomingRequest) : Promise<WebSocketHandle>  {            
      let customData = (<any>request).customData;
      let user = customData.user;
      
      let guidCookie = this.getCookie(request.headers, "guid");      

      let data = new DataContainer();
      let wsHandle = new WebSocketHandle(ws);
      wsHandle.onerror = () => { this.handleClose(wsHandle); };
      wsHandle.ipAddress = getIpAddress(ws, request);
      
      if(user!=null){
        wsHandle.setUser(user);
        data.loginResult = new LoginResult();
        data.loginResult.success = true;
        data.loginResult.sid = customData.sid;        
        wsHandle.authenticated = true;
      }
      if(!wsHandle.user){
        if (guidCookie) {
          let user: User = await this.dataRepository.getUser(guidCookie);
          if(!user){
            user = new User();
            user.guid = guidCookie;
            user.setScreenName();
          }
          wsHandle.setUser(user);
  
        } else {
          logger.info('no cookie sent?');
        }
      }
      


      ws.on('message', (message: any) => {
        
        try {
          
          if(message.buffer && message.buffer.constructor.name==='ArrayBuffer'){            
            let clientMessage = protobufConfig.deserialize(message, 'ClientMessage');            
            //console.log(`received ${message.byteLength} bytes`, clientMessage);            
            this.logAndEnqueue(wsHandle, clientMessage);
          }else{
            logger.info(`message is not an ArrayBuffer:`, message);
          }
        } catch (e) {
          logger.warn('invalid message: ' + e, message);
        }
        

      });

      ws.on('close', () => {          
        this.handleClose(wsHandle)
      }); 
      ws.on('error', (e) => {          
        logger.info(`ws.on error: ${wsHandle.user.screenName} ${e}`);
        this.handleClose(wsHandle)
      });
      
      if(wsHandle.user) {
        let userData = await getUserData(wsHandle.user, this.dataRepository);
        data.user = userData;
        data.version = new Version(environment.version, process.env.POKER_SITE_NAME, process.env.POKER_FROM_EMAIL, process.env.POKER_CDN);
        
        let ipLookupResult:IpLookupResult = this.ipLookup.lookup(wsHandle.ipAddress);
        let country = '';
        if(ipLookupResult){
          country = ipLookupResult.countryName;
          if(this.isAllowedCountry(ipLookupResult.countryCode)){
            wsHandle.countryCode = ipLookupResult.countryCode;          
            wsHandle.country = country;
          }          
        }
        
        let sameIpAddressClient = this.clients.find(c=>c.ipAddress==wsHandle.ipAddress);
        this.clients.push(wsHandle);        
        data.globalUsers = this.getGlobalUsers();                
        wsHandle.send(data);
        this.broadcastUserStatus(wsHandle, true);
        if(!environment.debug && sameIpAddressClient != null){
          let data = new DataContainer();
          data.duplicateIpAddress = new DuplicateIpAddress();
          sameIpAddressClient.send(data);
          setTimeout(()=>{
            this.handleClose(sameIpAddressClient);
          }, 5000)
        }
     }

      return wsHandle.user ? wsHandle : null;
    
    }

    
    isAllowedCountry(countryCode:string) :boolean  {      
      return this.blockedCountries.find(c=>c==countryCode) == null;
    }

    handleClose(wsHandle:WebSocketHandle){
      wsHandle.socket.terminate();      
      let wasRemoved = removeItem(this.clients, wsHandle);
      let online = this.clients.find(c=>c.user.screenName == wsHandle.user.screenName) != null;
      logger.info(`${wsHandle.user.screenName} online: ${online}`);
      this.broadcastUserStatus(wsHandle, online);
      
      for (let table of this.tables){
        table.onClientDisconnected(wsHandle);
      }
      this.tournamentLogic.removeSubscriber(wsHandle);
      logger.info(`${wsHandle.user.screenName}:${wsHandle.id} disconnected. wasRemoved:${wasRemoved} clients.length: ${this.clients.length}`);
    }

 



    logAndEnqueue(wsHandle: WebSocketHandle, message: ClientMessage) : Promise<void> {
      this.saveClientMessage(wsHandle, message);//intentionally not awaiting
      return this.onSocketMessage(wsHandle, message)
    }

    saveClientMessage(wsHandle: WebSocketHandle, message: ClientMessage): Promise<any> {
      
      /*(message.listTablesRequest == null 
        && message.subscribeToTableRequest == null 
        && message.chatRequest == null 
        && message.globalChatRequest == null 
        && message.exchangeRatesRequest == null 
        && message.tournamentSubscriptionRequest == null
      */
      if(message.ping == null) {

        let tableId = this.getTableId(message);                
        return this.dataRepository.saveClientMessage(message, tableId, wsHandle.user.guid);
      }
      return Promise.resolve();
    }

  async onSocketMessage(wsHandle: WebSocketHandle, data: ClientMessage): Promise<void> {
    
    for (let key in data) {      
      let handler = this.handlers[key];
      if (handler != null) {
        await handler.run(wsHandle, data);
      } else {
        await this.handleMessageWithNoHandler(wsHandle, data);
      }
    }
  }

    async handleMessageWithNoHandler(wsHandle: WebSocketHandle, data: ClientMessage) :Promise<void>{
      if (data.logoutRequest != null) {      
        if(wsHandle.authenticated){
          wsHandle.authenticated = false;
          this.broadcastUserStatus(wsHandle, false);
          let dc = new DataContainer();
          dc.logoutResult = new LogoutResult();
          wsHandle.send(dc);
        }
      }
      else if (data.ping != null) {      
        let data = new DataContainer();
        wsHandle.lastPing = new Date();
        data.pong = {};
        wsHandle.send(data);
      }
      else if (data.fold != null) {
        let table = this.findTable(data.fold.tableId);
        if(table!=null){
          table.sendFold(wsHandle.user.toSmall());
        }        
      }
      else if (data.bet != null) {
        let table = this.findTable(data.bet.tableId);
        if(table!=null){
          table.sendBet(data.bet.amount, wsHandle.user.toSmall());
        }
          
      }
      else if (data.setTableOptionRequest != null) {
        let table = this.findTable(data.setTableOptionRequest.tableId);
        if(table){
          let tMessage = new TableProcessorMessage(table);
          tMessage.setTableOptionRequest = { user: wsHandle.user.toSmall(), request: data.setTableOptionRequest};
          table.sendTableProcessorMessage(tMessage)
        }
      }
      
      else if (data.leaveTableRequest != null) {
  
        let table = this.findTable(data.leaveTableRequest.tableId);
        if (table) {
          let player = table.findPlayer(wsHandle.user.guid);
          if (player) {
            if (table.currentPlayers && table.currentPlayers.indexOf(player) > -1) {
              let errorMessage = `You are still playing at table '${table.tableConfig.name}'!`;
              wsHandle.sendError(errorMessage);
            } else {
              await table.sendLeaveTable(wsHandle.user.toSmall());
            }
          }
        }        
      }
  
      else if (data.chatRequest != null) {
  
        let table = this.findTable(data.chatRequest.tableId);
        if (table != null) {
  
          table.handleChat(wsHandle.user.screenName, data.chatRequest.message, true);
        }
      }
      else  if (data.cashOutRequest != null) {
        this.handleCashOutRequest(wsHandle);
      }
      else if (data.getAccountSettingsRequest != null) {
  
        let data = new DataContainer();
        data.accountSettings = handlerUtils.getAccountSettingsResult(wsHandle);      
        wsHandle.send(data);
      }    
      else if (data.exchangeRatesRequest != null) {
        let dc = new DataContainer();
        //dc.leaderboardResult = new LeaderboardResult();
        //dc.leaderboardResult.users = _.take(this.userReconcilliation.getCached(), 15);
        dc.exchangeRates = new ExchangeRateResult();  
        dc.exchangeRates.rates = await this.dataRepository.getExchangeRates();   
        wsHandle.send(dc);
      }
      else {
        logger.warn('no handler for message: ', JSON.stringify(data));
      }
    }

    async handleCashOutRequest(wsHandle:WebSocketHandle) : Promise<any> {

      let guid = wsHandle.user.guid;

    let data = new DataContainer();
    data.cashOutRequestResult = new CashOutRequestResult();
    let accounts =  await this.dataRepository.getUserAccounts(guid)
    for(let account of accounts.filter(acc=>acc.currency !== Currency.free)) {
      let cashOutAccount :CashOutAccount = new CashOutAccount();
      cashOutAccount.balance = account.balance;
      cashOutAccount.currency = account.currency;
      let payments = (await this.dataRepository.getPayments({guid: guid, currency: account.currency})).filter(p=>p.type==PaymentType.outgoing && !Helpers.isNullOrWhitespace(p.address)); 
      if(payments.length){
        let groups = _.groupBy(payments , (r: Payment) => r.address);                
        let f1 = Object.keys(groups).map((key:any) => groups[key]);
        let ordered = _.orderBy(f1, ['length', (arr:Payment[])=>_.first(arr).timestamp], ['desc','desc']);        
        cashOutAccount.refundAddress = _.first(ordered)[0].address;
        cashOutAccount.refundAddressCount = _.first(ordered).length;
      }
      
      data.cashOutRequestResult.accounts.push(cashOutAccount)
    }
     
    for (let table of this.tables) {
      let player = table.findPlayer(guid);
      if (player) {
        let account = data.cashOutRequestResult.accounts.find(acc => acc.currency === table.tableConfig.currency);
        if(account)
          account.balance += player.stack;              
      }
    }

    for(let cashOutAccount of data.cashOutRequestResult.accounts) {
      let config = await this.dataRepository.getCurrencyConfig(cashOutAccount.currency);    
      let balance = new Decimal(cashOutAccount.balance).dividedBy(CurrencyUnit.getCurrencyUnit(cashOutAccount.currency));
      cashOutAccount.insufficientBalance = balance.lessThan(new Decimal(config.minimumWithdrawl));
    }
    
    
    wsHandle.send(data);
     
  
    }


  async checkIdlePlayers(): Promise<void> {

    let arr: { tournamentId: string, handles: PlayerTableHandle[] }[] = [];    
    for (let table of this.tables.filter(t => t.getPlayerCount())) {
      let playerHandles: PlayerTableHandle[] = table.getPlayersToEvict();
      if (playerHandles.length) {
        let tMessage = new TableProcessorMessage(table);
        tMessage.checkIdlePlayers = playerHandles.map( h=> { return { guid: h.guid, screenName: h.screenName} });
        let result = await table.sendTableProcessorMessage(tMessage);
        if (table.tournamentId && result.evictedPlayers.length) {
          let tournament = arr.find(a => a.tournamentId == table.tournamentId);
          if (!tournament) {
            tournament = { tournamentId: table.tournamentId, handles: [] };
            arr.push(tournament);
          }
          tournament.handles.push(...result.evictedPlayers);
        }
      }
    }

    if(arr.length){
      for (let tournament of arr) {
        let processor = this.tournamentLogic.getTableProcessor(tournament.tournamentId);
        let tMessage = new TableProcessorMessage(null);
        tMessage.evictingIdleTournamentPlayers = { tournamentId:tournament.tournamentId, playerHandles:tournament.handles  }                
        processor.sendMessage(tMessage);
      }
    }
  }




  onScreenNameChanged(wsHandle: WebSocketHandle, oldName:string, newName:string) {
    for (let table of this.tables)
      table.updateScreenName(wsHandle.user.guid, newName, wsHandle.user.gravatar);
    this.broadcastUserStatusNameChanged(oldName, newName);
  }
    

  broadcastUserStatusNameChanged(oldName:string, newName:string): void {
    let users: UserStatus[] = [
      new UserStatus(oldName, false),
      new UserStatus(newName, true)
    ];
    let data = new DataContainer();
    data.globalUsers = new GlobalUsers();
    data.globalUsers.users = users;
    this.broadcast(data);
  }

  broadcast(data:DataContainer, excludeGuid?:string):void {
    broadcastFunc(this.clients, data, excludeGuid);
  }



  


    getTableId(data: ClientMessage) :string {
      if (data.bet != null)
        return data.bet.tableId;
      if (data.joinTableRequest != null)
        return data.joinTableRequest.tableId;
      if (data.subscribeToTableRequest != null)
        return data.subscribeToTableRequest.tableId;
      if (data.fold != null)
        return data.fold.tableId;
      if (data.setTableOptionRequest != null)
        return data.setTableOptionRequest.tableId;      
      if (data.leaveTableRequest != null)
        return data.leaveTableRequest.tableId;
      return null;
    }

  isInt(value:any) {
    var x:any;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
  }
    


  broadcastUserStatus(wsHandle: WebSocketHandle, online: boolean): void {

    let data = new DataContainer();
    data.globalUsers = new GlobalUsers();
    data.globalUsers.users = [toUserStatus(wsHandle, online)];
    this.broadcast(data, wsHandle.user.guid);
  }

  getGlobalUsers() : GlobalUsers{
    let globalUsers = new GlobalUsers();
    globalUsers.initialData = true;
    globalUsers.users = this.clients.map(client => toUserStatus(client, true));
    return globalUsers;
  }

  




    
    findTable(id: string): Table {
        let table =  this.tables.find(t => t.tableConfig._id.toString() === id);
        if(table == null){
          logger.info(`unknown table ${id} ${new Error().stack}`);
        }
        return table;
    }

    pingClients() {
      for(let client of this.clients)  {
        let pingTime = new Date().getTime() - client.lastPing.getTime();          
        if (pingTime > 40000){
          if(client.user)  {
            logger.info(`disconnecting ${client.user.screenName} due to ping ${pingTime}`);
          }            
          client.terminate();
        }
      }     
    }

    getCookie(headers:any, cookieName:string):string {
        var list: any = {},
            rc = headers.cookie;

        rc && rc.split(';').forEach((cookie: string) => {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        return list[cookieName];
    }

   

  async relayUserData(guids: string[]) {
    for (let guid of guids) {
      let client = this.findClient(guid);
      if (client) {
        let user = await this.dataRepository.getUser(guid)
        let data = new DataContainer();
        data.user = await getUserData(user, this.dataRepository, false);
        client.send(data);
      }
    }
  }

  findClient(guid:string):WebSocketHandle|null{
    return this.clients.find(c => c.user.guid == guid);
  }
  async send(guid:string, dataFunc:()=>Promise<DataContainer>) : Promise<void> {
    let client = this.findClient(guid);
    if(client){
      let data = await dataFunc();
      client.send(data);
    }
  }

}

interface MessageHandlerDict {
  [key: string]: IMessageHandler;
}
export interface IMessageHandler {
  run(wsHandle:WebSocketHandle, data: ClientMessage) : Promise<any>;
  init() : Promise<void>;
}

export interface IHttpIncomingRequest {
    headers: any;
    url: string;
}

