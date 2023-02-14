import { TournmanetView } from './../../../poker.admin.ui.angular/src/app/shared/tournament-view';
import { UserDetailView, AccountView } from './../../../poker.admin.ui.angular/src/app/shared/user-detail-view';
import { IpLookupResult } from './../ip-lookup';
import express = require('express');
var bodyParser = require('body-parser');
import http = require('http');
import { IDataRepository } from "../services/documents/IDataRepository";
import {PokerProcessor, IHttpIncomingRequest} from "../poker-processor";
import {User} from "../model/User";
import {MergeUser, MergeUserResult} from "./MergeUser";
import { IpLookup } from '../ip-lookup';
import { hashPassword, getTournamentViewRow, getAdminTournamentResultsView } from '../helpers';
import { Tournament } from '../model/tournament';
import { Logger, getLogger } from "log4js";
var logger:Logger = getLogger();
import * as _ from "lodash";
import { TournmanetStatus } from '../../../poker.ui/src/shared/TournmanetStatus';
import { TournamentResult } from '../model/TournamentResult';
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import WebSocket = require('ws');
import { IWebSocket } from '../model/WebSocketHandle';
import { AdminSecureSocketService, IConnectionToPaymentServer } from './AdminSecureSocketService';
import { GameServerProcessorMessage } from './processor/GameServerProcessorMessage';
import { AwardPrizesRequest } from './processor/model/AwardPrizesRequest';
import { GameServerProcessor } from './processor/GameServerProcessor';
import { DataContainer, TournamentSubscriptionResult } from '../../../poker.ui/src/shared/DataContainer';
import { TableConfig } from '../model/TableConfig';
import { inspect } from 'util';
import { ManualFundAccountRequest } from './processor/model/ManualFundAccountRequest';
import { CurrencyUnit } from '../../../poker.ui/src/shared/Currency';
var cors = require('cors');

export class AdminServer {
  constructor(private dataRepository: IDataRepository, private pokerProcessor: PokerProcessor,
    private connectionToPaymentServer:IConnectionToPaymentServer, private processor:GameServerProcessor)   {

      }
  app:any;
  wss:any;
  init(){
    this.app = express();
    this.app.use(cors({origin: '*'}));
    this.app.use(bodyParser.json());
    const server:any = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server });

    this.setupEndpoints()
    
    server.listen(8112, function listening() { logger.info('Listening on %d', server.address().port); });
  }

  
  setupEndpoints() {
    
    let app = this.app;

    this.wss.on('connection', (socket:IWebSocket, httpReq:IHttpIncomingRequest) => {
      this.connectionToPaymentServer.onConnection(socket, httpReq)
    })
    
    app.get('/api/admin', async (req:any, res:any) => {
      let configs = await this.dataRepository.getAdmins();
      res.send(configs);
    });

    app.post('/api/admin',async (req:any, res:any) => {
      await this.dataRepository.saveAdmin(req.body);
      res.send({sucess : true});
    })

    app.get('/api/currencies', async (req:any, res:any) => {
      let configs = await this.dataRepository.getCurrencyConfigs();
      let currencies = configs.map(x=>x.name);
      res.send(currencies);
    });   

    app.get('/api/tables', async (req:any, res:any) => {
      let arr:TableConfig[] = [];
      if(req.query.tournamentId){
        let states = await this.dataRepository.getTableStates({ tournamentId:req.query.tournamentId });
        let count = 0;
        for(let state of states){
          count++;
          let config = new TableConfig();
          config._id = state._id+'';
          config.name = `Table ${count}`;
          arr.push(config)
        }
      }else{
        arr = await this.dataRepository.getTablesConfig();
      }
      res.send(arr);
    });    
    
    app.post('/api/tables', async (req:any, res:any) => {
      var table = req.body;
      table.smallBlindUsd = parseFloat(table.smallBlindUsd);
      table.bigBlindUsd = parseFloat(table.bigBlindUsd);
      table.timeToActSec = parseFloat(table.timeToActSec);
      table.maxPlayers = parseFloat(table.maxPlayers);
      table.orderIndex = parseFloat(table.orderIndex);
      table.maxBuyIn = parseInt(table.maxBuyIn);
      table.rake = parseFloat(table.rake);
      table.currency = table.currency.toLowerCase();
      await this.dataRepository.saveTableConfig(table);
      this.pokerProcessor.updateTable(table);
      res.send(table);
      
    });
    app.delete('/api/tables', async (req:any, res:any) => {
      await this.dataRepository.deleteTableConfig(req.query.id)
      this.pokerProcessor.removeTable(req.query.id);
      res.send('');
    });
    app.get('/api/games', async (req:any, res:any) => {      
      let arr = await this.dataRepository.getGames(req.query.tableId, req.query.userGuid, req.query.tournamentId, 0, 200)
      res.send(arr);
    });
    app.post('/shutdown', (req:any, res:any) => {
      logger.info('received shutdown');
      let promises: Promise<void>[] = [];
      for (let table of this.pokerProcessor.getTables()) {
        promises.push(table.shutdown());
      }
      Promise.all(promises)
        .then(() => {
          res.send({ message: 'table shutdown complete.' });
        });
    });
    app.get('/api/payments-since', async (req:any, res:any) => {
      let arr: any = await this.dataRepository.getPaymentsSince(req.query.id)
      res.send(arr);
    });
    app.get('/api/payments', async (req:any, res:any) => {
      
      let payments = await this.dataRepository.getPayments(req.query);      
      res.send(payments);
    });
    app.get('/api/users', async (req:any, res:any) => {
      let arr = await this.dataRepository.getUsers(req.query.searchTerm, parseInt(req.query.count), !!req.query.includeAnon)
      res.send(arr);
    });
    app.delete('/api/user', async (req:any, res:any) => {
      await this.dataRepository.deleteUser(req.query.guid);
      res.send({ success: true });
    });
    app.get('/api/user', async (req:any, res:any) => {
      let view = await this.getUserDetailView(req.query.guid);
      res.send(view);
    });
    app.post('/api/user', async (req:any, res:any) => {
      let view = <UserDetailView>req.body;
      let dbUser = await this.dataRepository.getUser(view.guid);
      let password = dbUser.password;
      delete view.accounts;
      _.assign(dbUser, _.pick(view, _.keys(view)));
      
      if(view.password){
        dbUser.password = await hashPassword(view.password);
      }else{
        dbUser.password = password;
      }
      await this.dataRepository.saveUser(dbUser);
      res.send({ success: true, user: await this.getUserDetailView(view.guid) });
    });

    app.get('/api/addressInfo', async (req:any, res:any) => {
      let arr: any = await this.dataRepository.getAddressInfoSince(req.query.id)
      res.send(arr);
    });
    
    app.get('/api/user-reconcilliation', async (req:any, res:any) => {
      // let reconcilliations: UserReconcilliationResult[] = await this.dataRepository.getUserReconcilliationResult()
      // let view = await this.userReconcilliation.getView(reconcilliations, this.dataRepository);      
      let view = await this.dataRepository.getReconcilliationView();      
      res.send(view);      
    });
    
    app.post('/api/user-reconcilliation', async (req:any, res:any) => {
      // let reconcilliations:UserReconcilliationResult[] = await this.userReconcilliation.reconcileAll(this.dataRepository)
      // let view = await this.userReconcilliation.getView(reconcilliations, this.dataRepository);   
      // await this.dataRepository.saveReconcilliationView(view);   
      // res.send(view);
    });

    app.post('/api/merge-user', async (req:any, res:any) => {
      
      // let mergeResult:MergeUserResult = await new MergeUser().run(req.query.mergeFromGuid, req.query.mergeToGuid, this.dataRepository);
      // let erc20Tokens = await this.dataRepository.getErc20Tokens();
      // if(mergeResult.success){
      //   await this.dataRepository.deleteUserReconcilliation(req.query.mergeFromGuid);
      //   let results: UserReconcilliationResult[] = await this.userReconcilliation.run(req.query.mergeToGuid, this.dataRepository, erc20Tokens);
      //   await Promise.all(results.map(r => { this.dataRepository.saveUserReconcilliationResult(r) }));
      //   await this.dataRepository.updatePlayerScreenName(req.query.mergeFromGuid, "anon" + req.query.mergeFromGuid.substr(0, 4));
      // }
      
      // res.send(mergeResult)
    });
    
    // app.get('/api/admin-transaction-log', async (req:any, res:any) => {
    //   let txLogOptions: any = {};
    //   let sweepOptions: any = { };
    //   if (req.query.status)
    //     txLogOptions.status = req.query.status;
    //   if (req.query.checkSweep)
    //     sweepOptions.checkSweep = req.query.checkSweep=='true';
    //   let view: any = {
    //     txlogs: await this.dataRepository.getTxLogs(txLogOptions),
    //     sweepEvents: await this.dataRepository.getSweepEvents(sweepOptions, 50)
    //   }

    //   res.send(view);
    // });

    // app.post('/api/saveTxlog', async (req:any, res:any) => {
      
    //   let dbTxLog = await this.dataRepository.getTxLog(req.body.hash );
    //   dbTxLog.status = req.body.status;      
    //   await this.dataRepository.addTxLog(dbTxLog);
    //   res.send(dbTxLog);
      
    // });

    // app.post('/api/saveSweepEvent', async (req:any, res:any) => {
      
    //   let dbSweepEvent = await this.dataRepository.getSweepEventById(req.body._id );
    //   dbSweepEvent.checkSweep = req.body.checkSweep;
    //   dbSweepEvent.pendingIncomingSweepTx = req.body.pendingIncomingSweepTx;
    //   dbSweepEvent.pendingOutgoingSweepTx = req.body.pendingOutgoingSweepTx;
    //   await this.dataRepository.saveSweepEvent(dbSweepEvent);
    //   res.send(dbSweepEvent);
      
    // });

    app.get('/api/tournaments', async (req: any, res: any) => {
      let tournmanets: Tournament[];
      if (req.query.id) {
        let tournmanet = await this.dataRepository.getTournmanetById(req.query.id);        
        tournmanets = [tournmanet]
      }
      else {
        tournmanets = <Tournament[]>await this.dataRepository.getTournaments({}, 5);        
      }
      let arr: TournmanetView[] = [];
      for (let tournmanet of tournmanets) {
        let view = this.getTournmanetView(tournmanet);
        if(tournmanets.length == 1){
          view.registrations = await this.getTournamentRegistrations(tournmanet._id.toString());
        }
        arr.push(view);        
      }
      res.send(arr);
    });

    

    app.post('/api/tournaments', async (req:any, res:any) => {
      let view = <TournmanetView>req.body;
      let tournament:Tournament = await this.dataRepository.getTournmanetById(view._id);
      
      if(!tournament){
        tournament = new Tournament();        
      }
      
      _.assign(tournament, _.pick(view, _.keys(new TournmanetView())));
      tournament.currency = tournament.currency.toLowerCase();
      tournament.startingChips = parseInt(<any>tournament.startingChips);
      tournament.playersPerTable = parseInt(<any>tournament.playersPerTable);
      tournament.minPlayers = parseInt(<any>tournament.minPlayers);
      tournament.maxPlayers = parseInt(<any>tournament.maxPlayers);
      tournament.timeToActSec = parseInt(<any>tournament.timeToActSec);
      tournament.lateRegistrationMin = parseInt(<any>tournament.lateRegistrationMin);
      tournament.awardPrizesAfterMinutes = parseInt(<any>tournament.awardPrizesAfterMinutes);
      tournament.mailchimpSendTimeMin = parseInt(<any>tournament.mailchimpSendTimeMin) || null;
      tournament.telegramSendTimeMin = parseInt(<any>tournament.telegramSendTimeMin) || null;
      tournament.rebuyForMin = parseInt(<any>tournament.rebuyForMin) || null;
      for(let blindConfig of tournament.blindConfig){
        blindConfig.smallBlind = parseInt(<any>blindConfig.smallBlind);
        blindConfig.bigBlind = parseInt(<any>blindConfig.bigBlind);
        blindConfig.timeMin = parseInt(<any>blindConfig.timeMin);
      }
      tournament.prizes = tournament.prizes.filter(p=>p && !isNaN(parseFloat(p)));
      if(!isNaN(parseFloat(tournament.buyIn))){
        tournament.buyIn = tournament.buyIn+'';
      }else{
        tournament.buyIn = '';
      }
      if(!isNaN(parseFloat(tournament.housePrize))){
        tournament.housePrize = tournament.housePrize+'';
      }else{
        tournament.housePrize = '';
      }     

      if(!isNaN(parseFloat(tournament.rebuyAmount))){
        tournament.rebuyAmount = tournament.rebuyAmount+'';
      }else{
        tournament.rebuyAmount = '';
      }


      await this.dataRepository.saveTournmanet(tournament);
      tournament = await this.dataRepository.getTournmanetById(tournament._id.toString());
      let returnedView = this.getTournmanetView(tournament);
      returnedView.registrations = await this.getTournamentRegistrations(tournament._id.toString());
      res.send({ success: true, tournament: returnedView });
      let data = new DataContainer();
      data.tournamentSubscriptionResult = new TournamentSubscriptionResult();      
      data.tournamentSubscriptionResult.tournaments.push(await getTournamentViewRow(tournament, this.dataRepository));
      this.pokerProcessor.broadcast(data)
    });
    
    app.get('/api/tournamentResults', async (req:any, res:any) => {
      let tournament:Tournament = await this.dataRepository.getTournmanetById(req.query.tournamentId);
      let adminTournamentResultsView = await getAdminTournamentResultsView(tournament, this.dataRepository);
      res.send(adminTournamentResultsView.view);
    });

    app.post('/api/awardPrizes', async (req:any, res:any) => {
      
      let tournament:Tournament = await this.dataRepository.getTournmanetById(req.query.tournamentId);
      let adminTournamentResultsView = await getAdminTournamentResultsView(tournament, this.dataRepository);

      let pMessage = new GameServerProcessorMessage();
      pMessage.awardPrizesRequest = new AwardPrizesRequest(req.query.tournamentId, adminTournamentResultsView)
      let pResult = await this.processor.sendMessage(pMessage);
      res.send(pResult.awardPrizesResult);
      
    });

    app.delete('/api/tournaments', async (req:any, res:any) => {
      await this.dataRepository.deleteTournmanet(req.query.id)
      res.send({ success: true });
    });

    app.get('/api/dumpState', async (req:any, res:any) => {
      res.setHeader('Content-disposition', 'attachment; filename=' + 'state.json');
    res.setHeader('Content-type', 'text/plain');
    
    let state = this.getState();
    res.send(state);
    });

    app.post('/api/addFundsToAccount', async (req:any, res:any) => {
      let request = <ManualFundAccountRequest>req.body;
      let result:{success?:boolean, user?:any, message?:string } = {};

      if(!request.currency || !request.comment || !isNaN(parseFloat(req.amount))){
        result.message = 'Please fill out all fields';        
      }      
      else{
        let pMessage = new GameServerProcessorMessage();
        request.amount = new Decimal(request.amount).mul(CurrencyUnit.getCurrencyUnit(request.currency)).toString();
        request.comment = `Manual Payment: ${request.comment}`;
        pMessage.manualFundAccountRequest = request;
        let pResult = await this.processor.sendMessage(pMessage);
        result.success = pResult.manualFundAccountResult.success;
        result.message = pResult.manualFundAccountResult.message;
        result.user = await this.getUserDetailView(request.guid)
      }

      res.send(result);
      
    });

    app.get('/api/userBalances', async (req:any, res:any) => {
      let arr = await this.dataRepository.getUserBalances(req.query.currency);      
      res.send(arr);
    })
    
  }

  getState():any{
    
    let state:{clients:any[], tables:any[]} = { 
      clients: [],
      tables: []
    };
    let getSubscriber = (client:any)=>{
      return {
        user: client.user.toSmall(),
        id: client.id,
        ipAddress: client.ipAddress,
        isAlive: client.isAlive,
        lastPing: client.lastPing,
        authenticated: client.authenticated,
        countryCode: client.countryCode,
        country: client.country,
      }
    }
    for(let client of this.pokerProcessor.clients){
      state.clients.push(getSubscriber(client))
    }
    for(let t1 of this.pokerProcessor.getTables()){
      let table:any = {
        tableConfig: t1.tableConfig,
        players: t1.getPlayers(),
        currentPlayers: t1.currentPlayers,
        gameStarting: t1.gameStarting,
        dealerSeat: t1.dealerSeat,
        playerNextToActIndex: t1.playerNextToActIndex,
        toCall: t1.toCall,
        lastRaise: t1.lastRaise,
        lastToActIndex: t1.lastToActIndex,
        firstToActIndex: t1.firstToActIndex,
        street: t1.street,
        gameState: t1.gameState,
        pendingExchangeRate: t1.pendingExchangeRate,
        tournamentId: t1.tournamentId,
        blindConfig: t1.blindConfig,
        blindsStartTime: t1.blindsStartTime,
        subscribers: []
      }
      for(let subscriber of t1.subscribers){
        table.subscribers.push(getSubscriber(subscriber))
      }
      state.tables.push(table);
    }
    
    return state;
  }



  getTournmanetView(tournmanet:Tournament) : TournmanetView  {
    let view:TournmanetView = new TournmanetView();
    _.assign(view, _.pick(tournmanet, _.keys(view)));
    view._id = tournmanet._id.toString();
    view.statusText = TournmanetStatus[tournmanet.status]
    return view;
  }

  async getTournamentRegistrations(id:string) : Promise<{guid:string, screenName:string, email:string}[]>  {
    let dbRegistrations = await this.dataRepository.getTournamentRegistrations({ tournamentId:id });
    let arr:{guid:string, screenName:string, email:string}[] = [];
    for(let registration of dbRegistrations){
      let user = await this.dataRepository.getUser(registration.userGuid);
      if(user){
        arr.push({guid: registration.userGuid, screenName: user.screenName, email: user.email});
      }
    }
    return arr;
  }

  async getUserDetailView(guid: string): Promise<UserDetailView> {
    let dbUser = <User>await this.dataRepository.getUser(guid);
    let accounts = await this.dataRepository.getUserAccounts(guid);
    let view: UserDetailView = new UserDetailView();
    _.assign(view, _.pick(dbUser, _.keys(view)));
    for (let account of accounts) {
      account.balance = new Decimal(account.balance).dividedBy(CurrencyUnit.getCurrencyUnit(account.currency)).toNumber()
      view.accounts.push(new AccountView(account.currency, account.balance))
    }
    view.password = null;
    return view;
  }

  
}