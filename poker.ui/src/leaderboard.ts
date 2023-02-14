import { autoinject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from "./lib/util";
import {ApiService} from "./lib/api-service";
import {ClientMessage } from "./shared/ClientMessage";
import {LeaderboardResult, LeaderboardUser, ExchangeRateResult } from "./shared/DataContainer";
import * as $ from 'jquery';
import { numberWithCommas } from "./shared/CommonHelpers";

@autoinject()
export class Leaderboard {
  subscriptions: { dispose: () => void }[] = [];
  results: LeaderboardUser[] = [];
  rates: IExchangeRateView[] = [];
  constructor(private ea: EventAggregator, private util: Util, private apiService: ApiService) {

    this.subscriptions.push(ea.subscribe(LeaderboardResult, (msg: LeaderboardResult) => { this.handleLeaderboardResult(msg) }));
    this.subscriptions.push(ea.subscribe(ExchangeRateResult, (msg: ExchangeRateResult) => { this.handleExchangeRateResult(msg) }));
  }

  handleExchangeRateResult(data:ExchangeRateResult){
        

    for (let result of data.rates || []){
      
      let view:IExchangeRateView =  { 
        currency:result.base,         
        changed : false,       
        
      };
      if(result.price){
        let numDecimalPlaces = result.price >= 1 ? 2 : 3;                
        view.price = '$' + numberWithCommas(result.price.toFixed(numDecimalPlaces));
        view.percentChange = parseFloat((result.change / result.price*100).toFixed(2));
        view.volume = numberWithCommas(Math.round(result.volume));
      }
      
          
      let existingView = this.rates.find(r=>r.currency===view.currency);      
      if(existingView){
        existingView.percentChange = view.percentChange;
        existingView.price = view.price;        
        existingView.changed = true;
        
      }else{          
        this.rates.push(view);
      }
    }

    setTimeout(()=>{
      for(let u of this.rates)
        u.changed = false;
    },2000);
    
  }

  handleLeaderboardResult(data:LeaderboardResult){
    

    for (let result of data.users){
      let existingUser = this.results.find(r=>r.screenName===result.screenName && r.currency === result.currency);
      if(existingUser){
        (<any>existingUser).movement = result.profitLoss - existingUser.profitLoss;
        existingUser.profitLoss = result.profitLoss;
        existingUser.handsPlayed = result.handsPlayed;
        (<any>existingUser).changed = true;
        
      }else{        
        this.results.push(result);
      }
    }

    this.results.sort((p1: LeaderboardUser, p2: LeaderboardUser) => { return p2.profitLoss-p1.profitLoss });
    setTimeout(()=>{
      for(let u of this.results)
      (<any>u).changed = false;
    },2000);
  }
  
  attached() {            
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

}

interface IExchangeRateView {
currency:string;
volume?:string;
price?:string;
percentChange?:number;
changed:boolean;
}
