import { computedFrom } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from './lib/util';
import { SitDownAction } from "./messages";
import {Chip} from "./model/chip";
import {Constants} from "./lib/constants";
import * as $ from 'jquery';
import { ApiService } from './lib/api-service';
import { TableSeatEvent } from './shared/DataContainer';


export class Seat{
  width:number=106;
  height:number=81;
  
  
  avatar: string;
  seatIndex: number;
    name: string;
    bet: number;
    empty: boolean;
    canSit: boolean;
    stack: number;
    playing: boolean;
    myturn: boolean;
    chips: Chip[] = [];
    guid: string;
    playercards: string[];    
    hasFolded: boolean;
    hasRaised: boolean;
    hasCalled: boolean;
    isSittingOut: boolean;
    faceupCard1: string;
    faceupCard2: string;
    seatElem: HTMLDivElement;    
    timerElem: HTMLDivElement;    
    flashingTurnTimer: number;
    playerMyTurn:boolean;//used only on a timer to set css in view
    pLeft;
    pTop;
    facedownCard: string = 'Red_Back';
    timeToActSec:number;
    isHovering:boolean=false;
    loadSoundsHandler:()=> void;
  
    constructor(private ea: EventAggregator, private util: Util, private constants: Constants, seatIndex: number, private apiService: ApiService) {
      this.seatIndex = seatIndex;
      this.init();    
      this.loadSoundsHandler = ()=>{
        this.loadSounds();
      };  
    }

  init() {

    this.name = '';
    this.bet = 0;
    this.empty = true;
    this.canSit = false;
    this.stack = 0;
    this.playing = false;
    this.myturn = false;
    this.chips = [];
    this.guid = '';
    this.playercards = null;
    this.hasFolded = false;
    this.hasRaised = false;
    this.hasCalled = false;
    this.isSittingOut = false;
    this.faceupCard1 = null;
    this.faceupCard2 = null;
    this.playerMyTurn = false;//used only on a timer to set css in view   
    this.stopMyTurnAnimations();
    this.avatar = null;
  }

   

    @computedFrom('hasFolded', 'hasRaised', 'hasCalled', 'isSittingOut', 'playing', 'bet')
    get action(): string {
      var text = '';
      if (this.isSittingOut) {
        text = 'Sitting Out';
      }
      else if (this.hasFolded) {
        text = 'Fold';
      } else if (this.stack === 0 && this.playing)
        text = 'All in';
      else if (this.hasRaised || this.hasCalled) {
        text = this.bet === 0 ? "Check" : (this.hasRaised ? 'Raise' : 'Call');
      } 
      return text;
    }

    @computedFrom('playing', 'faceupCard1', 'hasFolded', 'isHovering')
    get ownCardsVisible(): boolean {
      return this.playing && this.faceupCard1 && (!this.hasFolded || this.isHovering);
    }
    


  attached() {
    //console.log('seatElem', this.seatElem);
    this.pLeft = $(this.seatElem).css('left');
    this.pTop = $(this.seatElem).css('top');
    //console.log('pLeft:' + this.pLeft + ' pTop: ' + this. pTop);
    let that = this;
    this.seatElem.addEventListener('click', this.loadSoundsHandler);
  }

  detached() {
    this.stopMyTurnAnimations();
    let that = this;
     this.seatElem.removeEventListener('click', this.loadSoundsHandler);
  }
  

  loadSounds(){
    this.apiService.loadSounds();
  }

  sit() {    
    if (this.canSit)
      this.ea.publish(new SitDownAction(this.seatIndex));
  }
  setHoleCards() {
    if (this.playercards && this.playercards.length > 0) {      
      this.faceupCard1 = "sprite sprite-" + this.playercards[0] + "-150";      
      this.faceupCard2 = "sprite sprite-" + this.playercards[1] + "-150";

    } else {
      this.faceupCard1 = '';
      this.faceupCard2 = '';
    }
  }


  setChips() {    
    this.chips = this.util.getChips(this.seatIndex, this.bet, this.playerChips, this);
  }

  chipsToPlayer() {
    $('.chip').animate({ 'left': this.pLeft, 'top': this.pTop }, 600, function() { $('.chip').remove() });
  }
  
  playerChips (playernum, stacknum, chipnum, quantity) {
    
    var p0 = this.constants.p0;
    var p1 = this.constants.p1;
    var p2 = this.constants.p2;
    var p3 = this.constants.p3;
    var p4 = this.constants.p4;
    var p5 = this.constants.p5;
    var p6 = this.constants.p6;
    var p7 = this.constants.p7;
    var p8 = this.constants.p8;
    var players = Array(p0, p1, p2, p3, p4, p5, p6, p7, p8);
    var player = players[playernum];
    
    var bottom_chip = player[stacknum];
    let chips = [];
    for (var i = 0; i < quantity; i++) {
      var top = bottom_chip[1] - (2 * i);
      chips.push(this.util.getChip(chipnum, bottom_chip[0], top, undefined));
    }
    return chips;
  }

  deal() {
    let $seat = $(this.seatElem);
    this.util.dealCard(this.facedownCard, this.pLeft, this.pTop, this.constants.dealwidth, $seat.width(), $, 250, this.constants.origin,  null);
  }
  
 
  
  returnCards() {

    this.returnCard();

    setTimeout(() => {
      this.returnCard();
      //this.playercards = [];
    }, 100);    
  }

  returnCard() {
    let $seat = $(this.seatElem);
    let dealerLeft = this.constants.origin[1];
    let dealerTop = this.constants.origin[0];
    let cardOrigin = [this.pTop, this.pLeft];
    this.util.dealCard(this.facedownCard, dealerLeft, dealerTop, $seat.width(), this.constants.dealwidth, $, 250, cardOrigin, null);
  }

  checkChanges(seat: TableSeatEvent) {

    if (this.hasFolded===false && seat.hasFolded) {
      this.returnCards();
    }
    if (seat.hasFolded) {
      //this.playercards = [];
    }
    if (!this.myturn && seat.myturn) {

      this.startTimer();
      
    } else {
      this.stopMyTurnAnimations();      
    }        
      
  }
  stopMyTurnAnimations() {
    this.timeToActSec = null;

    if (this.timerElem) {
      this.timerElem.remove();
    }
    if (this.flashingTurnTimer) {
      window.clearInterval(this.flashingTurnTimer);
      this.playerMyTurn = false;
      this.timeLeft = 0;
    }
  }
  timeLeft: number = 0;
  startTime;

  startTimer() {    
    this.flashingTurnTimer = window.setInterval(() => {       
      this.playerMyTurn = !this.playerMyTurn;
      let msSinceStarted = (new Date().getTime() - this.startTime.getTime());
      let startingIn = this.getTimeToActSec() * 1000 - msSinceStarted;
      let remaining = Math.round(startingIn / 1000);      
      this.timeLeft = remaining >= 0 ? remaining : 0;

    }, 300);    


    if (this.getTimeToActSec()) {
      this.startTime = new Date();
    }
    

  }

  getTimeToActSec() {
    return this.timeToActSec || this.util.currentTableConfig.timeToActSec;
  }

  

}
