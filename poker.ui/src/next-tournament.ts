import { autoinject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from "./lib/util";
import { ApiService } from "./lib/api-service";
import { TournamentSubscriptionResult } from "./shared/DataContainer";
import { TournmanetStatus } from "./shared/TournmanetStatus";
import * as moment from 'moment';
import { Moment } from "moment";
import { TournamentViewRow } from "./shared/tournmanet-view-row";
import { DialogService } from "aurelia-dialog";
import { MessageWindow } from "./message-window";
import { OpenLoginPopupEvent, ConnectionClosedEvent, TournamentRegisterClickEvent } from "./messages";
import { TournamentInfoPopup } from "./tournament-info-poup";

@autoinject()
export class NextTournament {
  subscriptions: { dispose: () => void }[] = [];  
  startingIn:string = '';
  startTime:Moment;
  timer:number;
  canRegister:boolean;
  tournament:TournamentViewRow;
  starting:boolean;
  started:boolean;
  tournaments:TournamentViewRow[] = [];

  constructor(private ea: EventAggregator, private util: Util, private apiService: ApiService,private dialogService: DialogService) {

    this.subscriptions.push(ea.subscribe(TournamentSubscriptionResult, msg => { this.handleTournamentSubscriptionResult(msg); }));
    this.subscriptions.push(ea.subscribe(ConnectionClosedEvent, msg => { this.handleConnectionClosedEvent(); }));
  }

  handleConnectionClosedEvent(){
    this.tournament =null; 
    this.clear();
  }
  clear(){
    this.started = false;
    this.starting = false;
    window.clearInterval(this.timer);
  }

  handleTournamentSubscriptionResult(result: TournamentSubscriptionResult) {
    window.clearInterval(this.timer);
    
    for(let tournament of result.tournaments){
      let existing = this.tournaments.find(t => t.id == tournament.id);
        if (existing) {
          Object.assign(existing, tournament);
        }else{
          this.tournaments.push(tournament);
        }
    }
    

    this.tournament = this.tournaments.find(t => !t.status);
    
    if(!this.tournament){
      //check any late reg tournaments
      for(let tournament of this.tournaments){
        let canRegisterResult = this.util.canRegister(tournament);
        if(canRegisterResult.success && canRegisterResult.isLate){
          this.tournament = tournament;
          break;
        }
      }
    }

    if (this.tournament) {      
      let canRegisterResult = this.util.canRegister(this.tournament);
      this.tournament.canRegister = canRegisterResult.success;
      this.tournament.isLate = canRegisterResult.isLate;
      this.startTime = moment(this.tournament.startTime);
      
      if(!this.tournament.isLate){
        this.updateStartingIn();      
        this.timer = window.setInterval(() => {
          this.updateStartingIn();
        }, 1000)
      }
      this.started = this.tournament.status == TournmanetStatus.Started;
      if(this.tournament.status == TournmanetStatus.Started && this.starting){
        this.starting = false;
      }
    }else{
      this.clear();
    }

    
  }

  updateStartingIn(){
    const now = moment(new Date());

    // get the difference between the moments
    const diff = this.startTime.diff(now);

    if(diff <= 0){
      window.clearInterval(this.timer);
      this.starting = true;
    }

    const diffDuration = moment.duration(diff);
    
    let startingIn = '';
    if(diffDuration.days()>0){
      startingIn = `${diffDuration.days()} day` + (diffDuration.days()>1?'s':'') + ", ";      
    }
    startingIn += `${diffDuration.hours().toString().padStart(2, '0')}:${diffDuration.minutes().toString().padStart(2, '0')}:${diffDuration.seconds().toString().padStart(2, '0')}`
    this.startingIn = startingIn;
  }

  registerForTournament(){        
    this.ea.publish(new TournamentRegisterClickEvent(this.tournament));
  }

  detached() {
    for (let sub of this.subscriptions){
      sub.dispose();
    }
      clearInterval(this.timer);
  }

  openInfo(){
    this.dialogService.open({ viewModel: TournamentInfoPopup, model: { name: this.tournament.name, id: this.tournament.id }, lock: false });
  }
  
  attached() {

  }

}

