import { TableViewRow } from './../../poker.ui/src/shared/TableViewRow';
import { ClientMessage, JoinTableRequest, ListTablesRequest, SubscribeToTableRequest, GlobalChatRequest, TournamentSubscriptionRequest, LeaveTableRequest, FoldRequest, BetRequest, FundAccountRequest, AccountWithdrawlRequest, SetTableOptionRequest, ChatRequest, CashOutRequest, GetAccountSettingsRequest, SetAccountSettingsRequest, TransferFundsRequest, Ping, TournamentRegisterRequest, ExchangeRatesRequest, PaymentHistoryRequest, RebuyRequest } from './../../poker.ui/src/shared/ClientMessage';
import { DataContainer, UserData, Account, GameEvent, PotResult, TableSeatEvent, GameStartingEvent, DealHoleCardsEvent, PokerError, FundAccountResult, AccountFunded, AccountWithdrawlResult, GlobalUsers, CashOutRequestResult, SetTableOptionResult, GetAccountSettingsResult, SetAccountSettingsResult, TableClosed, TransferFundsResult, ExchangeRateResult, Pong, TournamentSubscriptionResult, SubscribeTableResult, BlindsChangingEvent, PaymentHistoryResult, PaymentHistoryRowView, Version, TableSeatEvents, DuplicateIpAddress, TableConfigs } from './../../poker.ui/src/shared/DataContainer';
import protobufConfig from './../../poker.ui/src/shared/protobuf-config';
import { LoginResult, LogoutResult, LoginRequest, LogoutRequest } from '../../poker.ui/src/shared/login-request';
import { RegisterResult, RegisterRequest } from '../../poker.ui/src/shared/signup-request';
import { ForgotResult, ForgotRequest } from '../../poker.ui/src/shared/forgot-request';
import { TournmanetStatus } from '../../poker.ui/src/shared/TournmanetStatus';
import { TournamentViewRow } from '../../poker.ui/src/shared/tournmanet-view-row';
import { TournamentInfoRequest, TournamentInfoResult, TournamentResultRowView } from '../../poker.ui/src/shared/TournamentInfoRequest';
import { TournamentResultView } from '../../poker.ui/src/shared/TournamentResultView';
import { NextBlind } from '../../poker.ui/src/shared/NextBlind';
var assert = require('assert');
//const msgpack = require('notepack.io');

describe('serialization-fixture', () => {
    
  beforeEach(async () => {        
    await protobufConfig.init(); 
})
  

  it('protobuf_DataContainer', async () => {
    let dc = new DataContainer();

    let version = new Version('version1', 'appName', 'appSupportEmail', 'cdn');
    dc.version = version;

    let loginResult = new LoginResult();
    loginResult.success = true;
    loginResult.errorMessage = 'errorMessage';
    loginResult.sid = 'sid';
    dc.loginResult = loginResult;
    
    dc.user = new UserData();
    dc.user.guid = 'guid1';
    dc.user.screenName = 'wal';
    dc.user.initialData = true;
    dc.user.activated = true;
    dc.user.accounts.push(<Account>{ currency:'dash', balance:3000000 }, <Account>{ currency:'dash', balance:877.66});
    dc.user.notifyUserStatus = false;
    dc.user.muteSounds = true;
    
    let tableViewRow = new TableViewRow();
    tableViewRow._id = "_id1";
    tableViewRow.name = "name";
    tableViewRow.smallBlind = 1234;
    tableViewRow.smallBlindUsd = 12341;
    tableViewRow.bigBlind = 5678;
    tableViewRow.bigBlindUsd = 56781;
    tableViewRow.currency = "currency";
    tableViewRow.exchangeRate = 1.55;
    tableViewRow.timeToActSec = 5;
    tableViewRow.maxPlayers = 7;
    tableViewRow.numPlayers = 100;
    tableViewRow.maxBuyIn = 1000;
    tableViewRow.tournamentId = 'tournamentId';
    dc.tableConfigs = new TableConfigs();
    dc.tableConfigs.rows = [tableViewRow];

    let subscribeTableResult = new SubscribeTableResult();
    subscribeTableResult.tableId = 'tableId';    
    subscribeTableResult.shutdownRequested = true;
    subscribeTableResult.tableConfig = tableViewRow;
    subscribeTableResult.tournamentId = 'tournamentId';
    subscribeTableResult.nextBlind = new NextBlind(20,40, 999);
    dc.subscribeTableResult = subscribeTableResult;

    dc.game = new GameEvent('tableId');    
    dc.game.pot = [1,2,3];
    dc.game.tocall = 1.23;
    dc.game.lastRaise = 1000000;
    dc.game.action = "action";
    dc.game.chipsToPot = true;
    dc.game.street = "street";
    let potResult1 = new PotResult();
    potResult1.seatWinners = [1,2,3];
    potResult1.winningHand = 'ABC';
    potResult1.bestHandCards = ["10H", "2D", "5H", "8H", "5C"]
    potResult1.amount = 1000000;
    potResult1.amountFormatted = '$1,000';
    let potResult2 = new PotResult();
    potResult2.seatWinners = [4,5,6];
    potResult2.winningHand = 'DEF';
    dc.game.potResults = [ potResult1, potResult2 ];
    dc.game.dealer = 1;
    dc.game.board = ['A', 'B', 'C'];
       
    let seat1 = new TableSeatEvent();
    seat1.name = 'name';
    seat1.seat = 1;
    seat1.stack = 1.23;
    seat1.empty = true;
    seat1.playing = true;
    seat1.guid = 'name';
    seat1.playercards = ['AD', 'KC'];
    seat1.bet = 1.23;
    seat1.myturn = true;
    seat1.hasFolded = true;
    seat1.hasRaised = true;
    seat1.hasCalled = true;
    seat1.isSittingOut = true;
    seat1.timeToActSec = 10;
    seat1.avatar = 'avatar';
    let seat2 = Object.assign({}, seat1);
    seat2.seat = 2;
    let tableSeatEvents = new TableSeatEvents('tableId');    
    tableSeatEvents.seats = [ seat1, seat2];
    dc.tableSeatEvents = tableSeatEvents;
    
    dc.gameStarting = new GameStartingEvent('tableId');
    dc.gameStarting.isStarting = false;
    dc.gameStarting.startsInNumSeconds = 3;
    dc.gameStarting.blindsChanging = new BlindsChangingEvent(10, 20);
    dc.gameStarting.nextBlind = new NextBlind(20,40, 15);


    dc.deal = new DealHoleCardsEvent('tableId');
    dc.deal.board = ['AD', 'KC'];
    dc.deal.holecards = ['CD', 'CC'];

    dc.error = new PokerError();
    dc.error.message = "message";

    dc.fundAccountResult = new FundAccountResult();
    dc.fundAccountResult.paymentAddress = "paymentAddress";
    dc.fundAccountResult.addressQrCode = "addressQrCode";
    dc.fundAccountResult.currency = "currency";
    dc.fundAccountResult.requiredConfirmations = 1;

    dc.accountFunded = new AccountFunded();
    dc.accountFunded.paymentReceived = 1.23;
    dc.accountFunded.balance = 4.56;
    dc.accountFunded.currency = 'currency';
    dc.accountFunded.confirmations = 10;

    dc.accountWithdrawlResult = new AccountWithdrawlResult();
    dc.accountWithdrawlResult.success = true;
    dc.accountWithdrawlResult.fees = '1.23';
    dc.accountWithdrawlResult.sentAmount = '7500000000'
    dc.accountWithdrawlResult.balance = '7500000000'
    dc.accountWithdrawlResult.errorMessage = "errorMessage"
    dc.accountWithdrawlResult.txHash = "txHash"
    dc.accountWithdrawlResult.txHashLink = "txHashLink"
    dc.accountWithdrawlResult.currency = "currency"

    dc.globalUsers = new GlobalUsers();
    dc.globalUsers.initialData = true;
    dc.globalUsers.users = [ { screenName:'user1', online: true, countryCode: 'it', country:'italy'}, { screenName:'user2', online: false}]
    
    dc.cashOutRequestResult = new CashOutRequestResult();
    dc.cashOutRequestResult.accounts = [ {currency:'currency',balance:1.23,insufficientBalance:true,refundAddress:'refundAddress',refundAddressCount:1 } ];

    dc.setTableOptionResult = new SetTableOptionResult();
    dc.setTableOptionResult.tableId = "tableId";
    dc.setTableOptionResult.sitOutNextHand = true;
    dc.setTableOptionResult.autoFold = true;
    dc.setTableOptionResult.autoCheck = true;

    dc.accountSettings = new GetAccountSettingsResult();
    dc.accountSettings.email = "email";
    dc.accountSettings.screenName = "screenName";
    dc.accountSettings.muteSounds = true;

    dc.setAccountSettingsResult = new SetAccountSettingsResult(true, "errorMessage");

    dc.tableClosed = new TableClosed('tableId');

    dc.transferFundsResult = new TransferFundsResult();
    dc.transferFundsResult.success = true
    dc.transferFundsResult.errorMessage = 'error'
    dc.transferFundsResult.currency = 'currency'
    dc.transferFundsResult.screenName = 'screenName'
    dc.transferFundsResult.amount = 1.23;

    dc.exchangeRates = new ExchangeRateResult();
    dc.exchangeRates.rates = [ { base:'base',target:'target',price:1.23,volume:123,change:4.56, }];

    dc.pong = new Pong();

    dc.logoutResult = new LogoutResult();    

    dc.registerResult = new RegisterResult();
    dc.registerResult.errorMessage = 'error'
    dc.registerResult.message = 'message'
    dc.registerResult.success = true

    dc.tournamentSubscriptionResult = new TournamentSubscriptionResult()
    dc.tournamentSubscriptionResult.tournamentCount = 30;
    let tournamentViewRow = new TournamentViewRow(); 
    tournamentViewRow.id ='id';
    tournamentViewRow.name ='name';
    tournamentViewRow.currency ='currency';
    tournamentViewRow.startTime ='startTime';
    tournamentViewRow.totalPrize ='totalPrize';
    tournamentViewRow.totalPrizeUsd ='totalPrizeUsd';
    tournamentViewRow.playerCount =10;
    tournamentViewRow.joined =true;
    tournamentViewRow.status =TournmanetStatus.Complete;
    tournamentViewRow.lateRegistrationMin = 20;
    tournamentViewRow.buyIn = "0.01";
    dc.tournamentSubscriptionResult.tournaments = [ 
      tournamentViewRow
      ];

    dc.forgotResult = new ForgotResult();
    dc.forgotResult.errors = [ 'a', 'b'];
    dc.forgotResult.success = true
    dc.forgotResult.message = 'message'

    dc.tournamentResult = new TournamentResultView('id1', 'tournamentName', 11, "0.01", "dash", true);    

    dc.paymentHistoryResult = new PaymentHistoryResult();
    let paymentHistoryRowView = new PaymentHistoryRowView();
    paymentHistoryRowView.amount = '1.23'
    paymentHistoryRowView.confirmations = 1;
    paymentHistoryRowView.currency = 'dash'
    paymentHistoryRowView.requiredConfirmations = 2;
    paymentHistoryRowView.status = 'pending'
    paymentHistoryRowView.timestamp = new Date().toISOString();
    paymentHistoryRowView.type = 'outgoing'
    paymentHistoryRowView.txHash = 'txHash'
    paymentHistoryRowView.comment = 'comment'
    dc.paymentHistoryResult.payments = [paymentHistoryRowView]
    
    let tournamentInfoResult = new TournamentInfoResult();
    tournamentInfoResult.playersPerTable = 1;
    tournamentInfoResult.startingChips = 2;    
    tournamentInfoResult.timeToActSec = 3;
    tournamentInfoResult.lateRegistrationMin = 4;
    tournamentInfoResult.evictAfterIdleMin = 5;
    tournamentInfoResult.name = 'tournament 1';
    tournamentInfoResult.prizes = [ "0.325",     "0.1",     "0.05",     "0.025"]
    tournamentInfoResult.blindConfig = [ 
      {
          "smallBlind" : 10,
          "bigBlind" : 20,
          "timeMin" : 20
      }, 
      {
          "smallBlind" : 15,
          "bigBlind" : 30,
          "timeMin" : 20
      }];
    
    let tournamentResultRowView2 = new TournamentResultRowView('bar', 2);
    tournamentResultRowView2.stack = 123.45;
      tournamentInfoResult.results = [ new TournamentResultRowView('foo', 1), tournamentResultRowView2];
    dc.tournamentInfoResult = tournamentInfoResult;

      dc.duplicateIpAddress = new DuplicateIpAddress();

    let buffer = protobufConfig.serialize(dc, 'DataContainer');

    var deserialized:DataContainer = <DataContainer>protobufConfig.deserialize(buffer, 'DataContainer');
    
    assert.deepEqual(deserialized, dc);

    //console.log(`JSON:${JSON.stringify(dc).length} buffer:${buffer.length}`);  
    //assert.equal({date: {}}, {date:new Date()});
    
    //console.log(util.inspect(deserialized, false, null));
    // let buffer2 = msgpack.encode(dc);
    // console.log('buffer2', buffer2.length);
  });

  it('protobuf_ClientMessage', () => {
    let message = new ClientMessage();

    message.joinTableRequest = new JoinTableRequest();
    message.joinTableRequest.amount = 200000000000;
    message.joinTableRequest.seat = 9;
    message.joinTableRequest.tableId = "tableId";

    message.listTablesRequest = new ListTablesRequest();
    
    message.subscribeToTableRequest = new SubscribeToTableRequest();
    message.subscribeToTableRequest.tableId = "tableId";
    message.subscribeToTableRequest.tournamentId = "tournamentId";

    message.exchangeRatesRequest = new ExchangeRatesRequest();

    message.globalChatRequest = new GlobalChatRequest("message1", true);
    
    message.tournamentSubscriptionRequest = new TournamentSubscriptionRequest();
    
    message.leaveTableRequest = new LeaveTableRequest("tableId");

    message.loginRequest = new LoginRequest('foo@bar.com', 'password');
    
    message.logoutRequest = new LogoutRequest();
    
    message.registerRequest = new RegisterRequest();
    message.registerRequest.screenName = 'screenName';
    message.registerRequest.email = 'email';
    message.registerRequest.password = 'password';
    message.registerRequest.confirmPassword = 'confirmPassword';
    message.registerRequest.tournamentId = 'tournamentId';

    message.forgotRequest = new ForgotRequest();
    message.forgotRequest.email = 'foo@bar.com';

    message.fold = new FoldRequest();
    message.fold.tableId = 'tableId';

    message.bet = new BetRequest();
    message.bet.tableId = 'tableId';
    message.bet.amount = 30000000;

    message.fundAccountRequest = new FundAccountRequest('dash');

    message.accountWithdrawlRequest = new AccountWithdrawlRequest();
    message.accountWithdrawlRequest.currency = 'currency'
    message.accountWithdrawlRequest.receivingAddress = 'receivingAddress'
    message.accountWithdrawlRequest.amount = '7500000000';

    message.setTableOptionRequest = new SetTableOptionRequest('tableId', true, true, true);

    message.chatRequest = new ChatRequest('tableId', 'message');

    message.cashOutRequest = new CashOutRequest();

    message.getAccountSettingsRequest = new GetAccountSettingsRequest();
    
    message.setAccountSettingsRequest = new SetAccountSettingsRequest();
    message.setAccountSettingsRequest.screenName = "screenName"
    message.setAccountSettingsRequest.muteSounds = true;

    message.transferFundsRequest = new TransferFundsRequest();
    message.transferFundsRequest.amount = 3000000;
    message.transferFundsRequest.currency = 'currency';
    message.transferFundsRequest.screenName = 'screenName';

    message.ping = new Ping();
    
    message.tournamentRegisterRequest = new TournamentRegisterRequest();
    message.tournamentRegisterRequest.tournamentId = 'tournamentId'

    message.paymentHistoryRequest = new PaymentHistoryRequest();
    
    message.tournamentInfoRequest = new TournamentInfoRequest('id1');

    message.rebuyRequest = new RebuyRequest('abcd')

    let buffer = protobufConfig.serialize(message, 'ClientMessage');

    var deserialized:ClientMessage = <ClientMessage>protobufConfig.deserialize(buffer, 'ClientMessage');

    assert.deepEqual(deserialized, message);

    //console.log(`buffer ${buffer.byteLength}`);
  });

  // it('protobuf2', async () => {
  //   // var config = new ProtobufConfig(); 
  //   await protobufConfig.init(); 
  //   let dc = new DataContainer();
  //   //dc.game = new GameEvent();
  //   //dc.game.potResults = [ { seatWinners:[1,2,3], winningHand:'ABC'},{ seatWinners:[4,5,6], winningHand:'DEF'} ];
  //   //dc.game.potResults = [];
  //   let seat1 = new TableSeatEvent();
  //   seat1.playing = false;    
  //   seat1.playercards = [ 'AC' ];
  //   dc.seats = [ seat1 ];

  //   var buffer = protobufConfig.serialize(dc);    

  //   var deserialized:DataContainer = <DataContainer>protobufConfig.deserialize(buffer, 'DataContainer');

  //   console.log(util.inspect(deserialized, false, null));
  // })

})