import { RegisterResult } from './shared/signup-request';
import { autoinject,computedFrom } from "aurelia-framework";
import { Compose } from 'aurelia-templating-resources';
import { DialogService, DialogController, DialogOpenResult } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import { ApiService } from './lib/api-service';
import { Util } from './lib/util';
import { Seat } from "./seat";
import { CashOut } from "./cash-out";
import { SitDownAction, TableConfigUpdated, DataMessageEvent, OpenTableAction, ConnectionClosedEvent, OpenLoginPopupEvent, SetBettingControlsEvent, TournamentRegisterClickEvent, DepositNowEvent } from "./messages";
import { FundingWindow, FundingWindowModel } from "./funding-window";
import {Constants} from "./lib/constants";
import * as $ from 'jquery';
import {Chip} from "./model/chip";
import { Simulations } from "./simulations";
import { CashOutRequestResult, PotResult, FundAccountResult, AccountFunded, AccountWithdrawlResult, SetTableOptionResult,
  GetAccountSettingsResult, SetAccountSettingsResult, ChatMessage, GlobalChatResult, ChatMessageResult, UserData, Account,
  GlobalUsers, LeaderboardResult, TransferFundsResult, ExchangeRateResult, TournamentSubscriptionResult, SubscribeTableResult, GameEvent, GameStartingEvent, PaymentHistoryResult, Version, TableSeatEvents, DealHoleCardsEvent, TableClosed, DataContainer, TableConfigs } from "./shared/DataContainer";
import {AccountSettings} from "./account-settings";
import {MessageWindow} from "./message-window";
import {ClientMessage, SetTableOptionRequest, TournamentSubscriptionRequest, GlobalChatRequest, Ping, ListTablesRequest, JoinTableRequest, LeaveTableRequest, ChatRequest, ExchangeRatesRequest, TournamentRegisterRequest } from "./shared/ClientMessage";
import { CommonHelpers, getCardSuit } from './shared/CommonHelpers';
import { AutoOptionResult } from "./shared/AutoOptionResult";
import environment from './environment';
import { LoginPopup } from "./login-popup";
import { LoginResult, LogoutResult } from "./shared/login-request";
import { Router } from 'aurelia-router';
import { Decimal } from './shared/decimal';
import { ForgotResult } from './shared/forgot-request';
import { TableViewRow } from './shared/TableViewRow';
import { TournamentResultPopup } from './tournament-result-poup';
import { Currency, CurrencyUnit } from './shared/Currency';
import { TournamentInfoResult } from './shared/TournamentInfoRequest';
import { TournamentResultView } from './shared/TournamentResultView';
import { NextBlind } from './shared/NextBlind';
import { PotResultChatSummary } from './model/PotResultChatSummary';
import { TournamentInfoPopup } from './tournament-info-poup';
import { RegisterTournamentPopup, RegisterTournamentPopupViewModel } from './register-tournament-popup';

@autoinject()
export class PokerTable {  
  apiService: ApiService;
  seats: Seat[] = [];
  statusLabel: string = '';

  isLoadingTable: boolean=true;
  playerStack: number;
  private playerSeat: number;
  private sendingSittingBackIn: boolean;
  private playerSitting: boolean;
  private isTournament: boolean;
  smallBlind:number;
  bigBlind:number;
  
  private seat: Seat;
  private showAutoFold: boolean;
  private showAutoCheck: boolean;
  private autoFoldButtonText: string;
  private tableOptions:SetTableOptionResult = new SetTableOptionResult();

  tableName: string;
  potAmount: number;
  game: GameEvent = new GameEvent(null);
  gameStarting: GameStartingEvent = new GameStartingEvent(null);
  potChips: Chip[] = [];
  chatMessages: any[] = [];
  chatboxElem:any;
  isCurrencyCrypto: boolean;
  currency:string;
  subscriptions: { dispose: () => void }[] = [];
  shutdownRequested: boolean;
  userData: UserData;
  playChatSound: boolean = true;
  nextBlinds:{smallBlind:number, bigBlind:number, timeUntil:number, timeUntilUnit:string};  
  blindsTimer:number;  
  nextBlindIncrease:Date;
  
  constructor(apiService: ApiService, private dialogService: DialogService, private ea: EventAggregator, private util: Util, private constants: Constants, private dialogController: DialogController, private router: Router) {
    this.apiService = apiService;
    
    //this.apiService.loadSounds();
    for (let i = 0; i < 9; i++) {
      this.seats.push(new Seat(this.ea, util, this.constants, i, this.apiService));
    }
    //console.log(new Decimal('0.01').add(new Decimal('0.02')).toString());
    //this.game = new Game();
    //this.game.potResults = [];    
    //this.game.potResults.push({ seatWinners: [5, 9], winningHand : '3 of a Kind'});

    this.subscriptions.push(ea.subscribe(SitDownAction, msg => { this.join(msg.seatIndex); }));
    this.subscriptions.push(ea.subscribe(DataMessageEvent, msg => { this.onMessage(msg.data); }));
    this.subscriptions.push(ea.subscribe(OpenTableAction, msg => { this.onOpenTableAction(msg.tableId); }));
    this.subscriptions.push(ea.subscribe(ConnectionClosedEvent, msg => { this.onConnectionClosed(); }));
    this.subscriptions.push(ea.subscribe(OpenLoginPopupEvent, msg => { this.openLoginWindow(msg); }));    
    this.subscriptions.push(ea.subscribe(TournamentRegisterClickEvent, msg => { this.onTournamentRegisterClickEvent(msg); }));    
    this.subscriptions.push(ea.subscribe(DepositNowEvent, msg => { this.openFundingWindow(msg.model); }));    
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
    this.apiService.close();
    window.clearInterval(this.pingTimer);
  }

  activate(params, routeConfig) {
  }
  attached() {
    this.apiService.openWebSocket(() => { this.onopen() });       
    //new Simulations(this.ea).test();    
    //this.dialogService.open({ viewModel: CashOut, lock: false });
    //this.dialogService.open({ viewModel: AccountSettings, lock: false });
     
     //let model = new FundingWindowModel();
    //model.tableConfig = this.util.tableConfigs.find(c=>c.currency=='btc');    
    //model.seatnum = 3;    
     //this.openFundingWindow(model);
    // window.onresize = (e) => { this.setLeaderboardPosition(); }
    // this.setLeaderboardPosition();
    // setTimeout(()=>{
    //   this.notifyFunded(10000000, 'dash')
    // }, 1500)
  }

  onTournamentRegisterClickEvent(event: TournamentRegisterClickEvent): void {
    let tournament = event.tournament;
    if (tournament.registering)
      return;
    if (this.apiService.authenticated) {
      
      let sendRequest = ()=>{
        tournament.registering = true;
        this.apiService.send(new TournamentRegisterRequest(tournament.id));
      }

      if(tournament.buyIn){
        let view = new RegisterTournamentPopupViewModel();
        let account = this.util.user.accounts.find(acc=>acc.currency==tournament.currency);
        view.isFunded = account != null && new Decimal(account.balance).greaterThanOrEqualTo(new Decimal(tournament.buyIn).mul(CurrencyUnit.getCurrencyUnit(tournament.currency)));
        view.tournament = tournament;
        this.dialogService.open({ viewModel: RegisterTournamentPopup, model: view }).whenClosed(response => {
          if (!response.wasCancelled) {
            sendRequest(); 
          }
        });
      }else{
        sendRequest();
      }
      
    } else {
      let event = new OpenLoginPopupEvent(true);
      event.tournamentId = tournament.id;
      this.openLoginWindow(event);
      //this.dialogService.open({ viewModel: MessageWindow, model: 'You must first create an account to play tournaments', lock: false });
    }
  }

  setLeaderboardPosition(){
    // console.log(`onresize clientWidth: ${document.body.clientWidth} clientHeight:${document.body.clientHeight}`, e);
    if(document.body.clientWidth >= 1550 && !$('#leaderboard-lhs').children().length){      
      $("#leaderboard-container").detach().appendTo("#leaderboard-lhs");
    }else if(document.body.clientWidth < 1550 && !$('#leaderboard-rhs').children().length){      
      $("#leaderboard-container").detach().appendTo("#leaderboard-rhs");
    }
  }

  pingTimer:number;
  wsAlive:boolean;
  pingStartDate:Date;
  pingTime:number;
  isConnected:boolean;

  onopen() {
    console.log("opened " + this.apiService.wsURI);             
    this.wsAlive=true;    
    this.isConnected = true;     
  }



  sendPing(){
    if(!this.wsAlive){
      window.clearInterval(this.pingTimer);
      console.log('no response to ping. closing connection');
      this.apiService.close();
      this.apiService.openWebSocket(() => { this.onopen() });
    }else{
      this.wsAlive=false;      
      this.pingStartDate = new Date();
      this.apiService.send(new Ping());
      this.pingTimer = window.setTimeout(() => { this.sendPing()}, 20000);    
    }    
  }

  handleServerPong() {
    this.wsAlive=true;
    this.pingTime = new Date().getTime() - this.pingStartDate.getTime();    
  }
  onConnectionClosed() {    
    this.isConnected = false;
    this.util.setCurrentTableId(null);     
    this.util.tableConfigs = [];
    this.clear();
    this.pingTime = null;
    this.isLoadingTable = true;
    window.clearInterval(this.pingTimer);
  }


  clear() {        
    this.sendingSittingBackIn = false;   
    this.playerSeat = null;
    this.playerSitting = null;
    this.tableOptions = new SetTableOptionResult();
    this.seat = null;
    this.tableName = null;
    this.smallBlind = null;
    this.bigBlind = null;
    this.setStatusLabel();
    this.potChips = [];
    this.chatMessages = [];
    this.isCurrencyCrypto = false;
    this.currency = '';
    this.game = new GameEvent(null);
    this.gameStarting = new GameStartingEvent(null);
    this.potAmount = 0;
    this.playerStack = 0;
    for (let seat of this.seats) {
      seat.init();      
    }

    this.setBettingControls();
    this.setShowAutoFold();
    this.clearBlinds();
  }

  clearBlinds(){    
    window.clearInterval(this.blindsTimer);
    this.nextBlindIncrease = null;
    this.nextBlinds = null;    
  }

  setBettingControls() {
    this.ea.publish(new SetBettingControlsEvent(this.seat, this.game));
  }

  showWarning(message: string) {
    this.dialogService.open({ viewModel: MessageWindow, model: message, lock: false });
  }

  onOpenTableAction(tableId: string) {
    if (this.util.currentTableId === tableId) {
      this.showWarning('You are currently viewing this table!');
      
      return;
    }
    if (this.playerSitting) {
      this.showWarning('You are currently sitting! Please leave the table to view a different table');
      return;
    }
    this.clear();
    this.isLoadingTable = true;
    this.apiService.subscribeToTable(tableId);    
  }

  onMessage(message) {    
    
    //message = JSON.parse(message);    

    if (message.subscribeTableResult) {
      this.clear();
    }

    var handlers = [      
      { key: 'version', handler: this.handleVersion },
      { key: 'user', handler: data => { this.handleUser(message)} },
      { key: 'tableConfigs', handler: this.tableConfigsHandler },
      { key: 'subscribeTableResult', handler: this.handleSubscribeTableResult },
      { key: 'game', handler: this.handleGame },
      { key: 'tableSeatEvents', handler: this.handleSeats },      
      { key: 'deal', handler: this.handleDeal},      
      { key: 'chatMessageResult', handler:this.handleChat},
      { key: 'fundAccountResult', handler: (data: FundAccountResult) => { this.ea.publish(Object.assign(new FundAccountResult(), data)); } },
      { key: 'globalChatResult', handler: (data: GlobalChatResult) => { this.ea.publish(Object.assign(new GlobalChatResult(), data)); } },
      { key: 'globalUsers', handler: (data: GlobalUsers) => { this.ea.publish(Object.assign(new GlobalUsers(), data)); } },
      { key: 'accountFunded', handler: this.handleAccountFunded},      
       { key: 'gameStarting', handler: this.handleGameStarting},
       { key: 'accountWithdrawlResult', handler: this.handleAccountWithdrawlResult },
      { key: 'cashOutRequestResult', handler: (data: CashOutRequestResult) => { this.ea.publish(Object.assign(new CashOutRequestResult(), data));} },      
      { key: 'setTableOptionResult', handler: this.handleSetTableOptionResult},
      { key: 'error', handler: this.handleError },
      { key: 'accountSettings', handler: (data: GetAccountSettingsResult) => { this.ea.publish(Object.assign(new GetAccountSettingsResult(), data))} },
      { key: 'setAccountSettingsResult', handler: (data: SetAccountSettingsResult) => { this.ea.publish(Object.assign(new SetAccountSettingsResult(false,""), data)); } },
      { key: 'tableClosed', handler: this.handleTableClosed },
      { key: 'leaderboardResult', handler: (data: LeaderboardResult) => { this.ea.publish(Object.assign(new LeaderboardResult(), data)); } },
      { key: 'transferFundsResult', handler: (data: TransferFundsResult) => { this.ea.publish(Object.assign(new TransferFundsResult(), data)); } },
      { key: 'exchangeRates', handler: (data: ExchangeRateResult) => { this.ea.publish(Object.assign(new ExchangeRateResult(), data)); } },
      { key: 'registerResult', handler: (data: RegisterResult) => { this.ea.publish(Object.assign(new RegisterResult(), data)); } },
      { key: 'tournamentSubscriptionResult', handler: (data) => { this.ea.publish(Object.assign(new TournamentSubscriptionResult(), data)); } },
      { key: 'loginResult', handler: this.handleLoginResult },
      { key: 'logoutResult', handler: this.handleLogout },
      { key: 'pong', handler: (data) => { this.handleServerPong()} },
      { key: 'forgotResult', handler: (data) => { this.ea.publish(Object.assign(new ForgotResult(), data)); } },
      { key: 'tournamentResult', handler: (data) => { this.handleTournamentResult(data); } },
      { key: 'paymentHistoryResult', handler: (data) => { this.ea.publish(Object.assign(new PaymentHistoryResult(), data)); } },
      { key: 'tournamentInfoResult', handler: (data) => { this.ea.publish(Object.assign(new TournamentInfoResult(), data)); } },
      { key: 'duplicateIpAddress', handler: (data) => { this.handleDuplicateIpAddress(); } },
    ];
    

    let handled = false;
    for (let handler of handlers) {
      let data = message[handler.key];
      if (data) {
        handled = true;
        //console.log('handling ' + handler.key, data);
        handler.handler.call(this, data);

      }
    }
    if (!handled) {
      console.error(`last message had no handler! ${JSON.stringify(message)}`);
    }
  }

  handleDuplicateIpAddress(){    
    this.router.navigate('duplicate-ip');
  }

  handleTournamentResult(view:TournamentResultView){
    
    this.dialogService.open({ viewModel: TournamentResultPopup, model: view, lock: false });
    
  }

  handleLoginResult(result:LoginResult){
    if(result.success){
      this.apiService.setAuth(result.sid);
      localStorage.setItem("sid", result.sid);      
    }
    this.ea.publish(Object.assign(new LoginResult(), result))
  }

  handleVersion(result:Version){
    let priorVersion = localStorage.getItem("app_version");
    localStorage.setItem("app_version", result.version);
    if(priorVersion && priorVersion != result.version){        
      console.log(`version change detected from ${priorVersion} to ${result.version}. Reloading page...`);
      location.reload();
      return;
    }else{
      this.apiService.version = result;
      document.title = `${result.appName} | Online Crypto Poker`;
      let message = new ClientMessage();
      message.listTablesRequest = new ListTablesRequest();
      message.exchangeRatesRequest = new ExchangeRatesRequest();
      message.tournamentSubscriptionRequest = new TournamentSubscriptionRequest();
      message.globalChatRequest = new GlobalChatRequest(undefined, true);
      this.apiService.sendMessage(message);      
      if(!environment.debug) {
        this.sendPing();   
      }
      this.checkRegisterTournament();
    }
  }

  checkRegisterTournament(){
    let tournamentId = localStorage.getItem("registerForTournamentId");
    if(tournamentId){
      console.log('registering for tournamentId', tournamentId);
      localStorage.removeItem("registerForTournamentId");
      this.apiService.send(new TournamentRegisterRequest(tournamentId));
    }
  }

  handleLogout(){
    this.dialogService.closeAll();
    this.apiService.removeAuth();
    localStorage.removeItem("sid");
    localStorage.removeItem("subscribeTableResult");
    this.util.createCookie('guid', '', null);
    this.router.navigateToRoute('logged-out');
  }

  handleTableClosed(tableClosed:TableClosed) {
    if(!this.isCurrentTableId(tableClosed.tableId)){
      return;
    }
    this.shutdownRequested = true;
    this.setStatusLabel();
    this.gameStarting.isStarting = false;
  }

  

  handleSetTableOptionResult(result: SetTableOptionResult) {
    if (!this.isCurrentTableId(result.tableId)) {
      return;
    }
    Object.assign(this.tableOptions, result)
    this.setStatusLabel();
    if (!this.tableOptions.sitOutNextHand) {
      this.sendingSittingBackIn = false;
    }
  }


  handleUser(data:DataContainer) {
    let userData:UserData = data.user;
    if(userData.initialData && !data.loginResult){
      localStorage.setItem("sid", '');//implies bad sid so delete
    }
    if(!userData.accounts){
      userData.accounts = [];
    }
    this.userData = userData;
    this.util.user = userData;
    this.setPlayerStack();              
  }


  handleError(error) {    
    this.showWarning(error.message);
    this.ea.publish(new SetBettingControlsEvent(this.seat, this.game));//this is to reset the controls if it was your turn and stop the UI locking up
  }
  chatboxElemScrollHeight:number;
  handleChat(result: ChatMessageResult) {
    if (result.tableId !== this.util.currentTableId)
      return;    

    if (result.initialData) {
      this.chatMessages = result.messages;
      
      setTimeout(() => {
          this.chatboxElemScrollHeight = this.chatboxElem.scrollHeight;
        },
        250);
    } else {
      for (let message of result.messages){        
        this.chatMessages.push(message);
      }
        
      this.chatboxElemScrollHeight = this.chatboxElem.scrollHeight;
      if (!result.initialData && this.playChatSound)
        this.util.playSound(this.apiService.audioFiles.message);
    }
  }

  scrollSmoothToBottom() {
    var div = this.chatboxElem;
    $(this.chatboxElem).animate({
      scrollTop: div.scrollHeight - div.clientHeight
    }, 500);
  }

  handleDeal(deal:DealHoleCardsEvent) {
    if(!this.isCurrentTableId(deal.tableId)){
      return;
    }
    this.gameStarting.isStarting = false;
    if(!deal.board){
      this.dealcards();//new hand
      this.util.playSound(this.apiService.audioFiles.deal);
    }
      
    
    if (deal.holecards) {
            
      if (deal.holecards.length > 0) {
        window.setTimeout(() => {
          var seat = this.seats.find(s => s.seatIndex === this.playerSeat);
          seat.playercards = deal.holecards;  
          seat.setHoleCards();
          }, 500);
      }      
    }

    this.handleBoardCardAnimation(deal);
  }

  handleBoardCardAnimation(deal) {
    if (deal.board) {
      let cardIndex: number = 0;
      let that = this;
      for (let card of deal.board) {
        if (!this.game.board || this.game.board.indexOf(card) === -1) {
          let $boardCardElem = $('#card-' + cardIndex);
          let onAnimationComplete = () => {
            if (!that.game.board || !that.game.board.length < deal.board.length)
              that.game.board = deal.board;
              that.setBettingControls();
          };
          this.util.dealCard(card, $boardCardElem.css('left'), $boardCardElem.css('top'), this.constants.dealwidth, $boardCardElem.width(), $, 500, this.constants.origin, onAnimationComplete);
        }
        cardIndex++;
      }
    }
  }

  dealcards  () {
    var delay = 100;
    var seats = this.seats.filter(s => s.playing);
    seats = seats.concat(this.seats.filter(s => s.playing));
    //this.setHoleCards(dealTheseCards);
    var that = this;
    for (var k = 0; k < seats.length; k++) {
      window.setTimeout(function () {
          let seat = seats.shift();
          seat.deal();
        },
        delay * k);
    }
  }



  private startingTimer;
  private startTime;  
  private startingIn;
  handleGameStarting (gameStarting:GameStartingEvent) {    
    if(!this.isCurrentTableId(gameStarting.tableId)){
      return;
    }
    this.gameStarting.isStarting = gameStarting.isStarting;
    this.gameStarting.blindsChanging = gameStarting.blindsChanging;
    if (this.gameStarting.isStarting) {
      this.gameStarting.startsInNumSeconds = gameStarting.startsInNumSeconds;
      this.startTime = new Date();

      this.startingTimer = setInterval(() => {
          this.updateStartingIn();
        },
        200);
    }
    if(gameStarting.nextBlind){
      this.updateFromNextBlind(gameStarting.nextBlind);
    }else{
      this.clearBlinds();//on last blind
    }
    this.setStatusLabel();
  }
  updateStartingIn() {

    let msSinceStarted = (new Date().getTime() - this.startTime.getTime());    
    let startingIn = this.gameStarting.startsInNumSeconds * 1000 - msSinceStarted;        
    startingIn = Math.round(startingIn / 1000);
    
    if (startingIn > 0) {
      this.startingIn = startingIn;
      //console.log('startingIn', this.startsInNumSeconds);
    } else {
      clearTimeout(this.startingTimer);
    }
      
  }

  appendWinningHandToChat(potResults: PotResult[]){
    let chatMesage = new ChatMessage();
    chatMesage.screenName = 'Dealer';
    let arr:PotResultChatSummary[] = [];
    for(let potResult of potResults){
      var potResultChatSummary = new PotResultChatSummary();
      potResultChatSummary.text = this.getPotWinnerSummary(potResult);
      if(potResult.bestHandCards && potResult.bestHandCards.length){
        potResultChatSummary.cards = this.getCards(potResult.bestHandCards);
      }
      arr.push(potResultChatSummary);      
    }
    (<any>chatMesage).potResultChatSummaries = arr;

    let chatMessageResult = new ChatMessageResult();
    chatMessageResult.tableId = this.util.currentTableId;
    chatMessageResult.messages = [ chatMesage ];
    this.handleChat(chatMessageResult);
  }

  getCards(hand:string[]) : {suit:string, value:string}[]{
          //let cards = ["10H", "2D", "5S", "KD", "AC"];
      let cardsArr:{suit:string, value:string}[] = [];
      for(let card of hand){
        let suit = card.substring(card.length-1);
        let value = card.substring(0, card.length-1);        
        cardsArr.push({suit:getCardSuit(suit), value: value})
      }
      
      return cardsArr;
  }

  private getPotWinnerSummary(potResult: PotResult) {
    var summary = '';
    if (potResult.seatWinners.length === 1) {
      summary = this.getPlayerScreenName(potResult.seatWinners[0]) + ` won a pot of ${potResult.amountFormatted}!`;
    } else if (potResult.seatWinners.length > 1) {
      summary = `${potResult.amountFormatted} Split Pot : Seats `;
      for (var i = 0; i < potResult.seatWinners.length; i++) {
        summary += this.getPlayerScreenName(potResult.seatWinners[i]);
        if (i !== potResult.seatWinners.length - 1)
          summary += " & ";
      }
    } else {
      console.error('invalid pot result!', JSON.stringify(potResult));
    }
    if (potResult.winningHand){      
     summary += " - " + potResult.winningHand;          
    }
      
    return summary;
  }
  private getPlayerScreenName(seat: number) {
    return this.seats.find(h => h.seatIndex === seat).name;
  }

  openInfo(){
    this.dialogService.open({ viewModel: TournamentInfoPopup, model: { name: '', id: this.util.currentTableConfig.tournamentId }, lock: false });
  }

  handleGame(game:GameEvent) {            
    if(!this.isCurrentTableId(game.tableId)){
      return;
    }
    Object.assign(this.game, game);    
    this.potAmount = game.pot && game.pot.length > 0 ? game.pot[0] : null;
    if(game.potResults){
      this.appendWinningHandToChat(game.potResults);
    }   
    this.setStatusLabel();
    if (game.chipsToPot) {
      this.chipsToPot();
    } else {
      if (game.board && game.board.length)
        this.setPotChips();
      else {
        this.potChips = [];
      }
    }

    this.handleAction(game);

  }

  handleAction(game: GameEvent):void {
    if (!game.action)
      return;
    let action = game.action;

    if (action === 'chipsToPlayer') {

      if(this.game && this.game.potResults){
        for (let potResult of this.game.potResults) {
          for (let winner of potResult.seatWinners) {
            this.seats[winner].chipsToPlayer();
          }
        }
      }
      
      this.returnCards();
      this.game.potResults = [];
      this.game.pot = [];
      this.game.board = [];
      for(let seat of this.seats){
        seat.playercards = null;
      }
    }        
    else if (action === 'fold') {
      this.util.playSound(this.apiService.audioFiles.fold);
    }
    else if (action === 'bet') {
      this.util.playSound(this.apiService.audioFiles.bet);
    }
    else if (action === 'check') {
      this.util.playSound(this.apiService.audioFiles.check);
    }
  }

  returnCards() {
    for (let seat of this.seats) {
      if(seat.playing && !seat.hasFolded)
        seat.returnCards();
    }    
  }


  setPotChips() {
    this.potChips = this.util.getChips(0, this.game.pot[0], this.potChipsFunc, this);
    
  }

  chipsToPot() {
    //console.log('chipsToPot');    
    let args = { 'left': 390, 'top': 280 };
    let speed = 700;
    $.when($('.chip').not('.pot-chip').animate(args, speed)).then(() => {
      //console.log('when callback', new Date());
      this.setPotChips();
    });    
  }


  tableConfigsHandler(data:TableConfigs) {
    let configs: TableViewRow[] = data.rows || [];
    if (!this.util.tableConfigs.length){
      this.util.tableConfigs = configs;
    }
    if(this.util.currentTableConfig != null){
      let updatedConfig = configs.find(t => t._id === this.util.currentTableConfig._id);
      if (updatedConfig != null) {
        Object.assign(this.util.currentTableConfig, updatedConfig);         
      }
    }
    
      

    this.ea.publish(new TableConfigUpdated(configs));
  }

  
  setShowAutoFold():void {    
    
    if(this.seat){
      let autoOptionResult:AutoOptionResult = CommonHelpers.allowAutoFold(this.seat.guid, this.seats);
      this.showAutoFold = autoOptionResult.allowAutoFold;
      this.showAutoCheck = autoOptionResult.allowAutoCheck;
      this.autoFoldButtonText = autoOptionResult.autoFoldButtonText;
    }else{
      this.showAutoFold = false;
      this.showAutoCheck = false;
    }
    
    
    
  }

  



  potChipsFunc (potnum, stacknum, chipnum, quantity) {
    let potChipTop = 276;
    var pot1 = [[360, potChipTop], [342, potChipTop], [378, potChipTop], [324, potChipTop], [396, potChipTop]];
    var pot2 = [[277, 280], [259, 280], [295, 280], [241, 280], [313, 280]];
    var pot3 = [[508, 280], [490, 280], [526, 280], [472, 280], [544, 280]];
    var pots = Array(pot1, pot2, pot3);
    var pot = pots[potnum];
    var bottom_chip = pot[stacknum];
    let chips = [];
    for (var i = 0; i < quantity; i++) {
      var top = bottom_chip[1] - (2 * i);      
      chips.push(this.util.getChip(chipnum, bottom_chip[0], top, 'pot-chip'));
    }
    return chips;
  }


  cashOut() {

    this.dialogService.open({ viewModel: CashOut, lock: false });
  }


  join(seatnum) {        
    this.util.requestNotificationPermission();    
    if(this.apiService.authenticated || (this.util.currentTableConfig!=null && this.util.currentTableConfig.currency==Currency.free)){
      this.openFundingWindow(this.getFundingWindowModel(seatnum));
    }else{
      this.openLoginWindow();
    }
    
  }

  openLoginWindow(event?:OpenLoginPopupEvent){
    this.dialogService.closeAll();
    // this.dialogService.open({ viewModel: LoginPopup });    
    this.dialogService.open({ viewModel: LoginPopup, model: event });    
  }

  getFundingWindowModel(seatnum:number) : FundingWindowModel{
    let model = new FundingWindowModel();
    model.tableConfig = this.util.currentTableConfig
    model.seatnum=  seatnum;
    model.playerStack = this.playerStack;
    return model;
  }

  openFundingWindow(model:FundingWindowModel) {
    

    this.dialogService.open({ viewModel: FundingWindow, model: model }).whenClosed(response => {
      if (!response.wasCancelled) {
        //console.log('response.output', response.output);
        this.sendJoinTable(model.seatnum, response.output);
      }
    });
  }

  sendJoinTable(seatnum:number, amount:number) {
    
    let joinTableRequest = new JoinTableRequest();
    joinTableRequest.seat = seatnum;
    joinTableRequest.tableId = this.util.currentTableId;
    joinTableRequest.amount = amount;
    this.apiService.send(joinTableRequest);
  }

  leaveTable() {
    var seat = this.seats.find(s => s.seatIndex === this.playerSeat);
    if (seat && seat.playing) {
      this.showWarning(`You are still playing at table '${this.util.currentTableConfig.name}'!`);
      return;
    }    

    this.apiService.send(new LeaveTableRequest(this.util.currentTableId));
  }

  handleAccountFunded(data:AccountFunded) {    
    if (data.balance) {
      this.updateBalance(data.currency, data.balance);
      if(data.currency != Currency.free){
        this.notifyFunded(data.paymentReceived, data.currency)
      }      
    }
      
    this.ea.publish(Object.assign(new AccountFunded(), data));
  }
  notifyFunded(amount:number, currency:string){
    this.util.notify(`Your account has been credited with ${this.util.fromSmallest(amount, currency)} ${currency.toUpperCase()}`);    
    this.util.playSound(this.apiService.audioFiles.win)
  }

  handleAccountWithdrawlResult(data:AccountWithdrawlResult) {
    if (data.success) {
      this.updateBalance(data.currency, parseFloat(data.balance));
    }
    this.ea.publish(Object.assign(new AccountWithdrawlResult(), data));
  }

  updateBalance(currency: string, balance: number) {
    let account = this.userData.accounts.find(acc => acc.currency.toLowerCase() === currency.toLowerCase());
    if (account != null)
      account.balance = balance;
    else
      this.userData.accounts.push(new Account(currency, balance));
    this.setPlayerStack();
  }

  handleSubscribeTableResult(result:SubscribeTableResult) {

    localStorage.setItem("subscribeTableResult", JSON.stringify(result));
    this.shutdownRequested = result.shutdownRequested;
    this.util.setCurrentTableId(result.tableId);
    this.util.currentTableConfig = result.tableConfig;
    this.smallBlind = result.tableConfig.smallBlind;
    this.bigBlind = result.tableConfig.bigBlind;
    this.isTournament = result.tableConfig.currency == Currency.tournament;
    let tableConfig = this.util.currentTableConfig;

    this.currency = tableConfig.currency;
    this.isCurrencyCrypto = this.currency && this.currency !== Currency.free && this.currency !== Currency.tournament;    
    this.isLoadingTable = false;
    
    this.tableName = tableConfig.name;    
    this.updateCanSit();
    this.setStatusLabel();
    this.setPlayerStack();
    
    window.clearInterval(this.blindsTimer);
    this.nextBlinds = null;
    if(this.isTournament && result.nextBlind){
      this.updateFromNextBlind(result.nextBlind);
      this.blindsTimer = window.setInterval(()=>{
        let secRemaining = Math.round((this.nextBlindIncrease.getTime() - new Date().getTime())/1000);
        this.updateNextBlinds(secRemaining);
      },200);
    } 
  }

  updateFromNextBlind(nextBlind){
    this.nextBlindIncrease = new Date(new Date().getTime() + nextBlind.remainingSec*1000);    
    this.updateNextBlinds(nextBlind.remainingSec, nextBlind.smallBlind, nextBlind.bigBlind);
  }

  updateNextBlinds(secRemaining:number, smallBlind?:number, bigBlind?:number){
    let timeUntil = secRemaining;
    let timeUntilUnit = 'sec';
    if(secRemaining > 120){
      timeUntil = Math.round(secRemaining/60);
      timeUntilUnit = 'min'
    }
    if(smallBlind != null){
      this.nextBlinds = { smallBlind:smallBlind, bigBlind:bigBlind, timeUntil: timeUntil, timeUntilUnit: timeUntilUnit, };
    }else{
      this.nextBlinds.timeUntil = timeUntil;
      this.nextBlinds.timeUntilUnit = timeUntilUnit;
    }
    
  }

  

  setPlayerStack() {

    if (this.playerSitting) {
      this.playerStack = this.seat.stack;
    } else {
      var tableConfig = this.util.currentTableConfig;
      let account: Account; 
      if (tableConfig != null) {
        account = this.userData.accounts.find(acc => acc.currency.toLowerCase() === tableConfig.currency);
      }

      this.playerStack = account == null ? 0 : account.balance;
    }
  }

  isCurrentTableId(tableId:string):boolean{
    if(tableId != this.util.currentTableId){
      console.warn(`received tableSeatEvents for tableId ${tableId} however the current tableId is ${this.util.currentTableId}`)
      return false;
    }
    return true;
  }
  
  handleSeats(tableSeatEvents:TableSeatEvents) {    
    if(!this.isCurrentTableId(tableSeatEvents.tableId)){
      return;
    }

    let seats = tableSeatEvents.seats;
    this.updateSelf(seats);
    for (let seat of seats) {
      var existingSeat = this.seats.find(s => s.seatIndex === seat.seat);
      let nowEmpty = seat.empty && !existingSeat.empty;
      existingSeat.checkChanges(seat);
      Object.assign(existingSeat, seat);      
      existingSeat.setChips();
      existingSeat.setHoleCards();
      if (nowEmpty){            
        existingSeat.init();
        //console.log(`nowEmpty ${existingSeat.seatIndex} empty ${seat.empty} bet ${existingSeat.bet} chips ${existingSeat.chips}`)
      }
    }
    this.updateCanSit();
    
    this.setStatusLabel();
    this.setBettingControls();
    this.setShowAutoFold();
    if(this.isTournament && !this.seats.filter(s=>!s.empty).length){      
      this.clearBlinds();
    }    
  }

  updateCanSit() {
    for (let seat of this.seats){
      seat.canSit = !this.isTournament && !this.playerSitting && seat.empty;    
    }
      
  }

  setStatusLabel() {
    if (this.shutdownRequested)
      this.statusLabel = 'Table is closed. Server is being restarted';
    else if (this.playerSitting && this.seat && this.seat.isSittingOut)
      this.statusLabel = 'You are currently sitting out.';
    else
      this.statusLabel = this.util.getStatusLabel(this.game, this.playerSitting, this.playerSeat, this.seats, this.gameStarting, this.isTournament);
  }

  lastYourTurnToActNotification:Notification;
  closeLastYourTurnToActNotification(){
    if(this.lastYourTurnToActNotification!=null){
      this.lastYourTurnToActNotification.close();
      this.lastYourTurnToActNotification=null;
    }    
  }
  updateSelf(seats) {
    
    for (let seat of seats) {
      if (seat.guid || this.playerSeat === seat.seat) {
        
        this.playerSitting = !seat.empty;        
        if (seat.empty) {          
          this.tableOptions.sitOutNextHand = false;
          this.playerSeat = null;
          this.seat = null;
        } else {
          let priorMyTurn = this.seat != null && this.seat.myturn;
          if(this.seat==null)
            this.seat = seat;
          else
           Object.assign(this.seat, seat); 
          
          this.playerSeat = seat.seat;
          
          if(!priorMyTurn && seat.myturn){
            this.util.playSound(this.apiService.audioFiles.yourturn);
            if(!document.hasFocus()) {
              this.closeLastYourTurnToActNotification();
              this.util.notify('Your turn to act')
              .then((notification:Notification)=>{                
                this.lastYourTurnToActNotification = notification;
                if(this.lastYourTurnToActNotification){
                  this.lastYourTurnToActNotification.onclick = function(event) { 
                    window.focus();
                    (<Notification>event.target).close();
                   };
                }
              })
              
              
            } 
          }
          else if(priorMyTurn && !seat.myturn){
            this.closeLastYourTurnToActNotification();
          }
      }
          
        this.setPlayerStack();
        break;
      }
    }
    
  }


  sitOutNextHandClicked() {    
    this.sendSitOutNextHandClicked(this.tableOptions.sitOutNextHand);
  }
  imbackClicked(){
    this.sendingSittingBackIn = true;
    this.sendSitOutNextHandClicked(false);
  }

  sendSitOutNextHandClicked(value:boolean) {    
    this.apiService.send(new SetTableOptionRequest(this.util.currentTableId, value))
    this.apiService.loadSounds();
  }

  autoFoldClicked(){
    let autoCheck = null;
    if(this.tableOptions.autoCheck){
      this.tableOptions.autoCheck=false;
      autoCheck = false;
    }
    this.sendSetTableOptionRequest(this.tableOptions.autoFold, autoCheck);
  }

  autoCheckClicked(){
    let autoFold = null;
    if(this.tableOptions.autoFold){
      this.tableOptions.autoFold=false;
      autoFold = false;
    }
    this.sendSetTableOptionRequest(autoFold, this.tableOptions.autoCheck);
  }

  sendSetTableOptionRequest(autoFold?:boolean, autoCheck?:boolean){
    let setTableOptionRequest = new SetTableOptionRequest(this.util.currentTableId);
    if(autoFold != null)
      setTableOptionRequest.autoFold = autoFold;
    if(autoCheck != null)
      setTableOptionRequest.autoCheck = autoCheck;
    this.apiService.send(setTableOptionRequest);
  }

  chatKeyPress(event) {    
    if (event.keyCode === 13) { 
      this.sendChat();      
    }
  }
  chatInput:string;
  sendChat() {
    if (this.chatInput) {
      this.apiService.send(new ChatRequest(this.util.currentTableId, this.chatInput));
      this.chatInput = '';
      this.apiService.loadSounds();
    }    
  }
  
}
