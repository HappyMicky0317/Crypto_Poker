import { ClientMessage } from './ClientMessage';
import { DataContainer } from './DataContainer';

//var protobufjs = require("protobufjs");
import * as protobufjs from 'protobufjs';
var Root  = protobufjs.Root,
    Type  = protobufjs.Type,
    Field = protobufjs.Field;
    

class ProtobufConfig {
  root:any = new Root();
  namespace:any;
  constructor() {
    this.namespace = this.root.define("shared");    
  }
  readonly rounding:number = 6;
  initialized:boolean;
  
  init() : void {
    if(this.initialized)
    return;
    this.addDataContainerMappings();
    this.addClientMessageMappings();

    this.initialized = true;

  }

  addClientMessageMappings() : void{
    {
      let joinTableRequest = new Type("JoinTableRequest");
      joinTableRequest.add(new Field("amount", 1, "int64"));//is deserialized as a string
      joinTableRequest.add(new Field("seat", 2, "int32"));
      joinTableRequest.add(new Field("tableId", 3, "string"));
      this.namespace.add(joinTableRequest);
    }
    {
      let listTablesRequest = new Type("ListTablesRequest");
      this.namespace.add(listTablesRequest);
    }

    {
      let subscribeToTableRequest = new Type("SubscribeToTableRequest");
      subscribeToTableRequest.add(new Field("tableId", 1, "string"));
      subscribeToTableRequest.add(new Field("tournamentId", 2, "string"));
      this.namespace.add(subscribeToTableRequest);
    }

    {
      let exchangeRatesRequest = new Type("ExchangeRatesRequest");
      this.namespace.add(exchangeRatesRequest);
    }

    {
      let globalChatRequest = new Type("GlobalChatRequest");
      globalChatRequest.add(new Field("initialData", 1, "bool"));
      globalChatRequest.add(new Field("message", 2, "string"));
      this.namespace.add(globalChatRequest);
    }

    {
      let tournamentSubscriptionRequest = new Type("TournamentSubscriptionRequest");
      this.namespace.add(tournamentSubscriptionRequest);
    }

    {
      let leaveTableRequest = new Type("LeaveTableRequest");
      leaveTableRequest.add(new Field("tableId", 1, "string"));
      this.namespace.add(leaveTableRequest);
    }

    {
      let loginRequest = new Type("LoginRequest");
      loginRequest.add(new Field("email", 1, "string"));
      loginRequest.add(new Field("password", 2, "string"));
      this.namespace.add(loginRequest);
    }

    {
      let logoutRequest = new Type("LogoutRequest");      
      this.namespace.add(logoutRequest);
    }

    {
      let registerRequest = new Type("RegisterRequest");
      registerRequest.add(new Field("screenName", 1, "string"));
      registerRequest.add(new Field("email", 2, "string"));
      registerRequest.add(new Field("password", 3, "string"));
      registerRequest.add(new Field("confirmPassword", 4, "string"));
      registerRequest.add(new Field("tournamentId", 5, "string"));
      this.namespace.add(registerRequest);
    }

    {
      let forgotRequest = new Type("ForgotRequest");
      forgotRequest.add(new Field("email", 1, "string"));
      this.namespace.add(forgotRequest);
    }

    {
      let foldRequest = new Type("FoldRequest");
      foldRequest.add(new Field("tableId", 1, "string"));
      this.namespace.add(foldRequest);
    }

    {
      let betRequest = new Type("BetRequest");
      betRequest.add(new Field("tableId", 1, "string"));
      betRequest.add(new Field("amount", 2, "int32"));
      this.namespace.add(betRequest);
    }

    {
      let fundAccountRequest = new Type("FundAccountRequest");
      fundAccountRequest.add(new Field("currency", 1, "string"));      
      this.namespace.add(fundAccountRequest);
    }

    {
      let accountWithdrawlRequest = new Type("AccountWithdrawlRequest");
      accountWithdrawlRequest.add(new Field("currency", 1, "string"));
      accountWithdrawlRequest.add(new Field("receivingAddress", 2, "string"));
      accountWithdrawlRequest.add(new Field("amount", 3, "string"));
      this.namespace.add(accountWithdrawlRequest);
    }

    {
      let setTableOptionRequest = new Type("SetTableOptionRequest");
      setTableOptionRequest.add(new Field("tableId", 1, "string"));
      setTableOptionRequest.add(new Field("sitOutNextHand", 2, "bool"));
      setTableOptionRequest.add(new Field("autoCheck", 3, "bool"));
      setTableOptionRequest.add(new Field("autoFold", 4, "bool"));
      this.namespace.add(setTableOptionRequest);
    }

    {
      let chatRequest = new Type("ChatRequest");
      chatRequest.add(new Field("tableId", 1, "string"));
      chatRequest.add(new Field("message", 2, "string"));
      this.namespace.add(chatRequest);
    }

    {
      let cashOutRequest = new Type("CashOutRequest");
      this.namespace.add(cashOutRequest);
    }

    {
      let getAccountSettingsRequest = new Type("GetAccountSettingsRequest");
      this.namespace.add(getAccountSettingsRequest);
    }

    {
      let setAccountSettingsRequest = new Type("SetAccountSettingsRequest");
      setAccountSettingsRequest.add(new Field("screenName", 1, "string"));
      setAccountSettingsRequest.add(new Field("muteSounds", 2, "bool"));
      this.namespace.add(setAccountSettingsRequest);
    }

    {
      let transferFundsRequest = new Type("TransferFundsRequest");
      transferFundsRequest.add(new Field("screenName", 1, "string"));
      transferFundsRequest.add(new Field("currency", 2, "string"));
      transferFundsRequest.add(new Field("amount", 3, "int32"));
      this.namespace.add(transferFundsRequest);
    }

    {
      let pingRequest = new Type("PingRequest");
      this.namespace.add(pingRequest);
    }

    {
      let tournamentRegisterRequest = new Type("TournamentRegisterRequest");
      tournamentRegisterRequest.add(new Field("tournamentId", 1, "string"));
      this.namespace.add(tournamentRegisterRequest);
    }

    {
      let paymentHistoryRequest = new Type("PaymentHistoryRequest");      
      this.namespace.add(paymentHistoryRequest);
    }
    {
      let tournamentInfoRequest = new Type("TournamentInfoRequest");   
      tournamentInfoRequest.add(new Field("tournamentId", 1, "string"));   
      this.namespace.add(tournamentInfoRequest);
    }
    {
      let rebuyRequest = new Type("RebuyRequest");   
      rebuyRequest.add(new Field("tournamentId", 1, "string"));   
      this.namespace.add(rebuyRequest);
    }

    /*
    {
      let field1 = new Type("ZZZ");
      field1.add(new Field("ZZZ", 1, "string"));
      this.namespace.add(field1);
    }
    */

    let message = new Type("ClientMessage");
    message.add(new Field("loginRequest", 1, "LoginRequest"));
    message.add(new Field("logoutRequest", 2, "LogoutRequest"));
    message.add(new Field("registerRequest", 3, "RegisterRequest"));
    message.add(new Field("forgotRequest", 4, "RegisterRequest"));
    message.add(new Field("joinTableRequest", 5, "JoinTableRequest"));
    message.add(new Field("listTablesRequest", 6, "ListTablesRequest"));
    message.add(new Field("subscribeToTableRequest", 7, "SubscribeToTableRequest"));
    message.add(new Field("exchangeRatesRequest", 8, "ExchangeRatesRequest"));
    message.add(new Field("globalChatRequest", 9, "GlobalChatRequest"));
    message.add(new Field("tournamentSubscriptionRequest", 10, "TournamentSubscriptionRequest"));
    message.add(new Field("leaveTableRequest", 11, "LeaveTableRequest"));
    message.add(new Field("fold", 12, "FoldRequest"));
    message.add(new Field("bet", 13, "BetRequest"));
    message.add(new Field("fundAccountRequest", 14, "FundAccountRequest"));
    message.add(new Field("accountWithdrawlRequest", 15, "AccountWithdrawlRequest"));
    message.add(new Field("setTableOptionRequest", 16, "SetTableOptionRequest"));
    message.add(new Field("chatRequest", 17, "ChatRequest"));
    message.add(new Field("cashOutRequest", 18, "CashOutRequest"));
    message.add(new Field("getAccountSettingsRequest", 19, "GetAccountSettingsRequest"));
    message.add(new Field("setAccountSettingsRequest", 20, "SetAccountSettingsRequest"));
    message.add(new Field("transferFundsRequest", 21, "TransferFundsRequest"));
    message.add(new Field("ping", 22, "PingRequest"));
    message.add(new Field("tournamentRegisterRequest", 23, "TournamentRegisterRequest"));
    message.add(new Field("paymentHistoryRequest", 24, "PaymentHistoryRequest"));
    message.add(new Field("tournamentInfoRequest", 25, "TournamentInfoRequest"));
    message.add(new Field("rebuyRequest", 26, "RebuyRequest"));
    
    
    this.namespace.add(message);
  }
  
  addDataContainerMappings() : void {
    
    
    let tableViewRow = new Type("TableViewRow")
    tableViewRow.add(new Field("_id", 1, "string"));
    tableViewRow.add(new Field("name", 2, "string"));
    tableViewRow.add(new Field("smallBlind", 3, "double"));
    tableViewRow.add(new Field("smallBlindUsd", 4, "double"));
    tableViewRow.add(new Field("bigBlind", 5, "double"));
    tableViewRow.add(new Field("bigBlindUsd", 6, "double"));
    tableViewRow.add(new Field("currency", 7, "string"));
    tableViewRow.add(new Field("exchangeRate", 8, "double"));
    tableViewRow.add(new Field("timeToActSec", 9, "int32"));
    tableViewRow.add(new Field("maxPlayers", 10, "int32"));
    tableViewRow.add(new Field("numPlayers", 11, "int32"));
    tableViewRow.add(new Field("maxBuyIn", 12, "int32"));
    tableViewRow.add(new Field("tournamentId", 13, "string"));
    this.namespace.add(tableViewRow);

    let chatMessage = new Type("ChatMessage")
    chatMessage.add(new Field("tableId", 1, "string"));
    chatMessage.add(new Field("message", 2, "string"));
    chatMessage.add(new Field("screenName", 3, "string"));
    this.namespace.add(chatMessage);

    let globalChatResult = new Type("GlobalChatResult")
    globalChatResult.add(new Field("initialData", 1, "bool"));
    globalChatResult.add(new Field("messages", 2, "ChatMessage", "repeated"));
    this.namespace.add(globalChatResult);

    let loginResult = new Type("LoginResult")
    loginResult.add(new Field("success", 1, "bool"));
    loginResult.add(new Field("errorMessage", 2, "string"));
    loginResult.add(new Field("sid", 3, "string"));
    loginResult.add(new Field("version", 4, "string"));
    this.namespace.add(loginResult);

    let account = new Type("Account")
    account.add(new Field("currency", 1, "string"));
    account.add(new Field("balance", 2, "double"));    
    this.namespace.add(account);

    let version = new Type("Version");
    version.add(new Field("version", 1, "string"));    
    version.add(new Field("appName", 2, "string"));    
    version.add(new Field("appSupportEmail", 3, "string"));    
    version.add(new Field("cdn", 4, "string"));    
    this.namespace.add(version);

    let userData = new Type("UserData");
    userData.add(new Field("guid", 1, "string"));
    userData.add(new Field("screenName", 2, "string"));
    userData.add(new Field("accounts", 3, "Account", "repeated"));
    userData.add(new Field("initialData", 4, "bool"));
    userData.add(new Field("notifyUserStatus", 5, "bool"));
    userData.add(new Field("activated", 6, "bool"));
    userData.add(new Field("muteSounds", 7, "bool"));
    this.namespace.add(userData);

    let chatMessageResult = new Type("ChatMessageResult");
    chatMessageResult.add(new Field("tableId", 1, "string"));
    chatMessageResult.add(new Field("initialData", 2, "bool"));
    chatMessageResult.add(new Field("messages", 3, "ChatMessage", "repeated"));
    this.namespace.add(chatMessageResult);

    let subscribeTableResult = new Type("SubscribeTableResult");
    subscribeTableResult.add(new Field("tableId", 1, "string"));
    subscribeTableResult.add(new Field("shutdownRequested", 2, "bool"));
    subscribeTableResult.add(new Field("tableConfig", 3, "TableViewRow"));
    subscribeTableResult.add(new Field("tournamentId", 4, "string"));
    subscribeTableResult.add(new Field("nextBlind", 5, "NextBlind"));
    this.namespace.add(subscribeTableResult);

    let potResult = new Type("PotResult");
    potResult.add(new Field("seatWinners", 1, "int32", "repeated"));
    potResult.add(new Field("winningHand", 2, "string"));
    potResult.add(new Field("bestHandCards", 3, "string", "repeated"));
    potResult.add(new Field("amount", 4, "int32"));
    potResult.add(new Field("amountFormatted", 5, "string"));
    this.namespace.add(potResult);

    let gameEvent = new Type("GameEvent");
    gameEvent.add(new Field("pot", 1, "double", "repeated"));
    gameEvent.add(new Field("tocall", 2, "double"));
    gameEvent.add(new Field("action", 3, "string"));
    gameEvent.add(new Field("chipsToPot", 4, "bool"));
    gameEvent.add(new Field("street", 5, "string"));
    gameEvent.add(new Field("potResults", 6, "PotResult", "repeated"));
    gameEvent.add(new Field("dealer", 7, "int32"));
    gameEvent.add(new Field("board", 8, "string", "repeated"));
    gameEvent.add(new Field("tableId", 9, "string"));
    gameEvent.add(new Field("lastRaise", 10, "double"));
    this.namespace.add(gameEvent);

    let tableSeatEvents = new Type("TableSeatEvents");
    tableSeatEvents.add(new Field("tableId", 1, "string"));
    tableSeatEvents.add(new Field("seats", 2, "TableSeatEvent", "repeated"));
    this.namespace.add(tableSeatEvents);

    let tableSeatEvent = new Type("TableSeatEvent");
    tableSeatEvent.add(new Field("name", 1, "string"));
    tableSeatEvent.add(new Field("seat", 2, "int32"));
    tableSeatEvent.add(new Field("stack", 3, "double"));
    tableSeatEvent.add(new Field("empty", 4, "bool"));
    tableSeatEvent.add(new Field("playing", 5, "bool"));
    tableSeatEvent.add(new Field("guid",6, "string"));
    tableSeatEvent.add(new Field("playercards", 7, "string", "repeated"));
    tableSeatEvent.add(new Field("bet", 8, "double"));
    tableSeatEvent.add(new Field("myturn", 9, "bool"));
    tableSeatEvent.add(new Field("hasFolded", 10, "bool"));
    tableSeatEvent.add(new Field("hasRaised", 11, "bool"));
    tableSeatEvent.add(new Field("hasCalled", 12, "bool"));
    tableSeatEvent.add(new Field("isSittingOut", 13, "bool"));
    tableSeatEvent.add(new Field("timeToActSec", 14, "int32"));
    tableSeatEvent.add(new Field("avatar", 15, "string"));
    this.namespace.add(tableSeatEvent);

    let nextBlind = new Type("NextBlind");
    nextBlind.add(new Field("smallBlind", 1, "int32"));
    nextBlind.add(new Field("bigBlind", 2, "int32"));
    nextBlind.add(new Field("remainingSec", 3, "int32"));
    this.namespace.add(nextBlind);

    let blindsChangingEvent = new Type("BlindsChangingEvent");
    blindsChangingEvent.add(new Field("smallBlind", 1, "int32"));
    blindsChangingEvent.add(new Field("bigBlind", 2, "int32"));
    this.namespace.add(blindsChangingEvent);

    let gameStartingEvent = new Type("GameStartingEvent");
    gameStartingEvent.add(new Field("startsInNumSeconds", 1, "int32"));
    gameStartingEvent.add(new Field("isStarting", 2, "bool"));
    gameStartingEvent.add(new Field("blindsChanging", 3, "BlindsChangingEvent"));
    gameStartingEvent.add(new Field("nextBlind", 4, "NextBlind"));
    gameStartingEvent.add(new Field("tableId", 5, "string"));
    this.namespace.add(gameStartingEvent);

    let deal = new Type("DealHoleCardsEvent");
    deal.add(new Field("holecards", 1, "string", "repeated"));
    deal.add(new Field("board", 2, "string", "repeated"));
    deal.add(new Field("tableId", 3, "string"));
    this.namespace.add(deal);

    let error = new Type("PokerError");
    error.add(new Field("message", 1, "string"));
    this.namespace.add(error);

    let fundAccountResult = new Type("FundAccountResult");
    fundAccountResult.add(new Field("addressQrCode", 1, "string"));
    fundAccountResult.add(new Field("currency", 2, "string"));
    fundAccountResult.add(new Field("paymentAddress", 3, "string"));
    fundAccountResult.add(new Field("requiredConfirmations", 4, "int32"));
    this.namespace.add(fundAccountResult);

    let accountFunded = new Type("accountFunded");
    accountFunded.add(new Field("balance", 1, "double"));
    accountFunded.add(new Field("confirmations", 2, "int32"));
    accountFunded.add(new Field("currency", 3, "string"));
    accountFunded.add(new Field("paymentReceived", 4, "double"));
    this.namespace.add(accountFunded);

    let accountWithdrawlResult = new Type("AccountWithdrawlResult");
    accountWithdrawlResult.add(new Field("balance", 1, "string"));
    accountWithdrawlResult.add(new Field("fees", 2, "string"));
    accountWithdrawlResult.add(new Field("sentAmount", 3, "string"));
    accountWithdrawlResult.add(new Field("currency", 4, "string"));
    accountWithdrawlResult.add(new Field("errorMessage", 5, "string"));
    accountWithdrawlResult.add(new Field("success", 6, "bool"));
    accountWithdrawlResult.add(new Field("txHash", 7, "string"));
    accountWithdrawlResult.add(new Field("txHashLink", 8, "string"));
    this.namespace.add(accountWithdrawlResult);
    
    let field1 = new Type("UserStatus");
    field1.add(new Field("country", 1, "string"));
    field1.add(new Field("countryCode", 2, "string"));
    field1.add(new Field("online", 3, "bool"));
    field1.add(new Field("screenName", 4, "string"));
    this.namespace.add(field1);

    let globalUsers = new Type("GlobalUsers");
    globalUsers.add(new Field("initialData", 1, "bool"));
    globalUsers.add(new Field("users", 2, "UserStatus", "repeated"));
    this.namespace.add(globalUsers);

    
    let cashOutAccount = new Type("CashOutAccount");
    cashOutAccount.add(new Field("balance", 1, "double"));
    cashOutAccount.add(new Field("currency", 2, "string"));
    cashOutAccount.add(new Field("insufficientBalance", 3, "bool"));
    cashOutAccount.add(new Field("refundAddress", 4, "string"));
    cashOutAccount.add(new Field("refundAddressCount", 5, "int32"));
    this.namespace.add(cashOutAccount);

    let cashOutRequestResult = new Type("CashOutRequestResult");
    cashOutRequestResult.add(new Field("accounts", 1, "CashOutAccount", "repeated"));
    this.namespace.add(cashOutRequestResult);

    let setTableOptionResult = new Type("SetTableOptionResult");
    setTableOptionResult.add(new Field("tableId", 1, "string"));
    setTableOptionResult.add(new Field("sitOutNextHand", 2, "bool"));
    setTableOptionResult.add(new Field("autoFold", 3, "bool"));
    setTableOptionResult.add(new Field("autoCheck", 4, "bool"));
    this.namespace.add(setTableOptionResult);

    let accountSettings = new Type("GetAccountSettingsResult");
    accountSettings.add(new Field("email", 1, "string"));
    accountSettings.add(new Field("screenName", 2, "string"));
    accountSettings.add(new Field("muteSounds", 3, "bool"));
    this.namespace.add(accountSettings);

    let setAccountSettingsResult = new Type("SetAccountSettingsResult");
    setAccountSettingsResult.add(new Field("errorMessage", 1, "string"));
    setAccountSettingsResult.add(new Field("success", 2, "bool"));
    this.namespace.add(setAccountSettingsResult);
    
    let tableClosed = new Type("TableClosed");
    tableClosed.add(new Field("tableId", 1, "string"));
    this.namespace.add(tableClosed);

    let transferFundsResult = new Type("TransferFundsResult");
    transferFundsResult.add(new Field("amount", 1, "double"));
    transferFundsResult.add(new Field("currency", 2, "string"));
    transferFundsResult.add(new Field("errorMessage", 3, "string"));
    transferFundsResult.add(new Field("screenName", 4, "string"));
    transferFundsResult.add(new Field("success", 5, "bool"));
    this.namespace.add(transferFundsResult);

    let exchangeRate = new Type("ExchangeRate");
    exchangeRate.add(new Field("base", 1, "string"));
    exchangeRate.add(new Field("target", 2, "string"));
    exchangeRate.add(new Field("price", 3, "double"));
    exchangeRate.add(new Field("change", 4, "double"));
    exchangeRate.add(new Field("volume", 5, "int32"));
    this.namespace.add(exchangeRate);

    let exchangeRateResult = new Type("ExchangeRateResult");
    exchangeRateResult.add(new Field("rates", 1, "ExchangeRate", "repeated"));
    this.namespace.add(exchangeRateResult);

    let pong = new Type("Pong");
    this.namespace.add(pong);

    let logoutResult = new Type("LogoutResult");
    this.namespace.add(logoutResult);

    let registerResult = new Type("RegisterResult");
    registerResult.add(new Field("errorMessage", 1, "string"));
    registerResult.add(new Field("message", 2, "string"));
    registerResult.add(new Field("success", 3, "bool"));
    this.namespace.add(registerResult);

    let tournamentViewRow = new Type("TournamentViewRow");
    tournamentViewRow.add(new Field("id", 1, "string"));
    tournamentViewRow.add(new Field("name", 2, "string"));
    tournamentViewRow.add(new Field("currency", 3, "string"));
    tournamentViewRow.add(new Field("startTime", 4, "string"));
    tournamentViewRow.add(new Field("totalPrize", 5, "string"));
    tournamentViewRow.add(new Field("totalPrizeUsd", 6, "string"));
    tournamentViewRow.add(new Field("playerCount", 7, "int32"));
    tournamentViewRow.add(new Field("joined", 8, "bool"));
    tournamentViewRow.add(new Field("status", 9, "int32"));
    tournamentViewRow.add(new Field("lateRegistrationMin", 10, "int32"));
    tournamentViewRow.add(new Field("buyIn", 11, "string"));
    this.namespace.add(tournamentViewRow);

    let tournamentSubscriptionResult = new Type("TournamentSubscriptionResult");
    tournamentSubscriptionResult.add(new Field("tournaments", 1, "TournamentViewRow", "repeated"));
    tournamentSubscriptionResult.add(new Field("tournamentCount", 2, "int32"));
    this.namespace.add(tournamentSubscriptionResult);

    let forgotResult = new Type("ForgotResult");
    forgotResult.add(new Field("errors", 1, "string", "repeated"));
    forgotResult.add(new Field("message", 2, "string"));
    forgotResult.add(new Field("success", 3, "bool"));
    this.namespace.add(forgotResult);

    let tournamentResultView = new Type("TournamentResultView");
    tournamentResultView.add(new Field("tournamentName", 1, "string"));    
    tournamentResultView.add(new Field("placing", 2, "int32"));    
    tournamentResultView.add(new Field("rebuyAmount", 3, "string"));    
    tournamentResultView.add(new Field("currency", 4, "string"));    
    tournamentResultView.add(new Field("tournamentId", 5, "string"));    
    tournamentResultView.add(new Field("canRebuy", 6, "bool"));    
    this.namespace.add(tournamentResultView);

    let paymentHistoryResult = new Type("PaymentHistoryResult");
    paymentHistoryResult.add(new Field("payments", 1, "PaymentHistoryRowView", "repeated"));
    this.namespace.add(paymentHistoryResult);
    
    let paymentHistoryRowView = new Type("PaymentHistoryRowView");
    paymentHistoryRowView.add(new Field("amount", 1, "string"));    
    paymentHistoryRowView.add(new Field("confirmations", 2, "int32"));    
    paymentHistoryRowView.add(new Field("currency", 3, "string"));    
    paymentHistoryRowView.add(new Field("requiredConfirmations", 4, "int32"));    
    paymentHistoryRowView.add(new Field("status", 5, "string"));    
    paymentHistoryRowView.add(new Field("timestamp", 6, "string"));    
    paymentHistoryRowView.add(new Field("type", 7, "string"));    
    paymentHistoryRowView.add(new Field("txHash", 8, "string"));    
    paymentHistoryRowView.add(new Field("comment", 9, "string"));    
    this.namespace.add(paymentHistoryRowView);

    let blindConfig = new Type("BlindConfig")
    blindConfig.add(new Field("smallBlind", 1, "int32"));
    blindConfig.add(new Field("bigBlind", 2, "int32"));
    blindConfig.add(new Field("timeMin", 3, "int32"));
    this.namespace.add(blindConfig);

    let tournamentResultRowView = new Type("TournamentResultRowView")
    tournamentResultRowView.add(new Field("screenName", 1, "string"));
    tournamentResultRowView.add(new Field("placing", 2, "int32"));
    tournamentResultRowView.add(new Field("stack", 3, "double"));
    this.namespace.add(tournamentResultRowView);

    let tournamentInfoResult = new Type("TournamentInfoResult");
    tournamentInfoResult.add(new Field("prizes", 1, "string", "repeated"));
    tournamentInfoResult.add(new Field("blindConfig", 2, "BlindConfig", "repeated"));
    tournamentInfoResult.add(new Field("results", 3, "TournamentResultRowView", "repeated"));
    tournamentInfoResult.add(new Field("currency", 4, "string"));
    tournamentInfoResult.add(new Field("playersPerTable", 5, "int32"));
    tournamentInfoResult.add(new Field("startingChips", 6, "int32"));
    tournamentInfoResult.add(new Field("timeToActSec", 7, "int32"));
    tournamentInfoResult.add(new Field("lateRegistrationMin", 8, "int32"));
    tournamentInfoResult.add(new Field("evictAfterIdleMin", 9, "int32"));
    tournamentInfoResult.add(new Field("name", 10, "string"));
    tournamentInfoResult.add(new Field("buyIn", 11, "string"));
    
    this.namespace.add(tournamentInfoResult);

    let tableConfigs = new Type("TableConfigs")
    tableConfigs.add(new Field("rows", 4, "TableViewRow", "repeated"));
    this.namespace.add(tableConfigs);

    let duplicateIpAddress = new Type("DuplicateIpAddress");
    this.namespace.add(duplicateIpAddress);

    // {
    //   let field1 = new Type("ZZZ");
    //   field1.add(new Field("ZZZ", 1, "string"));
    //   this.namespace.add(field1);
    // }

    let message = new Type("DataContainer");
    message.add(new Field("loginResult", 1, "LoginResult"));
    message.add(new Field("user", 2, "UserData"));
    message.add(new Field("globalChatResult", 3, "GlobalChatResult"));
    message.add(new Field("tableConfigs", 4, "TableConfigs"));
    message.add(new Field("chatMessageResult", 5, "ChatMessageResult"));
    message.add(new Field("subscribeTableResult", 6, "SubscribeTableResult"));
    message.add(new Field("game", 7, "GameEvent"));
    message.add(new Field("tableSeatEvents", 8, "TableSeatEvents"));
    message.add(new Field("gameStarting", 9, "GameStartingEvent"));
    message.add(new Field("deal", 10, "DealHoleCardsEvent"));
    message.add(new Field("error", 11, "PokerError"));
    message.add(new Field("fundAccountResult", 12, "FundAccountResult"));
    message.add(new Field("accountFunded", 13, "accountFunded"));
    message.add(new Field("accountWithdrawlResult", 14, "AccountWithdrawlResult"));
    message.add(new Field("globalUsers", 15, "GlobalUsers"));
    message.add(new Field("cashOutRequestResult", 16, "CashOutRequestResult"));
    message.add(new Field("setTableOptionResult", 17, "SetTableOptionResult"));
    message.add(new Field("accountSettings", 18, "GetAccountSettingsResult"));
    message.add(new Field("setAccountSettingsResult", 19, "SetAccountSettingsResult"));
    message.add(new Field("tableClosed", 20, "TableClosed"));
    message.add(new Field("transferFundsResult", 21, "TransferFundsResult"));
    message.add(new Field("exchangeRates", 22, "ExchangeRateResult"));
    message.add(new Field("pong", 23, "Pong"));
    message.add(new Field("logoutResult", 24, "LogoutResult"));
    message.add(new Field("registerResult", 25, "RegisterResult"));
    message.add(new Field("tournamentSubscriptionResult", 26, "TournamentSubscriptionResult"));
    message.add(new Field("forgotResult", 27, "ForgotResult"));
    message.add(new Field("tournamentResult", 28, "TournamentResultView"));
    message.add(new Field("paymentHistoryResult", 29, "PaymentHistoryResult"));    
    message.add(new Field("tournamentInfoResult", 30, "TournamentInfoResult"));    
    message.add(new Field("version", 31, "Version"));    
    message.add(new Field("duplicateIpAddress", 32, "DuplicateIpAddress"));    
    this.namespace.add(message);

    
  }

  // addClassDefinition<T>(type: new () => T) : void {
  //   let obj = new type();
  //   let typeDefinition = new Type(obj.constructor.name);
    
  //   let index:number=1;
  //   for(let key of Object.keys(obj).sort()){
  //     typeDefinition.add(new Field(key, index, "LoginResult"));
  //     index++;
  //   }
  //   this.namespace.add(typeDefinition);
  // }
  
  defined(data:any) : boolean{
    let protoMessageDefinition:any = this.root.lookupType(`shared.DataContainer`);

    for(let key of Object.keys(data)){
      for(let field of Object.keys(protoMessageDefinition.fields)){
        if(field == key){
          return true;
        }        
      }
    }
    return false;
  }

  serialize(data:DataContainer|ClientMessage, type:BaseSerializationType){
    let protoMessageDefinition:any = this.root.lookupType(`shared.${type}`); 
    var errMsg = protoMessageDefinition.verify(data); 
    if (errMsg)
        throw Error(errMsg);

    var message = protoMessageDefinition.create(data); // or use .fromObject if conversion is necessary

    var buffer = protoMessageDefinition.encode(message).finish();  
    // ... do something with buffer

    
    return buffer; 
  }

  deserialize(buffer:Buffer|ArrayBuffer, type:BaseSerializationType) :any {
    //is an ArrayBuffer when called from the client - in that case there is no buffer or byteOffset
    let byteArray:Uint8Array = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
    let protoMessageDefinition:any = this.root.lookupType(`shared.${type}`);
    
    
    let message = protoMessageDefinition.decode(byteArray);

    // Maybe convert the message back to a plain object
    var object = protoMessageDefinition.toObject(message, {
        longs: String,
        enums: String,
        bytes: String
        // see ConversionOptions
    });    
    
    this.cleanupFloats(object, type);

    return object;
  }

  cleanupFloats(object: any, type:BaseSerializationType) {
    
    if(type === "DataContainer"){
      if(object.user != null && object.user.accounts!=null){
        for(let account of object.user.accounts){
          account.balance = this.roundFloat(account.balance);
        }
      }
      if (object.game && object.game.tocall)
        object.game.tocall = parseFloat(object.game.tocall.toFixed(this.rounding));
      if (object.tableConfigs && object.tableConfigs.rows) {
        for (let config of object.tableConfigs.rows) {
          if (config.rake) {
            config.rake = parseFloat(config.rake.toFixed(this.rounding));
          }
        }
      }
      if(object.seats){
        for(let seat of object.seats){
          if (seat.stack)
            seat.stack = parseFloat(seat.stack.toFixed(this.rounding));
          if (seat.bet)
            seat.bet = parseFloat(seat.bet.toFixed(this.rounding));
        }
      }
      if(object.accountFunded){
        object.accountFunded.balance = this.roundFloat(object.accountFunded.balance);
        object.accountFunded.paymentReceived = this.roundFloat(object.accountFunded.paymentReceived);
      }
      
      if(object.cashOutRequestResult && object.cashOutRequestResult.accounts){
        for(let account of object.cashOutRequestResult.accounts)
          account.balance = this.roundFloat(account.balance);
      }
      if(object.transferFundsResult && object.transferFundsResult.amount){
        object.transferFundsResult.amount = this.roundFloat(object.transferFundsResult.amount);
      }
  
      if(object.exchangeRates != null && object.exchangeRates.rates != null){
        for(let exchangeRate of object.exchangeRates.rates){
          exchangeRate.price = this.roundFloat(exchangeRate.price);
          exchangeRate.change = this.roundFloat(exchangeRate.change);
        }        
      }
      if(object.tournamentInfoResult != null && object.tournamentInfoResult.results){
        for(let result of object.tournamentInfoResult.results){
          if(result.stack){
            result.stack = this.roundFloat(result.stack);
          }
          
        }
      }
    } else if(type === "ClientMessage"){
      
    }
    
  }

  roundFloat(val:number) {
    if (val)
      return parseFloat(val.toFixed(this.rounding));
    return val;
  }
}


type BaseSerializationType = "DataContainer" | "ClientMessage";

export default new ProtobufConfig();
