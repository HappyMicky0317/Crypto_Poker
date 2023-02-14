import { SubscribeToTableRequest } from './shared/ClientMessage';
import { autoinject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { TableConfigUpdated, OpenTableAction, ConnectionClosedEvent, TournamentRegisterClickEvent } from "./messages";
import { Util } from "./lib/util";
import * as moment from 'moment';
import { TournamentViewRow } from "./shared/tournmanet-view-row";
import { ApiService } from "./lib/api-service";
import { TournamentSubscriptionResult, SubscribeTableResult } from './shared/DataContainer';
import { MessageWindow } from './message-window';
import { DialogService } from 'aurelia-dialog';
import { TournmanetStatus } from './shared/TournmanetStatus';
import { TableViewRow } from './shared/TableViewRow';
import { TournamentInfoPopup } from './tournament-info-poup';
import { LoginResult } from './shared/login-request';

@autoinject()
export class PokerRooms {
  tableConfigs: TableViewRow[] = [];
  tournaments: TournamentViewRow[] = [];
  receivedTournaments:boolean;
  hasSubscribed:boolean;
  subscriptions: { dispose: () => void }[] = [];
  cashGamesVisible:boolean;
  tournamentCount:number;
  constructor(private ea: EventAggregator, private util: Util, private apiService:ApiService,private dialogService: DialogService) {

    this.subscriptions.push(ea.subscribe(TableConfigUpdated, msg => { this.handleTableConfigUpdated(msg); }));
    this.subscriptions.push(ea.subscribe(TournamentSubscriptionResult, msg => { this.handleTournamentSubscriptionResult(msg); }));
    this.subscriptions.push(ea.subscribe(ConnectionClosedEvent, msg => { this.onConnectionClosed(); }));
    this.subscriptions.push(ea.subscribe(LoginResult, (r) => this.hasSubscribed=false));
    
    this.cashGamesVisible = true;
  }

  

  handleTournamentSubscriptionResult(result:TournamentSubscriptionResult){
    this.tournamentCount = result.tournamentCount;
    for(let row of result.tournaments){
      let existing = this.tournaments.find(t=>t.id==row.id);
      if(existing){
        Object.assign(existing, row);    
        if(row.joined)
          existing.registering = false;
      }else{
        this.tournaments.push(row);
        existing = row;
        this.setStatusText(row);
      }
      
      this.setStatusText(existing);
      
      let canRegisterResult = this.util.canRegister(existing);
      existing.canRegister = canRegisterResult.success;
      existing.isLate = canRegisterResult.isLate;

      if(this.hasSubscribed && existing.status==TournmanetStatus.Started && existing.joined && (!this.util.currentTableConfig || !this.util.currentTableConfig.tournamentId)){        
        let subscribeToTableRequest = new SubscribeToTableRequest();
        subscribeToTableRequest.tournamentId = row.id;
        this.apiService.send(subscribeToTableRequest);
      }
    }
    this.receivedTournaments = true;
    this.subscribeToTableOrTournament();
  }

  

  setStatusText(row:TournamentViewRow){
        
    if(!row.status){
      let momentDate = moment(row.startTime);
    let startTimeLocal = moment(row.startTime).format('D MMM YYYY h:mm A');
      row.statusText= `${startTimeLocal} (${momentDate.fromNow()})`
    }else{
      row.statusText =  TournmanetStatus[row.status];
    }
      
    
  }

  handleTableConfigUpdated(msg:TableConfigUpdated) {
    
    for (let config of msg.config) {
      
      let existingConfig = this.tableConfigs.find(t => t._id === config._id);
      if (existingConfig != null) {
        Object.assign(existingConfig, config);         
      }else{
        this.tableConfigs.push(config);
      }       
    }   
    
    this.subscribeToTableOrTournament();
  }

  onConnectionClosed() {    
    this.tableConfigs = [];
    this.tournaments = [];
    this.hasSubscribed = false;
    this.receivedTournaments = false;
  }

  
  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

  openTable(tableId: string) {
    this.ea.publish(new OpenTableAction(tableId));
  }

  registerForTournament(tournament:TournamentViewRow){
    this.ea.publish(new TournamentRegisterClickEvent(tournament));
  }

  subscribeToTableOrTournament() {
    if (this.hasSubscribed || !this.tableConfigs.length || !this.receivedTournaments)
      return;

    this.hasSubscribed = true;

    let request = this.getSubscribeRequest();
    if(request.tableId || request.tournamentId){
      this.apiService.send(request);
    }
  }


  getSubscribeRequest():SubscribeToTableRequest {
    
    let request = new SubscribeToTableRequest();    
    let lastSubscribeResult:SubscribeTableResult = JSON.parse(localStorage.getItem("subscribeTableResult"));
    
    
    
    let tournament = this.tournaments.find(t=>t.status == TournmanetStatus.Started && t.joined==true)
    if(tournament){
      request.tournamentId = tournament.id;
      if(lastSubscribeResult && lastSubscribeResult.tournamentId==tournament.id){
        request.tableId = lastSubscribeResult.tableId;
      }
      return request;
    }

    if(lastSubscribeResult){
      if(lastSubscribeResult.tournamentId){
        if(this.tournaments.find(t=>t.id==lastSubscribeResult.tournamentId && t.status == TournmanetStatus.Started)){
          console.log('rejoining tournament')
          request.tournamentId = lastSubscribeResult.tournamentId;
          request.tableId = lastSubscribeResult.tableId;
          return request;
        }
      }
      if(lastSubscribeResult.tableId && !tournament){
        if(this.tableConfigs.find(t=>t._id==lastSubscribeResult.tableId)){
          request.tableId = lastSubscribeResult.tableId;
          return request;
        }
      }       
    } 
    
    
    
    let maxPlayers: number = 0;
    let maxTournamentPlayers: number = 0;

    for (let tableConfig of this.tableConfigs) {
      if(tableConfig.tournamentId){
        if (tableConfig.numPlayers > maxTournamentPlayers) {
          maxTournamentPlayers = tableConfig.numPlayers;
          request.tableId = tableConfig._id;
        }
      }else{
        if (tableConfig.numPlayers > maxPlayers && maxTournamentPlayers < 1) {
          maxPlayers = tableConfig.numPlayers;
          request.tableId = tableConfig._id;
        }
      }
      
    }
    if(!request.tableId && this.tableConfigs.length){
      request.tableId = this.tableConfigs[0]._id;
    }

    return request;
  }

  openInfo(tournament:TournamentViewRow){
    this.dialogService.open({ viewModel: TournamentInfoPopup, model: { name: tournament.name, id: tournament.id }, lock: false });
  }

}
