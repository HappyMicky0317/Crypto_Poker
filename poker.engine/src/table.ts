import { TableState, PlayerTableState } from './model/TableState';
import { CommonHelpers, getCardSuit, numberWithCommas } from '../../poker.ui/src/shared/CommonHelpers';
import {AutoOptionResult} from '../../poker.ui/src/shared/AutoOptionResult';
import { DataContainer, PokerError, GameStartingEvent, DealHoleCardsEvent, GameEvent, SubscribeTableResult, PotResult, TableSeatEvent,
  SetTableOptionResult, ChatMessage, ChatMessageResult, TableClosed, LeaderboardResult, LeaderboardUser, BlindsChangingEvent, TableSeatEvents, TableConfigs } from "../../poker.ui/src/shared/DataContainer";
import { WebSocketHandle } from "./model/WebSocketHandle";
import { Deck } from "./deck";
import { User } from "./model/User";
import { TexasHoldemGameState, GamePot, PotResult as TexasHoldemGameState_PotResult, HandEvaluatorResult, GamePotResult } from "./model/TexasHoldemGameState";
import { IDataRepository } from "./services/documents/IDataRepository";
import {SetTableOptionRequest} from "../../poker.ui/src/shared/ClientMessage";
import {UserTableAccount} from "./model/TableBalance";
import { SeatHistory } from './model/seat-history';
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();
 var _ = require('lodash');
 import { removeItem, getUserData, getTableViewRow, getBlindConfig, transferTableBalance, BlindConfigResult } from "./helpers";
 import { Decimal } from './../../poker.ui/src/shared/decimal';
 import { NextBlind } from './../../poker.ui/src/shared/NextBlind';
import { ISubscriber } from './model/ISubscriber';
import { TableViewRow } from '../../poker.ui/src/shared/TableViewRow';
import { TableConfig } from './model/TableConfig';
import { IBroadcastService } from './services/IBroadcastService';
import { BlindConfig } from './model/tournament';
import { CurrencyUnit, Currency } from '../../poker.ui/src/shared/Currency';
import { TableProcessor, TableProcessorMessage, TableMessage, TableProcessorResult } from './admin/processor/table-processor/TableProcessor';
import { TableAuditEvent } from './model/table/TableAuditEvent';
import { PlayerTableHandle } from './model/table/PlayerTableHandle';
import { ITimerProvider } from './model/table/ITimerProvider';
import { PostShowdownEvent } from './model/table/PostShowdownEvent';
import { JoinTableResult } from './model/table/JoinTableResult';
import { PokerStreetType } from './model/table/PokerStreetType';
import { DbGameResults } from './model/table/DbGameResults';
import { GameResultPlayer } from './model/table/GameResultPlayer';
import { DbPotResult } from './model/table/DbPotResult';
import { DbPlayerAllocationResult } from './model/table/DbPlayerAllocationResult';
import { DbHandEvaluatorResult } from './model/table/DbHandEvaluatorResult';
import { JoinTableRequest } from './model/table/JoinTableRequest';
import { UserSmall } from './model/UserSmall';

 export class Table {
   
  static readonly MaxSeatNumber:number = 9; //not related to maxPlayers - indicates the seat numbers that can be sat in (regardless of the maximum number of players)
   

   constructor(tableConfig: TableConfig) { 
     this._tableConfig = tableConfig;      
     this.currencyUnit = CurrencyUnit.getCurrencyUnit(this.tableConfig.currency);
    }

    broadcastService:IBroadcastService;
   
   private auditEvents: TableAuditEvent[] = [];
   private players: PlayerTableHandle[] = [];//all players seated - playing or otherwise
   subscribers: ISubscriber[] = [];
   currentPlayers: PlayerTableHandle[];//players in the current hand
   pastPlayers: SeatHistory[][] = [];
   private _tableConfig: TableConfig;
   get tableConfig():TableConfig {
     return this._tableConfig;
   }
   gameStarting: Date|null;
   gameStartDelaySec: number = 3;
   showdownAfterAllFoldDelaySec: number = 1;
   flopDelaySec: number = 1;   
   timerProvider: ITimerProvider;
   dealerSeat: number = -1;
   playerNextToActIndex: number = -1;
   toCall: number;
   lastRaise: number;
   playerTimer: any;

   deck: Deck;
   lastToActIndex: number;
   firstToActIndex: number;
   minNumPlayers: number = 2;
   street: string;

   gameState: TexasHoldemGameState;
   dataRepository: IDataRepository;
   chatMessages: ChatMessage[] = [];
   shutdownRequested:boolean;
   idleTimeSec: number = 600;   
   pendingExchangeRate:number;
   seatHistory:SeatHistory[] = [];
   tournamentId:string;
   onPostShowdown:(event:PostShowdownEvent) => Promise<void>;
   blindConfig: BlindConfig[];
   blindsStartTime: Date;
   processor:TableProcessor;
   get tableId(){
    return this.tableConfig._id.toString();
   }

   validateJoinTable(request: JoinTableRequest): JoinTableResult {
     let result = new JoinTableResult();
     
     if (this.tournamentId) {
      result.errorMessage = `Cannot join a tournament table`;
      return result;
    }
     if (!Number.isInteger(request.stack)) {
        result.errorMessage = `request amount of ${request.stack} is not a valid integer`;
        return result;
     }
     
      if (request.seat < 0 || request.seat >= Table.MaxSeatNumber) {
        result.errorMessage = `Invalid seat number: ${request.seat}. Must be between 1 and ${Table.MaxSeatNumber}`;
        return result;
      }

     if (this.shutdownRequested) {
       result.errorMessage = `Unable to join table as server shutdown is in progress`;
       return result;
     }
     
     if (this.players.length >= this.tableConfig.maxPlayers) {
       result.errorMessage = `Max number of players is ${this.tableConfig.maxPlayers}`;
       return result;
     }
     var existingSeat = this.players.find(h => h.seat === request.seat);
     if (existingSeat != null) {
       result.errorMessage = `Seat ${request.seat} is occupied`;
       return result;
     }
     let playerStack = request.stack || 0;
     if (playerStack < this.tableConfig.bigBlind) {
       result.errorMessage = `Minimum stack size is ${this.tableConfig.bigBlind} and your stack is ${playerStack}`;
       return result;
     }
     if (!this.subscribers.filter(s => s.user.guid === request.guid).length) {
       result.errorMessage = `player is not a subscriber`;
       return result;
     }
     
     let existingPlayer = this.players.find(p => p.guid === request.guid);
     if (existingPlayer) {
       result.errorMessage = `player is already playing at seat ${existingPlayer.seat}`;
       return result;
     }
     result.success = true;
     return result;
   }

   getEmptySeats(): number[]{
    let takenSeats = this.getPlayers().map(h=>h.seat);
    let emptySeats = [];
    let numSeatsLeft = this._tableConfig.maxPlayers - takenSeats.length;
    if(numSeatsLeft){
      for (let i = 1; i <= Table.MaxSeatNumber; i++) {
        if(takenSeats.indexOf(i) === -1){
          emptySeats.push(i);
          if(emptySeats.length == numSeatsLeft){
            break;
          }
        }      
      }
    }
    
    return emptySeats;
   }

   handleJoinTableRequest(request: JoinTableRequest): JoinTableResult {
     let result = this.validateJoinTable(request);
     if (!result.success)
       return result;
     let handle = this.addPlayerHandle(request);
     this.broadcastJoinTable(handle);
     if(!this.tournamentId && this.broadcastService){
      this.broadcastTableConfigUpdate();
     }
     this.checkGameStartingEvent();

     return result;
   }

   broadcastJoinTable(handle:PlayerTableHandle){
     
    let publicSeatEvent = handle.toTableSeatEvent();
    publicSeatEvent.avatar = handle.gravatar;
    for (let subscriber of this.subscribers) {
      let data = new DataContainer();
      data.tableSeatEvents = new TableSeatEvents(this.tableId);
      if (subscriber.user.guid === handle.guid) {
        let privateSeatEvent = handle.toTableSeatEvent();
        privateSeatEvent.guid = handle.guid;
        privateSeatEvent.avatar = handle.gravatar;
        data.tableSeatEvents.seats.push(privateSeatEvent);
      } else {
        data.tableSeatEvents.seats.push(publicSeatEvent);
      }

      subscriber.send(data);
    }
   }

   checkGameStartingEvent() {
     if (!this.gameStarting && !this.currentPlayers) {
      let players = this.getPlayersForNextHand()
      
      if(players.length >= this.minNumPlayers){
        this.handleGameStartingEvent();
      }
      
    }
   }

   private getPlayersForNextHand(): PlayerTableHandle[] {
     let players = this.players.filter(p => !p.sitOutNextHand && !p.isDisconnected);     
     return players;
   }

   handleGameStartingEvent() {

    let startDelay = this.gameStartDelaySec;
    let data = new DataContainer();

    if(this.pendingExchangeRate && this.pendingExchangeRate != this.tableConfig.exchangeRate){
      this.updateExchangeRate(this.pendingExchangeRate);
      this.setTableConfigUpdate(data);
    }
    let blindsChangingEvent:BlindsChangingEvent;
    let nextBlind:NextBlind;
    if(this.blindConfig){
      let blindConfigResult = getBlindConfig(this.blindsStartTime, this.blindConfig);
      let blindConfig = blindConfigResult.blinds;
      if(this.tableConfig.smallBlind != blindConfig.smallBlind ||  this.tableConfig.bigBlind != blindConfig.bigBlind){
        
        this.tableConfig.smallBlind = blindConfig.smallBlind;
        this.tableConfig.bigBlind = blindConfig.bigBlind;
        this.setTableConfigUpdate(data);
        blindsChangingEvent = new BlindsChangingEvent(blindConfig.smallBlind, blindConfig.bigBlind);
        startDelay += 3;//add extra time so users can see the change
      }
      nextBlind = this.getNextBlind(blindConfigResult);
    }
    
    let nextStartTime = new Date();
    nextStartTime.setSeconds(nextStartTime.getSeconds() + startDelay);
    this.gameStarting = nextStartTime;
    data.gameStarting = this.getGameStartingEvent();
    data.gameStarting.blindsChanging = blindsChangingEvent;
    data.gameStarting.nextBlind = nextBlind;

     this.sendDataContainer(data);
     this.timerProvider.startTimer(this.dealHoleCards.bind(this), startDelay * 1000, this);
   }

   

   private getGameStartingEvent() : GameStartingEvent{
    let gameStarting = new GameStartingEvent(this.tableId);
    gameStarting.isStarting = true;    
    gameStarting.startsInNumSeconds = Math.max(0, Math.round((this.gameStarting.getTime() - new Date().getTime())/1000));  
    return gameStarting;
   }

   updateExchangeRate(rate:number){
    let config = this.tableConfig;
    config.exchangeRate = rate;
    config.smallBlind = Math.round((config.smallBlindUsd / rate) * CurrencyUnit.getCurrencyUnit(config.currency));
    config.bigBlind = config.smallBlind * 2;
   }

   setCurrentPlayers(players: PlayerTableHandle[]) {
     this.currentPlayers = players;
   }

   addPlayerHandle(request:JoinTableRequest): PlayerTableHandle {
    let {guid, screenName, gravatar, seat, stack} = request;
    let existingSeat = this.players.find(h => h.seat === seat);
    if(existingSeat != null)
      throw Error(`seat ${seat} is occupied by ${existingSeat.screenName}`);
    let handle = new PlayerTableHandle(guid, screenName, gravatar, seat);
     handle.stack = stack;
     this.players.push(handle);
     this.players.sort(function(p1, p2) { return p1.seat - p2.seat });
     return handle;
   }

   private broadcastGameNotStarting(playersNotPlaying:PlayerTableHandle[]) {
     let data = new DataContainer();
     data.gameStarting = new GameStartingEvent(this.tableId);
     data.gameStarting.isStarting = false;
     if (playersNotPlaying.length) {
       data.tableSeatEvents = new TableSeatEvents(this.tableId);
       for (let player of playersNotPlaying) {
         let seatEvent = player.toTableSeatEvent();
         data.tableSeatEvents.seats.push(seatEvent);
       }
     }
     this.sendDataContainer(data);
     return;
   }

   private sitOutDisconnectedPlayers() {
     for (let player of this.players) {
       if (player.isDisconnected && !player.isSittingOut) {
         player.isSittingOut = true;
         player.sittingOutSince = new Date();
         player.sitOutNextHand = true;
       }
     }
   }

   private broadcastShutdown() {
     let data = new DataContainer();
     data.tableClosed = new TableClosed(this.tableId);     
     this.sendDataContainer(data);
     logger.info("finished shutdown for table: " + this.tableConfig.name);
     this.promiseResolve();
     
   }

   dealHoleCards() {
     if (this.shutdownRequested) {
       this.broadcastShutdown();
       return;
     }

     this.gameStarting = null;
     this.sitOutDisconnectedPlayers();
     let sittingOutPlayers = this.players.filter(p => p.sitOutNextHand);

     let playersForNextHand = this.getPlayersForNextHand();
     if (playersForNextHand.length < this.minNumPlayers) {
       this.broadcastGameNotStarting(sittingOutPlayers);
       return;
     }  
     
     
     this.setCurrentPlayers(playersForNextHand);
     this.resetAutoActions();  
     
     //find the first player from the previous hand who was supposed to get the button next
     let nextDealerSeat = null;
     if(this.pastPlayers && this.pastPlayers.length){        
        let lastPlayers = this.pastPlayers[this.pastPlayers.length-1].slice(0);
        while(lastPlayers.length){
          let nextDealSeatTmp = this.getNextDealerSeat(lastPlayers);
          if(!nextDealSeatTmp)
            break;
          let nextDealPlayer = lastPlayers.find(p=>p.seat==nextDealSeatTmp);
          let currentPlayer = this.currentPlayers.find(p=>p.guid==nextDealPlayer.guid);
          if(currentPlayer != null && currentPlayer.seat == nextDealPlayer.seat){
            nextDealerSeat = nextDealSeatTmp;
            break;
          }else{
            removeItem(lastPlayers, nextDealPlayer);            
          }
        }
        
     }
     
     this.dealerSeat = nextDealerSeat || this.getNextDealerSeat(this.tournamentId ? this.players : this.currentPlayers);

     this.deck = new Deck();
     this.auditEvents = [];


     for (let player of this.currentPlayers) {
       player.holecards = [this.deck.getNextCard(), this.deck.getNextCard()];
     }     

     let smallBlind: PlayerTableHandle;
     let bigBlind: PlayerTableHandle;
     //console.log('dealerSeat: ' + this.dealerSeat);      
     
     //see https://boardgames.stackexchange.com/questions/1617/texas-holdem-heads-up-blind-structure
     if ((this.currentPlayers.length === 2 && !this.tournamentId) || this.players.length == 2) {
      let dealerPlayer = this.currentPlayers.find(p => p.seat === this.dealerSeat);
      let indexOfDealer = this.currentPlayers.indexOf(dealerPlayer); 
      smallBlind = indexOfDealer === 0 ? this.currentPlayers[0] : this.currentPlayers[1];
       bigBlind = indexOfDealer === 0 ? this.currentPlayers[1] : this.currentPlayers[0];
       this.playerNextToActIndex = indexOfDealer;
     } else {
       
      let playerArr = this.tournamentId ? this.players : this.currentPlayers;
      smallBlind = this.getNextPlayer(this.dealerSeat, playerArr);
      bigBlind = this.getNextPlayer(smallBlind.seat, playerArr);      

      let bigBlindIndex =  playerArr.indexOf(bigBlind);      
      
      let nextToActIndex = bigBlindIndex;
      for (let i = 0; i < playerArr.length; i++) {
        //keep moving forward after the big blind until we find the next player who belongs to the current players
        nextToActIndex = this.getPlayerNextToActIndex(nextToActIndex, playerArr);
        let playerNextToAct = playerArr[nextToActIndex];      
        let indexOf = this.currentPlayers.indexOf(playerNextToAct);
        if(indexOf > -1){
          this.playerNextToActIndex = indexOf;
          break;
        }          
      }
     }
     
     this.lastToActIndex = this.getPriorPlayerIndex(this.playerNextToActIndex)    

     let playerNextToAct = this.currentPlayers[this.playerNextToActIndex];
     
     smallBlind.setBet(Math.min(this.tableConfig.smallBlind, smallBlind.stack));
     bigBlind.setBet(Math.min(this.tableConfig.bigBlind, bigBlind.stack));
     if(!this.tournamentId && this.pastPlayers && this.pastPlayers.length){
       for(let player of this.currentPlayers){
         let seatHistory = this.pastPlayers[this.pastPlayers.length-1].find(h=>h.guid==player.guid);
         if(seatHistory != null && seatHistory.seat != player.seat){
          player.setBet(Math.min(this.tableConfig.bigBlind - player.bet, player.stack));
         }
       }
     }
     let pot1 = new GamePot();
     pot1.amount = 0;
     for(let player of this.players.filter(p=>p.bet>0)){
      pot1.amount += player.bet;
      if(this.currentPlayers.indexOf(player) > -1){
        pot1.players.push(player);
      }      
     }
     
     this.gameState = new TexasHoldemGameState();
     this.gameState.pots.push(pot1);


     if (smallBlind === playerNextToAct) {
       smallBlind.myturn = true;
     } else {
       playerNextToAct.myturn = true;
     }

     for (let player of this.currentPlayers) {
       player.playing = true;
       player.isSittingOut = false;
       player.sittingOutSince = null;
     }
     this.toCall = this.tableConfig.bigBlind - playerNextToAct.bet;
     this.lastRaise = 0;
     playerNextToAct.hasCalled = this.toCall == 0;//only true when someone moves seats and pays the big blind
     let publicData = new DataContainer();
     publicData.deal = new DealHoleCardsEvent(this.tableId);
     publicData.tableSeatEvents = new TableSeatEvents(this.tableId);
     publicData.tableSeatEvents.seats = this.players.map(p=>p.toTableSeatEvent());     
     publicData.game = this.toGameEvent();

     for (let subscriber of this.subscribers) {
       let player = this.currentPlayers.find(p => p.guid === subscriber.user.guid);
       if (player != null) {
         let privateData = new DataContainer();
         privateData.deal = new DealHoleCardsEvent(this.tableId);
         privateData.deal.holecards = player.holecards;
         privateData.game = publicData.game;
         privateData.tableSeatEvents = publicData.tableSeatEvents;         
         subscriber.send(privateData);
       } else {
         subscriber.send(publicData);
       }

     }
     this.startPlayerTimeout();     
   }

   incrementPlayerNextToActIndex(index: number, players:PlayerTableHandle[]): void {
     this.playerNextToActIndex = this.getPlayerNextToActIndex(index, players);
   }

   private getNextPlayer(startingSeatNum: number, seats: PlayerTableHandle[], reverse: boolean = false): PlayerTableHandle {

     let startingSeat = seats.find(s => s.seat == startingSeatNum);
     if (!startingSeat){
      //no player at this seat
      let seatsBefore = seats.filter(s=>s.seat < startingSeatNum);
      let seatsAfter = seats.filter(s=>s.seat > startingSeatNum);

      if(reverse){        
        if(seatsBefore.length){
          return seatsBefore[seatsBefore.length-1];
        }else{
          return seatsAfter[seatsAfter.length-1];
        }
      }else{
        //should not get here as this method only called from dealHoleCards and dealCommunityCards. for the former the startingSeat should always be defined
        //for the latter we are always going in reverse so it falls into the block above
        if(seatsAfter.length){
          return seatsAfter[0];
        }else{
          return seatsBefore[0];
        }
      }
     }else{
      let startingIndex = seats.indexOf(startingSeat);
      let nextSeatIndex = startingIndex + (reverse ? -1 : 1);
      
      //check if we have either moved over the end or beginning of array and if so get the user on the 'other end' of the array
      if (nextSeatIndex >= seats.length) {
        nextSeatIndex = 0;
      }else if(nextSeatIndex < 0){
       nextSeatIndex = seats.length-1;
      }
      return seats[nextSeatIndex];
     }

   }

   private getNextPlayerWherePlayerIsPlaying(startingSeatNum: number, seats: PlayerTableHandle[], reverse: boolean): PlayerTableHandle {
    
    for(let i=0;i<seats.length-1;i++){
      let nextSeat = this.getNextPlayer(startingSeatNum, seats, reverse);
      if(this.currentPlayers.indexOf(nextSeat) > -1){
        return nextSeat
      }else{
        startingSeatNum = nextSeat.seat;
      }
    }

    return null;
  }


   private getPlayerNextToActIndex(index: number, players:PlayerTableHandle[]): number {
     let nextToActIndex = -1;
     for (let i = 1; i < players.length; i++) {
       let tmpIndex = (index + i) % players.length;              
       if (this.playerCanAct(players[tmpIndex])) {
         nextToActIndex = tmpIndex;
         break;
       }
       if(tmpIndex == this.lastToActIndex)
        return -1;
     }
     return nextToActIndex;
   }
   currencyUnit:number;
   minimumUsdAmount:Decimal = new Decimal('0.01');

   private playerCanAct(player: PlayerTableHandle): boolean {
     if(!player.hasFolded && player.stack > 0){      
      let usdStack = new Decimal(player.stack).dividedBy(this.currencyUnit).mul(this.tableConfig.exchangeRate);
      
      return !usdStack.lessThan(this.minimumUsdAmount);
     }
     return false;
   }

   getPriorPlayerIndex(index: number): number {
     let priorIndex = -1;
     
     for(let i=1;i<this.currentPlayers.length;i++) {
       priorIndex = index - i;
       if (priorIndex < 0)
         priorIndex = this.currentPlayers.length - Math.abs(priorIndex);

       let player = this.currentPlayers[priorIndex];
         if (player.hasFolded || player.stack === 0) {         
         continue;
       } else {
         return priorIndex;
       }

     }
     return -1;
   }

   private toGameEvent() {
     let gameEvent = new GameEvent(this.tableId);
     if (this.gameState) {
       gameEvent.pot = this.gameState.pots.map(x => x.amount);
       gameEvent.board = this.gameState.boardCards;
     } 
     gameEvent.tocall = this.toCall;
     gameEvent.lastRaise = this.lastRaise;
     gameEvent.dealer = this.dealerSeat;
     return gameEvent;
   }
   
   //the seat number of the next dealer
   getNextDealerSeat(players: ISeat[]): number {
    
    let nextSeat: number = null;
     for (let player of players) {
       if (player.seat > this.dealerSeat) {
         nextSeat = player.seat;
         break;
       }
     }
     if (!nextSeat) {
       for (let player of players) {
         if (player.seat < this.dealerSeat) {
           nextSeat = player.seat;
           break;
         }
       }
     }

     return nextSeat;

   }

   sendDataContainer(data: DataContainer): void {
     for (let subscriber of this.subscribers) {
       subscriber.send(data);
     }
   }


   getPlayers(): PlayerTableHandle[] {
     return this.players;
   }

   getPlayerAtSeat(seat:number): PlayerTableHandle {
    return this.players.find(p=>p.seat==seat);
  }

   addSubscriber(subscriber: ISubscriber) {
     let existingSubscriber = this.subscribers.find(s => s === subscriber);
     if (existingSubscriber == null) {
       this.subscribers.push(subscriber);
      let broadcastToOthers:boolean = false;
       let data = new DataContainer();
       data.game = this.toGameEvent();

       let player = this.players.find(p => p.guid === subscriber.user.guid);
       if (player != null) {
        player.isDisconnected = false;
        player.disconnectedSince = null;
        if(player.isAutoSitout){
          player.isAutoSitout = false;
          player.isSittingOut = false;
          player.sittingOutSince = null;
          broadcastToOthers=true;
          this.checkGameStartingEvent();
        }
         if (player.sitOutNextHand || player.autoFold || player.autoCheck) {
           data.setTableOptionResult = this.getSetTableOptionResult();
           data.setTableOptionResult.sitOutNextHand = player.sitOutNextHand;
           data.setTableOptionResult.autoFold = player.autoFold;
           data.setTableOptionResult.autoCheck = player.autoCheck;
         }
       }

       data.subscribeTableResult = new SubscribeTableResult();       
       data.subscribeTableResult.tableId = this.tableId;
       data.subscribeTableResult.tournamentId = this.tournamentId;
       data.subscribeTableResult.tableConfig = getTableViewRow(this);
       data.subscribeTableResult.shutdownRequested = this.shutdownRequested;
       if(this.blindConfig){
        data.subscribeTableResult.nextBlind = this.getNextBlind(null);
       }
       
       if (this.players.length > 0) {
         data.tableSeatEvents = new TableSeatEvents(this.tableId);
         for (let playerHandle of this.players) {
           let seatEvent = playerHandle.toTableSeatEvent();
           seatEvent.avatar = playerHandle.gravatar;
           if (seatEvent.myturn && playerHandle.timerStart) {
             let msSinceStarted = (new Date().getTime() - playerHandle.timerStart.getTime());
             let startingIn = this.tableConfig.timeToActSec * 1000 - msSinceStarted;
             seatEvent.timeToActSec = Math.round(startingIn / 1000);
           }
             
           if (playerHandle.guid === subscriber.user.guid) {
             seatEvent.guid = subscriber.user.guid;
             if (player != null)
               seatEvent.playercards = player.holecards;
           }
           data.tableSeatEvents.seats.push(seatEvent);
         }         
       }

       if (this.chatMessages.length) {
         data.chatMessageResult = new ChatMessageResult();
         data.chatMessageResult.initialData = true;
         data.chatMessageResult.messages = _.takeRight(this.chatMessages, 50);
         data.chatMessageResult.tableId = this.tableId;
       }

       if(this.gameStarting != null){        
        data.gameStarting = this.getGameStartingEvent();  
        data.gameStarting.nextBlind = data.subscribeTableResult.nextBlind;
              
       }

       subscriber.send(data);

       if(broadcastToOthers){       
        this.broadcastPlayer(player, true);
      }
     }

   }

   getNextBlind(blindConfigResult:BlindConfigResult):NextBlind{
    if(blindConfigResult == null){
      blindConfigResult = getBlindConfig(this.blindsStartTime, this.blindConfig);
    }    
    let currentBlind = blindConfigResult.blinds;
    let indexOf = this.blindConfig.indexOf(currentBlind);
    if(indexOf < this.blindConfig.length - 1){
      let next = this.blindConfig[indexOf + 1];
      return new NextBlind(next.smallBlind, next.bigBlind, Math.round(blindConfigResult.remainingTimeSec));     
    }
    return null;
   }

   getSubscribers(): ISubscriber[] {
     return this.subscribers;
   }
   getSubscriber(guid:string): ISubscriber {
    return this.subscribers.find(s=>s.user.guid==guid)
  }


   onClientDisconnected(handle: WebSocketHandle): void {
     let player = this.removeSubscriber(handle);
     if (player && (!this.currentPlayers || this.currentPlayers.indexOf(player) === -1)) {
       player.isAutoSitout = !player.isSittingOut; //only update if not sitting out as player will be sat back in auto
       player.isSittingOut = true;
       player.sittingOutSince = new Date();

       this.broadcastPlayer(player);
     }
   }

   removeSubscriber(handle: ISubscriber) :PlayerTableHandle {
    let stillSubscribed:boolean = false; 
    
    for (let i = this.subscribers.length - 1; i >= 0; i--) {
       if (this.subscribers[i] === handle) {
         this.subscribers.splice(i, 1);         
       }else if(this.subscribers[i].user.guid == handle.user.guid){
        stillSubscribed = true;
       }
     }
     if(!stillSubscribed){
      let player = this.players.find(p => p.guid === handle.user.guid);
      if (player != null) {
        player.isDisconnected = true;       
        player.disconnectedSince = new Date();
        return player;
      }
     }
     return null;     
   }

   sendFold(user:UserSmall){
    let tMessage = new TableProcessorMessage(this);
    tMessage.fold = user;
    this.processor.sendMessage(tMessage);      
   }


   handleFold(guid: string): void {
     if (this.playerNextToActIndex < 0) {
       this.sendError(guid, `cannot fold between rounds`);
       return;
     }
     let player = this.currentPlayers[this.playerNextToActIndex];
     if (player.guid !== guid) {
       this.sendError(guid, `cannot fold out of turn`);
       return;
     }
     this.clearPlayerTimer();
     this.auditEvents.push(new TableAuditEvent(player.guid, 'fold', null));
     player.hasFolded = true;
     player.myturn = false;
     this.resetAutoAction(player, true);     
     
     let remainingPlayers = this.currentPlayers.filter(p => !p.hasFolded);
     let data = new DataContainer();
     data.tableSeatEvents = new TableSeatEvents(this.tableId);
     data.tableSeatEvents.seats.push(player.toTableSeatEvent());
     let chipsToPot: boolean = null;
     let nextPlayer:PlayerTableHandle;
     let isValidAutoAction:boolean;
     if (remainingPlayers.length === 1) {
       this.toCall = null;
       this.playerNextToActIndex = -1;            
       this.resetAutoActions();  
       this.timerProvider.startTimer(this.handleShowdown.bind(this), this.showdownAfterAllFoldDelaySec * 1000, this);
     } else {
       if (this.playerNextToActIndex === this.lastToActIndex) {
        chipsToPot = true; 
        this.startNextStreet(data, player);
       } else {
         if (remainingPlayers.length > 1) {
           this.incrementPlayerNextToActIndex(this.playerNextToActIndex, this.currentPlayers);
           nextPlayer = this.currentPlayers[this.playerNextToActIndex];
           let priorBet = this.toCall + player.bet;
           this.toCall = priorBet - nextPlayer.bet;           
           isValidAutoAction = this.pushNextPlayerAction(nextPlayer, data);                      
         }
       }
     }

     this.handlePostBetOrFold(data, 'fold', chipsToPot, nextPlayer, isValidAutoAction);

   }

   sendBet(betAmount: number, user: UserSmall){
    let tMessage = new TableProcessorMessage(this);
    tMessage.bet = { user: user, betAmount: betAmount };
    this.processor.sendMessage(tMessage);      
   }

   handleBet(betAmount: number, guid: string): void {

     if (this.playerNextToActIndex < 0) {
       this.sendError(guid, `cannot bet between rounds`);
       return;
     }
     let player = this.currentPlayers[this.playerNextToActIndex];
     if (player.guid !== guid) {
       this.sendError(guid, `you are not the next player to act.`);
       return;
     }
     if (betAmount > player.stack) {
       this.sendError(guid, `bet amount of ${this.getDisplayAmt(betAmount)} is larger than your stack of ${this.getDisplayAmt(player.stack)}`);
       return;
     }
     if (betAmount < this.toCall && betAmount !== player.stack) {
       this.sendError(guid, `bet amount of ${this.getDisplayAmt(betAmount)} is less than the call amount of ${this.getDisplayAmt(this.toCall)}`);
       return;
     }
     if (betAmount > this.toCall && betAmount !== player.stack) {
      let raiseAmt = betAmount-this.toCall;
      if(raiseAmt < this._tableConfig.bigBlind){
        this.sendError(guid, `Bet of ${this.getDisplayAmt(betAmount)} is invalid. The minimum bet or raise must be at least the big blind of ${this.getDisplayAmt(this._tableConfig.bigBlind)}`);
        return;
      }else if(raiseAmt < this.lastRaise){
        this.sendError(guid, `Bet of ${this.getDisplayAmt(betAmount)} is invalid. A raise must be at least the size of the largest previous bet or raise (${this.getDisplayAmt(this.lastRaise)})`);
        return;
      }
    }

     this.clearPlayerTimer();     
     let priorBet = this.toCall + player.bet;
     player.setBet(betAmount);
     player.myturn = false;
     player.hasCalled = betAmount === this.toCall;
     player.hasRaised = betAmount > this.toCall;
     this.lastRaise = betAmount - this.toCall;
     this.resetAutoAction(player);     

     if (player.hasRaised)
       this.lastToActIndex = this.getPriorPlayerIndex(this.playerNextToActIndex);

     let data = new DataContainer();
     let action: string = betAmount > 0 ? 'bet' : 'check';
     this.auditEvents.push(new TableAuditEvent(player.guid, action, betAmount));
     let chipsToPot: boolean = null;
     let nextPlayer:PlayerTableHandle;
     let isValidAutoAction:boolean;
     if (this.shouldStartNextStreet()) {
       chipsToPot = true;
       this.startNextStreet(data, player);
     } else {
       this.incrementPlayerNextToActIndex(this.playerNextToActIndex, this.currentPlayers);
       nextPlayer = this.currentPlayers[this.playerNextToActIndex];
       
       data.tableSeatEvents = new TableSeatEvents(this.tableId);
       data.tableSeatEvents.seats.push(player.toTableSeatEvent());
       
       if (betAmount < this.toCall)
        this.toCall = priorBet - nextPlayer.bet;
       else
         this.toCall = player.bet - nextPlayer.bet;

         isValidAutoAction = this.pushNextPlayerAction(nextPlayer, data);
       
     }

     this.gameState.pots[0].amount += betAmount;
     this.handlePostBetOrFold(data, action, chipsToPot, nextPlayer, isValidAutoAction);
   }

   private getDisplayAmt(amount:number) : string {
    if(this._tableConfig.currency == Currency.tournament){
      return amount+'';
    } 
    return new Decimal(amount).dividedBy(this.currencyUnit).mul(this._tableConfig.exchangeRate).toFixed(2);
   }

   private pushNextPlayerAction(nextPlayer:PlayerTableHandle, data:DataContainer) : boolean {
    if(nextPlayer.autoFold)
      return true;
    if(nextPlayer.autoCheck){
      if(this.toCall===0){
        return true;
      }else{
        nextPlayer.autoCheck = false;
        this.sendTableOptions(nextPlayer);
      }      
    }
      
    
      nextPlayer.myturn = true;        
    data.tableSeatEvents.seats.push(nextPlayer.toTableSeatEvent());
    this.startPlayerTimeout();
     
    return false;     
  }

   private handlePostBetOrFold(data:DataContainer, action:string, chipsToPot:boolean, nextPlayer:PlayerTableHandle, isValidAutoAction:boolean){
    data.game = this.toGameEvent();
    data.game.action = action;
    data.game.chipsToPot = chipsToPot;
    data.game.street = this.street;
    this.sendDataContainer(data);
    
    if(nextPlayer!=null && isValidAutoAction){
     
     let that = this;
     if(nextPlayer.autoFold || nextPlayer.autoCheck)     {      
      let isFold:boolean = nextPlayer.autoFold === true && this.toCall > 0;      
      let delay = isFold ? 500 : this.getRandomInt(1000,2750);
      this.timerProvider.startTimer(function startAutoFoldTimer() { that.doAutoAction(nextPlayer, isFold);}, delay, this);
      nextPlayer.autoFold=false;
      nextPlayer.autoCheck=false;
     }
    }
   }

   private getRandomInt(min:number, max:number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

   private doAutoAction(handle:PlayerTableHandle, isFold:boolean) {
     if (isFold)
       this.handleFold(handle.guid);
     else
       this.handleBet(0, handle.guid);

     this.sendTableOptions(handle);
   }

   private sendTableOptions(handle:PlayerTableHandle){
    let func = (): DataContainer => {
      let data = new DataContainer();
      data.setTableOptionResult = this.getSetTableOptionResult();
      data.setTableOptionResult.autoFold = handle.autoFold;
      data.setTableOptionResult.autoCheck = handle.autoCheck;
      return data;
    }
    this.sendToSubscriber(handle.guid, func);
   }

   private shouldStartNextStreet(): boolean {
     if (this.playerNextToActIndex === this.lastToActIndex)
       return true;
     if (this.getPlayerNextToActIndex(this.playerNextToActIndex, this.currentPlayers) === -1)
       return true;

     return false;
   }

   private clearPlayerTimer() {
     if (this.playerTimer) {
       clearTimeout(this.playerTimer);
       this.playerTimer = null;
     }
   }

   private startPlayerTimeout() {
     if (!this.tableConfig.timeToActSec || this.tableConfig.timeToActSec <= 0)
       return;
     let that = this;
     let nextToActIndex = this.playerNextToActIndex;
     this.playerTimer = this.timerProvider.startTimer(function startPlayerTimer() {       
       that.handlePlayerTimeout(nextToActIndex);
         },
         this.tableConfig.timeToActSec * 1000, this);
     let playerHandle = this.currentPlayers[this.playerNextToActIndex];
     playerHandle.timerStart = new Date();
     this.playerTimer.guid = playerHandle.guid;
   }

   handlePlayerTimeout(playerIndex: number): void {

     if (playerIndex !== this.playerNextToActIndex)
       return;
     let handle = this.currentPlayers[playerIndex];
     handle.sitOutNextHand = true;
     if (this.toCall > 0)
       this.handleFold(handle.guid);
     else
       this.handleBet(0, handle.guid);
     
     let func = (): DataContainer => {
       let data = new DataContainer();
       data.setTableOptionResult = this.getSetTableOptionResult();
       data.setTableOptionResult.sitOutNextHand = handle.sitOutNextHand;
       return data;
     }
     this.sendToSubscriber(handle.guid, func);     
   }

   private startNextStreet(data: DataContainer, player: PlayerTableHandle) {

     this.toCall = 0;
     this.lastRaise = 0;
     this.playerNextToActIndex = -1;
     this.lastToActIndex = -1;

     if (player) {
       data.tableSeatEvents = new TableSeatEvents(this.tableId);
       data.tableSeatEvents.seats.push(player.toTableSeatEvent());
     }


     let delayedFunc = this.dealCommunityCards;
     let delayMs = this.flopDelaySec * 1000;
     if (!this.street)
       this.street = PokerStreetType.flop;
     else if (this.street === PokerStreetType.flop)
       this.street = PokerStreetType.turn;
     else if (this.street === PokerStreetType.turn)
       this.street = PokerStreetType.river;
     else if (this.street === PokerStreetType.river) {
       this.street = 'showdown';
       delayedFunc = this.handleShowdown;
     }
     
     this.timerProvider.startTimer(delayedFunc.bind(this), delayMs, this);
   }

   private resetAutoActions(){
     for(let handle of this.currentPlayers){
       this.resetAutoAction(handle);
     }
   }

   private resetAutoAction(handle:PlayerTableHandle, warn?:boolean){
    if(handle.autoCheck || handle.autoFold){      
      handle.autoCheck=false;
      handle.autoFold = false;
      this.sendTableOptions(handle);
      if(warn)
        logger.warn(`player ${handle.screenName} is set to autofold or autoCheck. autoFold=${handle.autoFold} autoCheck=${handle.autoCheck}`);
     }
   }

   async handleShowdown() :Promise<void>{
     this.clearPlayerTimer();     
     this.street = null;
     let data = new DataContainer();
     
     data.game = this.toGameEvent();
     data.game.potResults = [];
     
    let combinedPlayers = this.players.filter(p=>p.cumulativeBet > 0 || this.currentPlayers.indexOf(p) > -1);//need to include players who were sat out but paid blinds
    let result:GamePotResult;
    try {
      this.gameState.allocatePots(combinedPlayers);
      result = this.gameState.allocateWinners();
    } catch (e) {
      throw new Error(`allocatePots error: ${e}. combinedPlayers:${JSON.stringify(combinedPlayers)}`);
    }
    
     let dbGame = new DbGameResults();
     dbGame.tableId = this.tableId;
     if(this.tournamentId){
      dbGame.tournamentId = this.tournamentId;
     }
     
     dbGame.currency = this.tableConfig.currency;
     dbGame.smallBlind = this.tableConfig.smallBlind;
     dbGame.bigBlind = this.tableConfig.bigBlind;
     dbGame.tableName = this.tableConfig.name;
     dbGame.exchangeRate = this.tableConfig.exchangeRate;

     let index = 0;
     let gameResultPlayers: GameResultPlayer[] = this.players.map(this.getGameResultPlayer);
     let lastPotHasOnePlayer = result.potResults.length > 1 && this.gameState.pots[result.potResults.length - 1].players.length === 1;
     let lastPotPlayer:PlayerTableHandle = lastPotHasOnePlayer ? <PlayerTableHandle>this.gameState.pots[result.potResults.length - 1].players[0] : null;
     
     for (let r of result.potResults) {
       let potResult = new PotResult();
       let noRake = lastPotHasOnePlayer && index == result.potResults.length - 1;
       
       if(noRake){
        let priorPotResult = data.game.potResults[index-1];
        if(priorPotResult.seatWinners.length==1 && priorPotResult.seatWinners[0] == lastPotPlayer.seat){
          priorPotResult.amount += this.gameState.pots[index].amount;//handles case where user goes all in and their stack exceeds the other players
        }
        
       }else{
        potResult.amount = this.gameState.pots[index].amount;
       }

       potResult.seatWinners = [];
       for (let allocation of r.allocations) {
         let player = this.currentPlayers.find(p => p === allocation.player);
         let rake = 0;
         if (this.tableConfig.rake && !noRake){
          rake = allocation.amount * this.tableConfig.rake / 100;
          rake = Math.round(rake);
         }
           
         

         player.stack += allocation.amount - rake;             
         let gameResultPlayer = gameResultPlayers.find(x => x.guid === player.guid);
         gameResultPlayer.profitLoss += allocation.amount - rake;                  
         gameResultPlayer.stack = player.stack;
         gameResultPlayer.rake += rake;
         
         potResult.seatWinners.push(player.seat);
         if (!potResult.winningHand && r.playerHandEvaluatorResults.length) {
          let handEvaluatorResult:HandEvaluatorResult = r.playerHandEvaluatorResults.find(evalResult => evalResult.player === allocation.player); 
          potResult.winningHand = handEvaluatorResult.handRankEnglish;
           potResult.bestHandCards = handEvaluatorResult.bestHandCards;
         }           
       }
       dbGame.potResults.push(this.getDbPotResult(r));

       if (!noRake){
        data.game.potResults.push(potResult);
       }
       
       index++;
     }

     for(let potResult of data.game.potResults){
      potResult.amountFormatted = this.getWinAmount(potResult.amount);
     }

     dbGame.auditEvents = this.auditEvents;
     dbGame.boardCards = this.gameState.boardCards;
     dbGame.players = gameResultPlayers;
     
     await this.dataRepository.saveGame(dbGame);
     let temp = await this.dataRepository.saveTableStates([ this.getTableState() ]);
     if(!this.tournamentId){
      await this.dataRepository.updateTableBalances(this.tableId, this.tableConfig.currency, this.players.map(p => new UserTableAccount(p.guid, p.screenName, p.stack)));
     }
     

     let remainingPlayers = this.currentPlayers.filter(p => !p.hasFolded);

     data.tableSeatEvents = new TableSeatEvents(this.tableId);
     
     for (let p of combinedPlayers){
      p.bet = 0;
      p.cumulativeBet = 0;
     }

     for (let p of this.currentPlayers) {
       let hasFolded = p.hasFolded;
       p.hasFolded = false;
       if (hasFolded)
         p.playing = false;
       p.hasRaised = false;
       p.hasCalled = false;
       
       let seatEvent = p.toTableSeatEvent();
       if (remainingPlayers.length > 1 && !hasFolded)
         seatEvent.playercards = p.holecards;
       data.tableSeatEvents.seats.push(seatEvent);
     }
     this.sendDataContainer(data);
     
     let delay = remainingPlayers.length > 1 ? 5500 : 1500;
     this.timerProvider.startTimer(this.postShowdown.bind(this), delay, this);
    
   }
   

   private getGameResultPlayer(p: PlayerTableHandle) {
     let val = Object.assign(new GameResultPlayer(p.guid, p.screenName, '', p.seat), p);
     val.profitLoss = -p.cumulativeBet;
     val.rake = 0;
     val.gravatar = '';
     return val;
   }



   handleChat(screenName:string, message:string, send:boolean) {
     let chatMessage = new ChatMessage();
     chatMessage.tableId = this.tableId;
     chatMessage.message = message;
     chatMessage.screenName = screenName;
     this.chatMessages.push(chatMessage);
     this.dataRepository.saveChat(chatMessage);
     chatMessage.tableId = undefined;

     let chatMessageResult = new ChatMessageResult();
     chatMessageResult.tableId = this.tableId;
     chatMessageResult.messages.push(chatMessage);

     if (send) {
       let data = new DataContainer();
       data.chatMessageResult = chatMessageResult;
       this.sendDataContainer(data);
     }
     return chatMessageResult;
   }
   



   getWinAmount(amount:number) : string{
      
    let currencyUnit = CurrencyUnit.getCurrencyUnit(this.tableConfig.currency);
    let val = new Decimal(amount).dividedBy(currencyUnit).mul(this.tableConfig.exchangeRate)
      .round(2).toFixed(2);
    let prefix = this.tableConfig.currency == Currency.tournament ? '' : '$';
    return prefix + numberWithCommas(val);
   }




   private getDbPotResult(potResult: TexasHoldemGameState_PotResult): DbPotResult {
     var result = new DbPotResult();
     for (let allocation of potResult.allocations) {
       let dbAllocation = new DbPlayerAllocationResult();
       dbAllocation.player = { guid: (<PlayerTableHandle>allocation.player).guid };
       dbAllocation.amount = allocation.amount;
       result.allocations.push(dbAllocation);
     }
     for (let handEvaluatorResult of potResult.playerHandEvaluatorResults) {
       let dbHandEvaluatorResult = new DbHandEvaluatorResult();      
       dbHandEvaluatorResult.bestHand = handEvaluatorResult.bestHand;
       dbHandEvaluatorResult.handRank = handEvaluatorResult.handRank;
       dbHandEvaluatorResult.handRankEnglish = handEvaluatorResult.handRankEnglish;
       dbHandEvaluatorResult.score = handEvaluatorResult.score;
       dbHandEvaluatorResult.player = { guid: (<PlayerTableHandle>handEvaluatorResult.player).guid };
       result.playerHandEvaluatorResults.push(dbHandEvaluatorResult);
     }
     return result;
   }

   async postShowdown() : Promise<void> {
     let data = new DataContainer();
     this.gameState = null;
     data.game = this.toGameEvent();
     data.game.action = 'chipsToPlayer';
     data.game.potResults = [];
     data.tableSeatEvents = new TableSeatEvents(this.tableId);     

     let bustedPlayers:PlayerTableHandle[] = [];
     
     for (let i = this.players.length - 1; i >= 0; i--) {
       let player = this.players[i];
       if ((!this.tournamentId && player.stack < this.tableConfig.bigBlind) || player.stack == 0) {
         await this.leaveTableInternal(player, false);
         bustedPlayers.push(player);         
       }
       
       player.playing = false;
       player.holecards = null;
       if(player.sitOutNextHand && !player.isSittingOut){
        player.isSittingOut = player.sitOutNextHand;
        player.sittingOutSince = new Date();
       }
              
       let seatEvent = player.toTableSeatEvent();
       seatEvent.playercards = null;
       
       data.tableSeatEvents.seats.push(seatEvent);
     }
     
     this.pastPlayers.push(this.currentPlayers.map(h=>new SeatHistory(h.guid, h.seat)));
     this.pastPlayers = _.takeRight(this.pastPlayers, this.tableConfig.maxPlayers);
     this.currentPlayers = null;
     
     this.sendDataContainer(data); 
                
      let handled = false;
       if (this.onPostShowdown != null) {
         const postShowdownEvent = new PostShowdownEvent(this);
         postShowdownEvent.bustedPlayers = bustedPlayers;
         await this.onPostShowdown(postShowdownEvent)
         handled = postShowdownEvent.handled;
       }
       if (this.shutdownRequested) {
        this.broadcastShutdown();
      } else{
        if (!handled) {
          if (this.getPlayersForNextHand().length >= this.minNumPlayers) {
            this.handleGameStartingEvent();
          }
        }
      }
   }

   sendLeaveTable(user:UserSmall){
    let tMessage = new TableProcessorMessage(this);
    tMessage.leaveTable = user;
    this.processor.sendMessage(tMessage);      
   }
   async leaveTable(guid:string): Promise<any>{
    let handle = this.players.find(p=>p.guid==guid);
    if(handle){
      return this.leaveTableInternal(handle, true);
    }
   }

   async leaveTableInternal(player: PlayerTableHandle, broadcastRemovedPlayer:boolean=true): Promise<any> {
     this.removePlayer(player);
     if (broadcastRemovedPlayer)
      this.broadcastPlayer(player);
     this.broadcastTableConfigUpdate();

     if(!this.tournamentId){
      await this.removeTableBalance(player.guid);
      if(player.stack > 0){
       await transferTableBalance(player.guid, player.stack, this.tableConfig.currency, this.dataRepository, `table ${this.tableConfig.name}`);
      }

      await this.relayUserData(player.guid)
     }
   }

   private broadcastTableConfigUpdate(){
    this.broadcastService.broadcast(this.getTableConfigUpdate());
   }

   getTableConfigUpdate(): DataContainer {
     let data = new DataContainer();
     this.setTableConfigUpdate(data);
     return data;
   }
   
   
   private setTableConfigUpdate(data:DataContainer): void {
    data.tableConfigs = new TableConfigs();
    data.tableConfigs.rows = [];
    let tableConfig:TableViewRow = new TableViewRow();
    tableConfig._id = this.tableId;    
    tableConfig.exchangeRate = this.tableConfig.exchangeRate;
    tableConfig.smallBlind = this.tableConfig.smallBlind;
    tableConfig.bigBlind = this.tableConfig.bigBlind;
    tableConfig.numPlayers = this.getPlayerCount();
    data.tableConfigs.rows.push(tableConfig);      
  }

   private async relayUserData(guid:string) : Promise<void> {
     
     let subscriber = this.subscribers.find(s => s.user.guid === guid);
     if (subscriber != null){
      let user: User = await this.dataRepository.getUser(guid)
      let userData = await getUserData(user, this.dataRepository, false);
       let data = new DataContainer();  
       data.user = userData;
       subscriber.send(data);
     }
   }

   removeTableBalance(userGuid:string): Promise<any> {
     return this.dataRepository.removeTableBalance(this.tableId, userGuid)
       .then((updateResult: any) => {
         if (updateResult.result.nModified !== 1) {
           throw new Error(`removeTableBalance: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${userGuid} for table ${this.tableId}`);
         }
       });
   }

   removePlayer(player: PlayerTableHandle) {
     removeItem(this.players, player);    
     player.empty = true;
     player.isSittingOut = false;
   }



   private broadcastPlayer(player: PlayerTableHandle, excludePlayer:boolean=false) {
     
     let data = new DataContainer();
     data.tableSeatEvents = new TableSeatEvents(this.tableId);
     let seatEvent = player.toTableSeatEvent();
     data.tableSeatEvents.seats.push(seatEvent);
     if(excludePlayer){
      for (let subscriber of this.subscribers.filter(s=>s.user.guid!== player.guid)) {
        subscriber.send(data);
      }
     }else{
      this.sendDataContainer(data);
     }     
   }

   dealCommunityCards() {
    this.resetAutoActions(); 
    let moreThanOnePlayerLeft = this.currentPlayers.filter(this.playerCanAct.bind(this)).length > 1;
     if (moreThanOnePlayerLeft) {      
      
      
      let lastToAct:PlayerTableHandle = this.currentPlayers.find(p => p.seat === this.dealerSeat)
      if(!lastToAct){
        lastToAct = this.getNextPlayerWherePlayerIsPlaying(this.dealerSeat, this.players, true);
      }
      this.lastToActIndex = this.currentPlayers.indexOf(lastToAct)
      
       if (this.currentPlayers[this.lastToActIndex].hasFolded)
         this.lastToActIndex = this.getPriorPlayerIndex(this.lastToActIndex);

       if (this.currentPlayers.length === 2) {
         this.playerNextToActIndex = this.lastToActIndex === 0 ? 1 : 0;
       } else {
         this.incrementPlayerNextToActIndex(this.lastToActIndex, this.currentPlayers);
       }
     }

     this.firstToActIndex = this.playerNextToActIndex;
     let data = new DataContainer();
     data.deal = new DealHoleCardsEvent(this.tableId);
     if (this.street === PokerStreetType.flop) {
       this.gameState.boardCards = [this.deck.getNextCard(), this.deck.getNextCard(), this.deck.getNextCard()];
     } else if (this.street === PokerStreetType.turn || this.street === PokerStreetType.river) {
       this.gameState.boardCards.push(this.deck.getNextCard());
     }
     data.deal.board = this.gameState.boardCards;
     let player = this.currentPlayers[this.playerNextToActIndex];
     data.tableSeatEvents = new TableSeatEvents(this.tableId);
     for (let p of this.players) {
       if(p.bet > 0 || this.currentPlayers.indexOf(p) > -1){
        p.myturn = player === p;
        p.hasRaised = false;
        p.hasCalled = false;
        p.bet = 0;
        let seatEvent = p.toTableSeatEvent();
        if(!moreThanOnePlayerLeft && !p.hasFolded){
          seatEvent.playercards = p.holecards;//players are all in
        }
        
        data.tableSeatEvents.seats.push(seatEvent);
       }        
     }

     if (moreThanOnePlayerLeft)
       this.startPlayerTimeout();
     else
       this.startNextStreet(data, player);

     this.sendDataContainer(data);
   }

   private sendError(guid: string, errorMessage: string) {
     let func = () : DataContainer => {
       let data = new DataContainer();
       data.error = new PokerError();
       data.error.message = errorMessage;
       return data;
     }

     this.sendToSubscriber(guid, func);
   }

   private sendToSubscriber(guid: string, func:() => DataContainer) {
     let subscriber = this.subscribers.find(s => s.user.guid === guid);
     if (subscriber != null) {
       let data = func();
       subscriber.send(data);
     }
   }

   handleSetTableOptionRequest(setTableOptionRequest: SetTableOptionRequest, guid:string) {
     let data = new DataContainer();
     data.setTableOptionResult = this.getSetTableOptionResult();

     let player = this.players.find(p => p.guid === guid);
     if (player != null) {
       
      if(setTableOptionRequest.sitOutNextHand != null && (player.sitOutNextHand != setTableOptionRequest.sitOutNextHand || player.isSittingOut != setTableOptionRequest.sitOutNextHand)){
        let sittingBackIn = (player.sitOutNextHand || player.isSittingOut) && !setTableOptionRequest.sitOutNextHand;
        player.sitOutNextHand = setTableOptionRequest.sitOutNextHand;
        if (!this.currentPlayers || this.currentPlayers.indexOf(player) === -1) {
          player.isSittingOut = player.sitOutNextHand;
          if (player.isSittingOut)
            player.sittingOutSince = new Date();
        }         
 
        data.setTableOptionResult.sitOutNextHand = player.sitOutNextHand;
        if (sittingBackIn) {
          this.checkGameStartingEvent();
          player.sittingOutSince = null;
        }
 
        this.broadcastPlayer(player);
      }
      
      if(setTableOptionRequest.autoFold != null || setTableOptionRequest.autoCheck){
        let autoOptionResult:AutoOptionResult = CommonHelpers.allowAutoFold(guid, this.currentPlayers);
        if(setTableOptionRequest.autoFold != null){
          if(!setTableOptionRequest.autoFold){//always allow uncheck
            player.autoFold = false;          
          }
          else if(this.currentPlayers && setTableOptionRequest.autoFold === true && player.autoFold != setTableOptionRequest.autoFold && autoOptionResult.allowAutoFold){                
            player.autoFold = true;          
          }
          data.setTableOptionResult.autoFold = player.autoFold; 
        }

        if(setTableOptionRequest.autoCheck != null){
          if(!setTableOptionRequest.autoCheck){//always allow uncheck
            player.autoCheck = false;          
          }
          else if(this.currentPlayers && setTableOptionRequest.autoCheck === true && player.autoCheck != setTableOptionRequest.autoCheck && autoOptionResult.allowAutoCheck){                
            player.autoCheck = true;          
          }
          data.setTableOptionResult.autoCheck = player.autoCheck; 
        }
      }
                  
     }
     this.sendToSubscriber(guid, ()=> data);
   }
   
   

   private getSetTableOptionResult() {
     let result = new SetTableOptionResult();
     result.tableId = this.tableId;
     return result;
   }

   findPlayer(guid: string): PlayerTableHandle {
     return this.players.find(p => p.guid === guid);
   }

   updateScreenName(guid: string, screenName: string, gravatar:string): void {
     let player = this.findPlayer(guid);
     if (player) {
       player.screenName = screenName;
       player.gravatar = gravatar;

       let data = new DataContainer();
       data.tableSeatEvents = new TableSeatEvents(this.tableId);
       let seatEvent = player.toTableSeatEvent();
       seatEvent.avatar = gravatar || '';
       data.tableSeatEvents.seats.push(seatEvent);
       for (let subscriber of this.subscribers) {
         subscriber.send(data);         
       }
     }
   }

   getPlayerCount(): number {
     return this.players.length;
   }   

   promiseResolve: any;
   shutdown() : Promise<void> {
     this.shutdownRequested = true;
     return new Promise<void>((resolve, reject) => {

       this.promiseResolve = resolve;
       if (!this.currentPlayers) {
         this.broadcastShutdown();
       }                
     });
     
   }

   
   getPlayersToEvict(): PlayerTableHandle[] {
     let now = new Date();
     let handles : PlayerTableHandle[] = [];
     for(let player of this.players) {
       if (player.isSittingOut) {
         if (this.currentPlayers && this.currentPlayers.indexOf(player) !== -1) {
           logger.warn(`player${player.guid} isSittingOut=${player.isSittingOut} however they are currently playing `);
           continue;
         }
         let secIdle = Math.round((now.getTime() - player.sittingOutSince.getTime()) / 1000);
         if (secIdle >= this.idleTimeSec) {
           handles.push(player);
         }                  
       }
     }
     return handles;
   }

   async checkIdlePlayers() : Promise<PlayerTableHandle[]> {
    
    let playerHandles = this.getPlayersToEvict();
    for (let handle of playerHandles) {
      logger.info(`removing player ${handle.screenName} from table ${this.tableId} due to idleness`);
      await this.leaveTableInternal(handle);
    }
    return playerHandles;    
  }

   getTableState(): TableState {
     let state = new TableState();
     if(this.tableConfig._id){
      state._id = this.tableId;
     }
     
     state.tournamentId = this.tournamentId;
     state.dealerSeat = this.dealerSeat;
     state.players = this.players.map(p=> new PlayerTableState(p));
     return state;
   }

  
  sendTableProcessorMessage(message:TableProcessorMessage) : Promise<TableProcessorResult>{
    return this.processor.sendMessage(message)
  }
 }

 











  
  

