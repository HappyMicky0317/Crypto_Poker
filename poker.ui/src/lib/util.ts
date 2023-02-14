import {Chip} from "../model/chip";
import {UserData,  GameEvent, GameStartingEvent} from "../shared/DataContainer";
import { CurrencyUnit } from "../shared/Currency";
declare var Notification: any;
import environment from '../environment'; 
import { Seat } from "../seat";
import { TableViewRow } from "../shared/TableViewRow";
import { Currency } from "../shared/Currency";
import { Decimal } from "../shared/decimal";
import { numberWithCommas } from "../shared/CommonHelpers";
import { TournamentViewRow } from "../shared/tournmanet-view-row";
import { TournmanetStatus } from "../shared/TournmanetStatus";

export class Util {
    tableConfigs: TableViewRow[] = [];    
    currentTableId:string;
    currentTableConfig: TableViewRow;
    user: UserData;

    setCurrentTableId(value: string) {
      this.currentTableId = value;      
  }
  
  toDisplayAmount(amount:any, tableConfig?:TableViewRow) :string {
      if (!amount && amount !== 0)
        return '';
      if(!tableConfig)
        tableConfig = this.currentTableConfig;
      if (tableConfig) {
        if(tableConfig.currency == Currency.tournament){
          return numberWithCommas(amount);
        }else{
          return this.formatNumber(this.toUsd(amount, tableConfig.exchangeRate, tableConfig.currency));
        }        
      }

      return this.formatNumber(amount / 100);
    }
        

  toUsd(amount: number, exchangeRate:number, currency:string) :number {
    let currencyUnit = CurrencyUnit.getCurrencyUnit(currency)
    var convertedAmount = (amount / currencyUnit * exchangeRate);
    return convertedAmount;
  }

  fromDisplayAmount (text) {
    var amount = this.parseAmount(text);
    var tableConfig = this.currentTableConfig;
    if (tableConfig) {      
      let currencyUnit = CurrencyUnit.getCurrencyUnit(tableConfig.currency)
      amount = Math.floor(amount / tableConfig.exchangeRate * currencyUnit);
    }

    return amount;
  }

  getCryptoCurrencies() : string[] {
    return this.tableConfigs.map(c=>c.currency).filter((v, i, a) => v != Currency.free && v != Currency.tournament && a.indexOf(v) === i);
  }

  parseAmount(text) {
    return parseFloat(text.replace(',', '').replace('$', ''));
  }

    formatNumber(amount:number, currency = null) :string {
      if(amount===undefined){
        return '';
      }
        
      if (!currency || currency === "usd"){
        currency = "$";
      if(parseFloat(amount.toFixed(2)) < 0.01)
          amount = 0;//USD amounts less than a cent are rounded to zero
      }
        
      if (amount == null)
        return '';
      if(typeof(amount)==='string'){
        amount = new Decimal(amount).toNumber();
      }
      
      return currency + numberWithCommas(amount.toFixed(2));
    }
  
  

    getStatusLabel(game: GameEvent, playerSitting: boolean, playerSeat:number, seats:Seat[], gameStarting: GameStartingEvent, isTournament:boolean): string {

      let label = '';
      if (game && game.potResults && game.potResults.length) {

        if (game.potResults.length === 1) {
          label = this.getPotWinnerSummary(game.potResults[0], seats);
        } else {
          
          for (var i = 0; i < game.potResults.length; i++) {
            label += `<span class="multi-pot-result">Pot ${i + 1}: ` + this.getPotWinnerSummary(game.potResults[i], seats) + '</span>';
            if (i !== game.potResults.length - 1)
              label += "</br>";
          }        
        }

        return label;
      }
      if (playerSitting) {

        const player = this.getPlayersTurn(seats);
        if (player) {
          if (player.seatIndex !== playerSeat) {
            label = `Waiting for ${player.name}`;
          }
        } else {
         
          if (!game || (!game.pot.length && !gameStarting.isStarting)){
            if(isTournament){
              label = this.getTournamentLabel(seats, playerSeat, gameStarting);
            }else{
              label = 'Waiting for other players to join.';
            }
            
          }         
            
        }

      } else {
        if(isTournament){
          label = this.getTournamentLabel(seats, playerSeat, gameStarting);
        }else{
          label = 'Choose a seat to join the table.';
        }
        
      }
      return label;
    }

    getTournamentLabel(seats:Seat[], playerSeat:number, gameStarting: GameStartingEvent){
      if(seats.filter(s=>!s.empty).length){
        const player = this.getPlayersTurn(seats);
        if (player) {
          if (player.seatIndex !== playerSeat) {
            return `Waiting for ${player.name}`;
          }
        }else if(!gameStarting.isStarting){
          return 'Waiting on other tables.';
        }
        
      }else{
        return 'Table closed';
      }
    }

    getPotWinnerSummary(potResult, seats:any[]) {
      var summary = '';
      if (potResult.seatWinners.length === 1) {
        summary = seats[potResult.seatWinners[0]].name + " wins!";
      } else if (potResult.seatWinners.length > 1) {
        summary = "Split Pot: Seats ";
        for (var i = 0; i < potResult.seatWinners.length; i++) {
          summary += seats[potResult.seatWinners[i]].name;
          if (i != potResult.seatWinners.length - 1)
            summary += " & ";
        }
      } else {
        console.log('invalid pot result!', potResult);
      }
      if (potResult.winningHand)
        summary += " - " + potResult.winningHand;
      return summary;
    }

  getNumPlayers(seats) {
    var count = 0;
    for (var i = 0; i < seats.length; i++) {
      if (!seats[i].empty) {
        count++;
      }
    }

    return count;
  }

  fromSmallest(amount: number, currency:string):string {
    if (currency.toLowerCase() === "usd") {
      return this.formatNumber(amount, currency);
    }
    let currencyUnit = CurrencyUnit.getCurrencyUnit(currency)
    return this.numberToString(amount / currencyUnit);
  }

  formatAmountWithUsd(amount: number, currency: string, amountUsd:number):string {
    if (currency.toLowerCase() === "usd") {
      return this.formatNumber(amount/100, currency);
    } else {
      let currencyUnit = CurrencyUnit.getCurrencyUnit(currency)
      let rawAmt = amount / currencyUnit;
      let rawRounded = Math.round(rawAmt * 1000000) / 1000000;
      let approxLabel = rawAmt != rawRounded ?"~" : "";
      let amountUsdStr = this.formatNumber(amountUsd, 'usd');
      return `${approxLabel}${rawRounded} (${amountUsdStr})`;
    }
  }

  getPlayersTurn(seats):Seat | null {
    for (var i = 0; i < seats.length; i++) {
      if (seats[i].myturn) {
        return seats[i];
      }
    }
    return null;
  }

  notify(text:string):Promise<Notification> {    
    return this.requestNotificationPermission()
        .then((permission) => {
          if (permission === 'granted') {
            let notification = new Notification(text, { icon: '/images/logo_icon_only.png' });
            return notification;
          }
        });
  }

  requestNotificationPermission(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof Notification !== 'undefined') {
        Notification.requestPermission((permission)=> {
          //console.log(`Notification.permission:${permission}`)
          return resolve(permission);
        });
      }
      else{
        return resolve('');
      }
    })
  }

  //this avoids numbers using scientifc notation
  numberToString(num){
    let numStr = String(num);

    if (Math.abs(num) < 1.0)
    {
        let e = parseInt(num.toString().split('e-')[1]);
        if (e)
        {
            let negative = num < 0;
            if (negative) num *= -1
            num *= Math.pow(10, e - 1);
            numStr = '0.' + (new Array(e)).join('0') + num.toString().substring(2);
            if (negative) numStr = "-" + numStr;
        }
    }
    else
    {
        let e = parseInt(num.toString().split('+')[1]);
        if (e > 20)
        {
            e -= 20;
            num /= Math.pow(10, e);
            numStr = num.toString() + (new Array(e + 1)).join('0');
        }
    }

    return numStr;
}




  readonly chips1 = [25, 10, 5, 1];
    readonly chips2 = [250, 100, 50, 25, 10, 5, 1];
    readonly chips3 = [250, 100, 50, 25, 20, 10, 5, 1];
    readonly chips4 = [10000, 5000, 2000, 1000, 500, 250, 100, 50, 25, 20, 10, 5, 1];
    readonly chipsets = [this.chips1, this.chips2, this.chips3, this.chips4];

  getChips(index:number, amount:number, chipDataFunc:any, callContext:any) : Chip[] {
    let tableConfig = this.currentTableConfig;
    if (!tableConfig)
      return [];//animation after disconnected
    
    
    let adjustedBet = Math.round(amount / tableConfig.smallBlind);
    //var bet = thisSeat.bet;
    let bet = adjustedBet;
    let betStacks = null;

    for (let k = 0; k < this.chipsets.length; k++) {
      betStacks = this.getStacks(bet, this.chipsets[k]);
      if (betStacks !== false) { break }
    }
    if (!betStacks) {
      betStacks = [[10000, 10], [5000, 8], [2000, 6], [1000, 4], [500, 2]];      
    }

    betStacks.sort(function (a, b) {
      return (a[1] - b[1]);
    });
    betStacks.reverse();
    let chips: Chip[] = [];
    for (var j = 0; j < betStacks.length && j < 5; j++) {
      chips = chips.concat(chipDataFunc.call(callContext, index, j, betStacks[j][0], betStacks[j][1]));
    }
    return chips;
  }

  getStacks(thisBet, chips): any {
    var thisBetStack = [];
    for (var i = 0; i < chips.length; i++) {
      var chipval = chips[i];
      if (thisBet / chipval >= 1) {
        if (Math.floor(thisBet / chipval) > 10) {
          return false;
        }
        thisBetStack.push([chipval, Math.floor(thisBet / chipval)]);
        thisBet %= chipval;
      }
    }
    return thisBetStack;
  }

  

  getChip(chipnum, left, top, extraClass) {
    let chip = new Chip();
    extraClass = extraClass ? extraClass : '';
    chip.classes = 'chip chip' + chipnum + ' ' + extraClass;
    chip.top = top;
    chip.left = left;
    return chip;

  }

  dealCard(card: string, pLeft: number, pTop: number, startWidth: number, endWidth:number, $:any, dealspeed:number, origin:number[], onAnimationComplete) {
    
    
    var dealElement = $(`<div class="sprite sprite-${card}-150">`);
    //dealElement.attr('src', imgSrc);
    //var left = ($('#poker-room').width() / 2) - dealwidth / 2;
    
    dealElement.css({ 'position': 'absolute', 'top': origin[0], 'left': origin[1], 'width': startWidth });

    $('#poker-room').append(dealElement);
    dealElement.animate({ 'left': pLeft, 'top': pTop, 'width': endWidth}, dealspeed, "linear", function () {
      dealElement.remove();
        if (onAnimationComplete)
          onAnimationComplete();
      }
    );
  }

  audio = [];
  playSound(src) {
    if(this.user && this.user.muteSounds){
      return;
    }
    var audioElem = this.audio.find(a=>a.src.endsWith(src));
    if(audioElem)    
      audioElem.play();    
  }
  getCookie(name):string {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2)
      return parts.pop().split(";").shift();
    return '';
  }
  createCookie(name, value, days) {
    let expires: string = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    else {
      expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  }
  


  canRegister(tournament: TournamentViewRow): { success: boolean, isLate?: boolean } {
    if (!tournament.joined) {
      if (!tournament.status) {
        return { success: true };
      } else if (tournament.status == TournmanetStatus.Started && tournament.lateRegistrationMin) {
        let startTime = new Date(tournament.startTime);
        let cutOff = new Date(startTime.getTime() + tournament.lateRegistrationMin * 60 * 1000);
        let beforeCutoff = cutOff.getTime() - new Date().getTime();
        if (beforeCutoff > 0) {
          return { success: true, isLate: true };
        }
      }

    }
    return { success: false };
  }
  canLateRegister(tournament: TournamentViewRow){

  }
}
