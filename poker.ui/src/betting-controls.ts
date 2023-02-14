import { autoinject } from 'aurelia-framework';
import {Seat} from "./seat";
import {Util} from "./lib/util";
import {ApiService} from "./lib/api-service";
import * as $ from 'jquery';
import 'bootstrap-slider';//see http://seiyria.com/bootstrap-slider/
import { EventAggregator } from 'aurelia-event-aggregator';
import { SetBettingControlsEvent } from './messages';
import { GameEvent } from './shared/DataContainer';
import { ClientMessage, FoldRequest, BetRequest } from './shared/ClientMessage';
import { Currency } from './shared/Currency';
import { isNumeric } from './shared/CommonHelpers';
import { DialogService } from 'aurelia-dialog';
import { MessageWindow } from './message-window';

@autoinject()
export class BettingControls {
  canCall: boolean;
  betButtonText: string;
  betButtonInfo: string;
  callButtonText: string;
  callButtonInfo: string;
  betAmount: number;
  betSlider: string;
  betInput: string;
  myturn:boolean;
  tocall: number;
  lastRaise: number;
  seat:Seat; number;

  sliderInput: HTMLInputElement;
  sliderStep: number;
  sliderMax: number;
  sliderMin: number;
  sliderValue: number;

  betShortcut1: string;
  betShortcut1Amt: number;
  betShortcut2: string;
  betShortcut2Amt: number;
  betShortcut3: string;
  betShortcut3Amt: number;
  betShortcut4: string = 'All in';
  betShortcut4Amt: number;

  callBtnDisabled:boolean;
  betBtnDisabled:boolean;
  foldBtnDisabled:boolean;

  subscriptions: { dispose: () => void }[] = [];

  constructor(private apiService: ApiService, private util: Util,private ea: EventAggregator, private dialogService: DialogService) { 
    this.subscriptions.push(ea.subscribe(SetBettingControlsEvent, (r) => this.setBettingControls(r.seat, r.game)));
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }
  
  setBettingControls(seat:Seat, game:GameEvent) {
    this.seat = seat;
    this.callBtnDisabled = false;
    this.betBtnDisabled = false;
    this.foldBtnDisabled = false;
    if (!seat || !seat.myturn) {
      this.canCall = false;
      this.myturn = false;
      return;
    }
    
    
    this.myturn = true;    
    this.tocall = game.tocall;
    this.lastRaise = game.lastRaise;
    this.setupBetSlider(seat, game);
    
    let tableConfig = this.util.currentTableConfig;
    if(!tableConfig)
      return;

    
    let canRaise = game.tocall <= seat.stack - Math.max(tableConfig.bigBlind, this.lastRaise);
    this.canCall = game.tocall == 0 || canRaise || game.tocall < seat.stack;
    //this.canCall = game.tocall == 0 || game.tocall <= seat.stack;
    this.callButtonText = game.tocall > 0 ? 'Call':'Check';
    this.callButtonInfo = game.tocall > 0 ? '(' + this.util.toDisplayAmount(game.tocall) + ')':'';
    if (!canRaise) {
              
      //this.betAmount = seat.bet + Math.min(seat.stack, Math.max(tableConfig.bigBlind, game.tocall));
      this.betAmount = seat.stack + seat.bet;
      this.betButtonText = 'All in';
      this.betButtonInfo = '(' + this.util.toDisplayAmount(seat.stack) + ')';
    } else {
      this.betButtonText = 'Raise To';

      if (seat.bet > 0) {
          
      } else {
        
        this.betButtonText = 'Bet';
        this.betButtonInfo = '';
      }      
    }

    
    this.setBetButtonRaiseInfo();
    this.betShortcut4Amt = seat.stack + seat.bet;
    
    if (tableConfig) {
      if (game.board && game.board.length) {
        let potAmount = game.pot[0];
        this.betShortcut1 = "1/2 Pot";
        if (tableConfig.currency === Currency.free)
          this.betShortcut1Amt = parseFloat((potAmount / 2).toFixed(2));
        else
          this.betShortcut1Amt = Math.round(potAmount / 2);

        this.betShortcut2 = "Pot";
        this.betShortcut2Amt = potAmount;
        this.betShortcut3 = "2x Pot";
        this.betShortcut3Amt = potAmount * 2;
      } else {

        this.betShortcut1 = "2x";
        this.betShortcut1Amt = tableConfig.bigBlind * 2;
        this.betShortcut2 = "3x";
        this.betShortcut2Amt = tableConfig.bigBlind * 3;
        this.betShortcut3 = "5x";
        this.betShortcut3Amt = tableConfig.bigBlind * 5;
      }
    }
    
  }

  
  handleBetShortcut(amount:string) {
    this.betAmount = parseFloat(amount);
    this.betInput = this.util.toDisplayAmount(this.betAmount);
    this.setBetButtonRaiseInfo();
    this.util.playSound(this.apiService.audioFiles.betShortcut);
  }
 
  
  betInputChanged() {
    this.betAmount = this.util.fromDisplayAmount(this.betInput);
    this.setBetButtonRaiseInfo();
    
  }

  setBetButtonRaiseInfo() {
    this.betButtonInfo = !isNaN(this.betAmount) ? this.util.toDisplayAmount(this.betAmount) : '';
  }


  setupBetSlider(seat: Seat, game: GameEvent) {
    
    var tableConfig = this.util.currentTableConfig;
    if (!tableConfig)
      return;

    
    this.sliderMax = seat.stack + seat.bet;
    let minRaise = game.tocall + seat.bet + Math.max(tableConfig.bigBlind, this.lastRaise);
    minRaise = Math.min(minRaise, this.sliderMax);
    this.sliderMin = minRaise;
    this.betAmount = minRaise;
    this.betSlider = minRaise + '';
    this.betInput = this.util.toDisplayAmount(this.betAmount);    
    this.sliderStep = 1;

    if ($.data(this.sliderInput, "slider"))
      $(this.sliderInput).slider('destroy');

    let options = {
      min: this.sliderMin,
      max: this.sliderMax,
      step: this.sliderStep,
      value: this.betAmount,
      scale: tableConfig.currency === Currency.free ? 'logarithmic' : 'linear'
    }
      $(this.sliderInput).slider(options).on('slide', () => {
      this.betSliderChanged();      
    });    
    
  }

    attached() {
    

   
  }


  betSliderChanged() {
    this.betAmount = parseFloat(this.sliderInput.value);
    this.betInput = this.util.toDisplayAmount(this.betAmount);
    this.setBetButtonRaiseInfo();    
  }



  fold() {    
    if(this.foldBtnDisabled){
      return;
    }
    this.foldBtnDisabled = true;
    this.myturn = false;    

    this.apiService.loadSounds();
    let message = new ClientMessage();
    message.fold = new FoldRequest();
    message.fold.tableId = this.util.currentTableId;
    this.apiService.sendMessage(message);
  }

  call() {    
    if(this.callBtnDisabled){
      return;
    }
    this.callBtnDisabled = true;
    this.myturn = false; 

    this.apiService.loadSounds();
    this.sendBet(this.tocall);    
  }

  sendBet(amount:number) {
    let message = new ClientMessage();
    message.bet = new BetRequest();
    message.bet.tableId = this.util.currentTableId;
    message.bet.amount = amount;
    this.apiService.sendMessage(message);
  }

  bet() {
    if(this.betBtnDisabled){
      return;
    }
     
    this.apiService.loadSounds();
    let thisBet:number;
    if (this.betButtonText.indexOf('All in') !== -1) {
      thisBet = this.betAmount;
    } else {

      thisBet = this.betAmount;
      if (!isNumeric(thisBet)) {
        this.showWarning('Not a valid Bet size');
        return;
      }
      
      if (this.betInput === this.util.toDisplayAmount(this.seat.stack)) {
        thisBet = this.seat.stack; //due to rounding issues
      } else {
        let raise = thisBet - this.seat.bet;
        if (raise > this.tocall && raise-this.tocall < this.util.currentTableConfig.bigBlind) {
          let betRaiseName = this.tocall == -0 ? `Bet of`:`Raise to`;
          this.showWarning(`${betRaiseName} ${thisBet} is invalid. The minimum ${betRaiseName} must be at least the big blind of ${this.util.currentTableConfig.bigBlind}`);
          return;
        }
      }
    }
    this.betBtnDisabled = true;
    this.myturn = false;   
    
    thisBet -= this.seat.bet;
    this.sendBet(thisBet);    
  }

  showWarning(message: string) {
    this.dialogService.open({ viewModel: MessageWindow, model: message, lock: false });
  }
}
