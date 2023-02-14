import { IPlayer } from "../../../../poker.ui/src/shared/CommonHelpers";

import { TableSeatEvent } from "../../../../poker.ui/src/shared/DataContainer";

export class PlayerTableHandle implements IPlayer {
    
    constructor(public guid:string, public screenName:string, public gravatar:string,seat: number) {
        this.seat = seat;
    }

    seat: number;
    playing: boolean = false;
    sitOutNextHand: boolean = false;
    autoFold: boolean;
    autoCheck: boolean;
    holecards: string[] = [];
    bet: number=0;
    stack: number;
    hasFolded: boolean;
    myturn: boolean;
    hasRaised: boolean;
    hasCalled: boolean;
    cumulativeBet: number=0;
    isDisconnected: boolean;
    disconnectedSince: Date;
    empty: boolean = false;
    isSittingOut: boolean;  
    isAutoSitout: boolean;  
    sittingOutSince: Date;  
    timerStart: Date;  
   

    toTableSeatEvent():TableSeatEvent{
        let event = new TableSeatEvent();
            event.name = this.screenName;
            event.seat = this.seat;
            event.playing = this.playing;
            event.stack = this.stack;
            event.empty = this.empty;
            event.bet = this.bet;               
            event.hasFolded = this.hasFolded;               
            event.myturn = this.myturn;               
            event.hasRaised = this.hasRaised;               
            event.hasCalled = this.hasCalled;               
            event.isSittingOut = this.isSittingOut;                           
            return event;
    }
  setBet(amount: number): void {
    if (!this.bet)
      this.bet = 0;
    this.bet += amount;
    this.cumulativeBet += amount;
    this.stack -= amount;
    if(this.stack < 0){
        throw new Error(`stack cannot be less than zero ${amount}`)
    }
    }
}