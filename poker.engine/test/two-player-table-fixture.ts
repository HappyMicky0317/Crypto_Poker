import * as assert from 'assert';
var substitute = require('jssubstitute');
import { Table } from "../src/table";
import { WebSocketHandle, IWebSocket } from "../src/model/WebSocketHandle";
import { DataContainer, Account } from "../../poker.ui/src/shared/DataContainer";
import { MockWebSocket } from "./mockWebSocket";
import { User } from "../src/model/User";
import { Deck } from "../src/deck";
import {TexasHoldemGameState, GamePot } from "../src/model/TexasHoldemGameState";
import {TestHelpers} from "./test-helpers";
import {SetTableOptionRequest} from "../../poker.ui/src/shared/ClientMessage";
import { IBroadcastService } from "../src/services/IBroadcastService";
import { Currency } from '../../poker.ui/src/shared/Currency';
import { PokerStreetType } from '../src/model/table/PokerStreetType';
import { PostShowdownEvent } from '../src/model/table/PostShowdownEvent';
import { DbGameResults } from '../src/model/table/DbGameResults';

describe('two-player-table-fixture', function () {
    
    var table:Table;
    var subscriber: WebSocketHandle;
    var subscriber2: WebSocketHandle;
    var subscriber3: WebSocketHandle;
    var socket1:MockWebSocket;
    var socket2:MockWebSocket;
    var socket3:MockWebSocket;
    var timerProvider: any;

    let getTableSubscriber = function (guid: string): WebSocketHandle {      
      let socket = new MockWebSocket();
      let subscriber = new WebSocketHandle(socket);
      let user = new User();
      user.guid = guid;
      user.screenName = "player-" + guid;
      subscriber.user = user;
      return subscriber;
    }
  
    beforeEach(function() {
      substitute.throwErrors();
        table = new Table(TestHelpers.getTableConfig());
        table.minNumPlayers = 2;
      table.tableConfig.timeToActSec = 25;
      timerProvider = substitute.for({ startTimer: () => ({ guid: '' }) });      
      timerProvider.callsThrough('startTimer');
      table.timerProvider = timerProvider;
      subscriber = getTableSubscriber("guid1"); 
      socket1 = subscriber.socket as MockWebSocket;
      table.addSubscriber(subscriber);
      socket1.clearMessages();//clear out sub message

      subscriber2 = getTableSubscriber("guid2");
      subscriber3 = getTableSubscriber("guid3");
      socket2 = subscriber2.socket as MockWebSocket;
      socket3 = subscriber3.socket as MockWebSocket;
  });
  

  let assertBroadcast = function(assertFunc: (data: DataContainer) => void): void {
    for (let socket of [socket1, socket2, socket3]) {
      let lastMessage = socket.getLastMessage();
      if (!lastMessage)
        assert.fail(true, false, 'last msg not defined');
      assertFunc(lastMessage);
      socket.outgoingMessages.pop();
    }
  }
  let clearMessages = function() {
    for (let socket of [socket1, socket2, socket3])
      socket.clearMessages();
  }

  let setup2PlayerGame = function() {
    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);    
    table.setCurrentPlayers(table.getPlayers().slice());    
    table.currentPlayers[0].holecards = ['AD', 'KD'];    
    table.currentPlayers[1].holecards = ['2S', '3S']; 
  }
  
  let setup2PlayerGamePreFlop = function () {
    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);        
    table.setCurrentPlayers(table.getPlayers().slice());
    table.dealerSeat = 1;
    table.playerNextToActIndex = 0;
    table.firstToActIndex = 0;
    table.lastToActIndex = 1;
    table.toCall = 1;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 3;

    
    table.currentPlayers[0].stack = 999;    
    table.currentPlayers[0].bet = 1;    
    
    table.currentPlayers[1].stack = 998;
    table.currentPlayers[1].bet = 2;
  }
    

    it('deal hole cards', function () {
      table.addSubscriber(subscriber2);
      table.addSubscriber(subscriber3);
      let result1 = table.handleJoinTableRequest(TestHelpers.getJoinTableRequest(1, subscriber));
      assert.equal(result1.success, true, result1.errorMessage);
      let result2 = table.handleJoinTableRequest(TestHelpers.getJoinTableRequest(5, subscriber2));
      assert.equal(result2.success, true, result2.errorMessage);
      socket1.clearMessages();
      socket2.clearMessages();
      socket3.clearMessages();

      table.dealHoleCards();      

      assert.equal(table.gameStarting, null);
      assert.equal(table.dealerSeat, 1);
      assert.equal(table.lastToActIndex, 1);
      assert.equal(table.playerNextToActIndex, 0); 
      assert.equal(table.toCall, 1);      
      assert.equal(table.gameState.pots[0].amount, 3);      
      assert.equal((table.gameState.pots[0].players[0] as any).guid, "guid1");
      assert.equal((table.gameState.pots[0].players[1] as any).guid, "guid2");
      assert.equal(table.getPlayers()[table.playerNextToActIndex].seat, 1);      
      assert.equal(socket1.outgoingMessages.length, 1);      
      let data1 = socket1.outgoingMessages[0];      
      assert.equal(data1.deal!=null, true);      
      assert.equal(data1.game.dealer, 1);
      assert.equal(data1.deal.holecards.length, 2);
      assert.equal(data1.deal.holecards[0].length >= 2, true);      
      assert.equal(data1.deal.holecards[1].length >= 2, true);
      assert.equal(data1.tableSeatEvents.seats.length, 2);

      //blinds rules different for two players
      assert.equal(data1.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data1.tableSeatEvents.seats[0].bet, 1);//small blind
      assert.equal(data1.tableSeatEvents.seats[0].stack, 999);
      assert.equal(data1.tableSeatEvents.seats[0].playercards, null);
      assert.equal(table.currentPlayers[0].stack, 999);
      assert.equal(data1.tableSeatEvents.seats[0].myturn, true);      
      assert.equal(data1.tableSeatEvents.seats[1].seat, 5);
      assert.equal(data1.tableSeatEvents.seats[1].bet, 2);//big blind
      assert.equal(data1.tableSeatEvents.seats[1].stack, 998);
      assert.equal(data1.tableSeatEvents.seats[1].playercards, null);
      assert.equal(table.currentPlayers[1].stack, 998);
      assert.equal(data1.tableSeatEvents.seats[1].myturn, null);
      assert.equal(data1.game.pot[0], 3);
      assert.equal(data1.game.tocall, 1);      
      

      assert.equal(socket2.outgoingMessages.length, 1);
      let data2 = socket2.outgoingMessages[0];      
      assert.equal(data2.deal.holecards.length, 2);
      assert.equal(data2.deal.holecards[0].length >= 2, true);
      assert.equal(data2.deal.holecards[1].length >= 2, true);      

      assert.equal(table.deck.cards.length, 48);
  });

  it('lastToActIndex is set correctly for disconnected player', ()=>{
    setup2PlayerGamePreFlop();    
    table.getPlayerAtSeat(5).isDisconnected = true;

    table.handleBet(10, subscriber.user.guid);
    
    assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.lastToActIndex, 1);
  })

  it('round 1 first to act calls', function () {
    setup2PlayerGamePreFlop();    
    

    table.handleBet(1, subscriber.user.guid);

    timerProvider.receivedWith('startTimer', substitute.arg.matchUsing((func: any) => { return func != undefined && func.name === 'startPlayerTimer'; }), table.tableConfig.timeToActSec*1000, table);    
    assert.equal(table.playerTimer.guid, 'guid3');
    assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.lastToActIndex, 1);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);
    assertBroadcast(data => {
      assert.equal(data.game.tocall, 0);
      assert.equal(data.game.pot[0], 4);
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data.tableSeatEvents.seats[0].stack, 998);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);
      assert.equal(data.tableSeatEvents.seats[0].bet, 2);
      assert.equal(data.tableSeatEvents.seats[0].hasRaised, false);
      assert.equal(data.tableSeatEvents.seats[0].hasCalled, true);
      assert.equal(data.tableSeatEvents.seats[1].seat, 5);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);
    });

    

  });

  it('round 1 first to act raises', function () {
    setup2PlayerGamePreFlop();

    table.handleBet(9, subscriber.user.guid);

    assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);
    assertBroadcast(data => {
      assert.equal(data.game.tocall, 8);
      assert.equal(data.game.pot[0], 12);
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data.tableSeatEvents.seats[0].stack, 990);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);
      assert.equal(data.tableSeatEvents.seats[0].bet, 10);
      assert.equal(data.tableSeatEvents.seats[0].hasRaised, true);
      assert.equal(data.tableSeatEvents.seats[1].seat, 5);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);
    });

    

  });

  it('cannot bet less than call amount', function () {
    setup2PlayerGamePreFlop();
    table.handleBet(0, subscriber.user.guid);
    
    assert.equal(socket1.outgoingMessages.length, 1);
    assert.equal(socket1.outgoingMessages[0].error.message, 'bet amount of 0.00 is less than the call amount of 0.01');
    assert.equal(socket2.outgoingMessages.length, 0);
    assert.equal(socket3.outgoingMessages.length, 0);
  });

  it('cannot bet more than stack', function() {
    setup2PlayerGamePreFlop();
    table.handleBet(1000, subscriber.user.guid);

    assert.equal(socket1.outgoingMessages.length, 1);
    assert.equal(socket1.outgoingMessages[0].error.message, 'bet amount of 10.00 is larger than your stack of 9.99');
    assert.equal(socket2.outgoingMessages.length, 0);
    assert.equal(socket3.outgoingMessages.length, 0);
  });

  it('cannot bet between rounds', function() {
    setup2PlayerGamePreFlop();
    table.playerNextToActIndex = -1;

    table.handleBet(9, subscriber.user.guid);

    assert.equal(socket1.outgoingMessages.length, 1);
    assert.equal(socket1.outgoingMessages[0].error.message, 'cannot bet between rounds');
    assert.equal(socket2.outgoingMessages.length, 0);
    assert.equal(socket3.outgoingMessages.length, 0);

  });

  it('cannot fold between rounds', function() {
    setup2PlayerGamePreFlop();
    table.playerNextToActIndex = -1;

    table.handleFold(subscriber.user.guid);

    assert.equal(socket1.outgoingMessages.length, 1);
    assert.equal(socket1.outgoingMessages[0].error.message, 'cannot fold between rounds');
    assert.equal(socket2.outgoingMessages.length, 0);
    assert.equal(socket3.outgoingMessages.length, 0);

  });

  it('round 1 last to act folds', function () {
    setup2PlayerGamePreFlop();
    table.handleBet(9, subscriber.user.guid);
    clearMessages();

    table.handleFold(subscriber3.user.guid);

    socket3.checkNoErrorMessages();
    assertBroadcast(data => {
      assert.equal(data.game.tocall, null);

      assert.equal(data.tableSeatEvents.seats.length, 1);
      assert.equal(data.tableSeatEvents.seats[0].seat, 5);
      assert.equal(data.tableSeatEvents.seats[0].hasFolded, true);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);      
    });
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.showdownAfterAllFoldDelaySec * 1000, table);
  });

  it('round 1 last to act calls', function () {
    setup2PlayerGamePreFlop();
    table.handleBet(1, subscriber.user.guid);
    clearMessages();

    table.handleBet(0, subscriber3.user.guid);

    assert.equal(table.street, PokerStreetType.flop);
    assert.equal(table.playerNextToActIndex, -1);    
    assert.equal(socket3.outgoingMessages.length, 1);
    socket3.checkNoErrorMessages();
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);
    assertBroadcast(data => {
      assert.equal(data.game.tocall, 0);
      assert.equal(data.game.pot[0], 4);
      assert.equal(data.game.action, 'check');
      assert.equal(data.game.chipsToPot, true);
      assert.equal(data.game.street, 'flop');

      assert.equal(data.tableSeatEvents.seats.length, 1);
      assert.equal(data.tableSeatEvents.seats[0].seat, 5);
      assert.equal(data.tableSeatEvents.seats[0].hasCalled, true);      
    });

  });

  it('round 1 last to act raises', function () {
    setup2PlayerGamePreFlop();
    table.handleBet(1, subscriber.user.guid);
    clearMessages();


  });

  it('deal flop', function() {
    setup2PlayerGame();    
    table.gameState = new TexasHoldemGameState();
    table.playerNextToActIndex = -1;
    table.dealerSeat = 1;
    table.deck = new Deck();
    clearMessages();    
    table.street = PokerStreetType.flop;

    table.dealCommunityCards();

    assert.equal(table.gameState.boardCards.length, 3);
    assert.equal(table.getPlayers()[table.playerNextToActIndex].seat, 5);
    assert.equal(table.getPlayers()[table.lastToActIndex].seat, 1);
    assertBroadcast(data => {
      
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);
      assert.equal(data.tableSeatEvents.seats[0].bet, 0);
      assert.equal(data.tableSeatEvents.seats[0].playercards, undefined);

      assert.equal(data.tableSeatEvents.seats[1].seat, 5);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);
      assert.equal(data.tableSeatEvents.seats[1].bet, 0);
      assert.equal(data.tableSeatEvents.seats[1].playercards, undefined);

      assert.equal(data.deal.board.length, 3);
      assert.equal(table.deck.cards.length, 49);
      
    });

  });

  it('round 2 last to act checks', function() {
      setup2PlayerGame();
    table.toCall = 0;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 1;
    table.lastToActIndex = 0;
    table.dealerSeat = 1;
    table.street = PokerStreetType.flop;
    table.deck = new Deck();    
    table.handleBet(0, subscriber3.user.guid);
    clearMessages();

    table.handleBet(0, subscriber.user.guid);

    assert.equal(table.street, PokerStreetType.turn);
    assert.equal(table.playerNextToActIndex, -1);
    assert.equal(socket3.outgoingMessages.length, 1);
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec*1000, table);
    assertBroadcast(data => {
      assert.equal(data.game.tocall, 0);
      assert.equal(data.game.pot[0], 4);
      assert.equal(data.game.action, 'check');
      assert.equal(data.game.chipsToPot, true);
      assert.equal(data.game.street, 'turn');
    });

  });

  it('deal turn', function() {
    setup2PlayerGame();
    table.gameState = new TexasHoldemGameState();
    table.playerNextToActIndex = -1;
    table.dealerSeat = 1;
    table.deck = new Deck();
    table.gameState.boardCards = ['2S', '3S', '4S'];
    clearMessages();
    table.street = PokerStreetType.turn;

    table.dealCommunityCards();
    assert.equal(table.gameState.boardCards.length, 4);

    assert.equal(table.getPlayers()[table.playerNextToActIndex].seat, 5);
    assert.equal(table.getPlayers()[table.lastToActIndex].seat, 1);
    assertBroadcast(data => {

      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);
      assert.equal(data.tableSeatEvents.seats[0].bet, 0);
      assert.equal(data.tableSeatEvents.seats[0].playercards, undefined);
      assert.equal(data.tableSeatEvents.seats[1].seat, 5);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);
      assert.equal(data.tableSeatEvents.seats[1].bet, 0);
      assert.equal(data.tableSeatEvents.seats[1].playercards, undefined);
      assert.equal(data.deal.board.length, 4);
      assert.equal(table.deck.cards.length, 51);

    });

  });

  it('river last to act checks and goes to showdown', function () {
    setup2PlayerGame();
    table.toCall = 0;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 1;
    table.lastToActIndex = 0;
    table.dealerSeat = 1;
    table.street = PokerStreetType.river;
    table.deck = new Deck();
    table.handleBet(0, subscriber3.user.guid);
    clearMessages();

    table.handleBet(0, subscriber.user.guid);

    assert.equal(table.street, 'showdown');
    assert.equal(table.playerNextToActIndex, -1);
    assert.equal(socket3.outgoingMessages.length, 1);
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);
    assertBroadcast(data => {
      assert.equal(data.game.tocall, 0);
      assert.equal(data.game.pot[0], 4);
      assert.equal(data.game.action, 'check');
      assert.equal(data.game.chipsToPot, true);
      assert.equal(data.game.street, 'showdown');
    });

  });

  it('showdown', async () => {
    setup2PlayerGame();
    table.dataRepository = TestHelpers.getDataRepository();
    let seat1 = table.getPlayerAtSeat(1);
    let seat5 = table.getPlayerAtSeat(5);
    seat1.stack = 100000;
    seat5.stack = 100000;
    seat1.setBet(400);//$4
    seat5.setBet(100000);//$1,000
    table.street = 'showdown';
    table.toCall = 0;    
    table.gameState = new TexasHoldemGameState();    
    table.gameState.boardCards = ['4S', '5S', '6S', '8H', 'JC'];
    seat1.holecards = ['AH', 'KH'];
    seat5.holecards = ['2S', '3S'];
    clearMessages();

    await table.handleShowdown();
    
    assert.equal(seat1.stack, 99600);
    assert.equal(seat5.stack, 100400);
    assert.equal(table.street, null);
    assert.equal(table.gameState.pots[0].amount, 800);      
    assertBroadcast(data => {
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].playercards[0], 'AH');
      assert.equal(data.tableSeatEvents.seats[0].playercards[1], 'KH');
      assert.equal(data.tableSeatEvents.seats[1].playercards[0], '2S');
      assert.equal(data.tableSeatEvents.seats[1].playercards[1], '3S');      
      assert.equal(data.game.potResults.length, 1);      
      assert.equal(data.game.potResults[0].amount, 100400);      
      assert.equal(data.game.potResults[0].seatWinners[0], 5);//seat 5
      assert.equal(data.game.potResults[0].winningHand, 'Straight Flush');
      
    });

  });

  it('player folds preflop', async () => {
    setup2PlayerGame();
    table.dataRepository = TestHelpers.getDataRepository();
    let seat1 = table.getPlayerAtSeat(1);
    let seat5 = table.getPlayerAtSeat(5);
    seat1.stack = 100000;
    seat5.stack = 100000;
    seat1.setBet(100);//$1
    seat5.setBet(200);//$2
    table.street = 'showdown';
    table.gameState = new TexasHoldemGameState();    
    seat1.hasFolded = true;
    clearMessages();

    await table.handleShowdown();
    
    
    assertBroadcast(data => {
      
      assert.equal(data.game.potResults[0].seatWinners[0], 5);//seat 5
      
    });

  });

  it('incrementPlayerNextToActIndex seat 1 to seat 2', function () {
    setup2PlayerGame();

    table.incrementPlayerNextToActIndex(0, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, 1);
  });

  it('incrementPlayerNextToActIndex loops around', function () {
    setup2PlayerGame();

    table.incrementPlayerNextToActIndex(1, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, 0);
  });

  it('incrementPlayerNextToActIndex where player has folded', function () {
    setup2PlayerGame();
    table.currentPlayers[0].hasFolded = true;

    table.incrementPlayerNextToActIndex(1, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, -1);
  });

  it('handlePlayerTimeout player not next to act', function () {

    setup2PlayerGame();
    table.toCall = 0;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 0;
    table.lastToActIndex = 1;
    table.dealerSeat = 1;
    table.street = PokerStreetType.flop;
    table.deck = new Deck();
    clearMessages();

    table.handlePlayerTimeout(1);

    assert.equal(table.playerNextToActIndex, 0);
    assert.equal(0, socket3.outgoingMessages.length);

  });

  it('handlePlayerTimeout calls', function () {

    setup2PlayerGame();
    table.toCall = 0;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 0;
    table.lastToActIndex = 1;
    table.dealerSeat = 1;
    table.street = PokerStreetType.flop;
    table.deck = new Deck();
    clearMessages();

    table.handlePlayerTimeout(table.playerNextToActIndex);

    socket1.checkNoErrorMessages();
    assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.currentPlayers[0].sitOutNextHand, true);
    assert.equal(socket1.getLastMessage().setTableOptionResult.sitOutNextHand, true);
    
    
    
  });

  it('handlePlayerTimeout folds', function () {

    setup2PlayerGame();
    table.toCall = 2;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 0;
    table.lastToActIndex = 1;
    table.dealerSeat = 1;
    table.street = PokerStreetType.flop;
    table.deck = new Deck();
    clearMessages();

    table.handlePlayerTimeout(table.playerNextToActIndex);

    socket1.checkNoErrorMessages();
    assert.equal(table.toCall, null);
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.showdownAfterAllFoldDelaySec * 1000, table);
  });

  it('all in last to act raises', function () {

    setup2PlayerGame();
    table.currentPlayers[0].stack = 0;    
    table.toCall = 500;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 1;
    table.lastToActIndex = 1;            
    clearMessages();

    table.handleBet(1000, subscriber3.user.guid);

    socket3.checkNoErrorMessages();
    assert.equal(table.lastToActIndex, -1);
    assert.equal(table.playerNextToActIndex, -1);
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);
  });

  it('all in small stack after big stack all in', function () {

    setup2PlayerGame();
    table.currentPlayers[0].stack = 500;
    table.toCall = 1000;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 0;
    table.lastToActIndex = 0;
    clearMessages();

    table.handleBet(500, subscriber.user.guid);

    socket1.checkNoErrorMessages();
    assert.equal(table.lastToActIndex, -1);
    assert.equal(table.playerNextToActIndex, -1);
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);
  });

  it('deal flop when all in', function () {
    setup2PlayerGame();
    table.currentPlayers[0].stack = 0;
    table.gameState = new TexasHoldemGameState();
    table.playerNextToActIndex = -1;
    table.lastToActIndex = -1;
    table.dealerSeat = 1;
    table.deck = new Deck();
    clearMessages();
    table.street = PokerStreetType.flop;

    table.dealCommunityCards();

    assert.equal(table.lastToActIndex, -1);
    assert.equal(table.playerNextToActIndex, -1);

    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);    
    assertBroadcast((data:DataContainer)=>{
      // 
      let seat1 = data.tableSeatEvents.seats.find(s=>s.seat==1);
      let seat5 = data.tableSeatEvents.seats.find(s=>s.seat==5);
      assert.equal(seat1.myturn, false);
      assert.equal(seat1.playercards[0], 'AD');
      assert.equal(seat1.playercards[1], 'KD');
      assert.equal(seat5.myturn, false);
      assert.equal(seat5.playercards[0], '2S');
      assert.equal(seat5.playercards[1], '3S');
    })
  });

  it('should not go to flop when big stack goes all in and smaller stack has a chance to act', function () {

    setup2PlayerGame();
    table.currentPlayers[0].stack = 500;
    table.toCall = 17;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 4;
    table.playerNextToActIndex = 1;
    table.lastToActIndex = 1;
    clearMessages();

    table.handleBet(1000, subscriber3.user.guid); 

    socket3.checkNoErrorMessages();
    assert.equal(table.lastToActIndex, 0);
    assert.equal(table.playerNextToActIndex, 0);
    timerProvider.receivedWith('startTimer', substitute.arg.matchUsing((func: any) => { return func != undefined && func.name === 'startPlayerTimer'; }), table.tableConfig.timeToActSec * 1000, table);    
  });

  it('postShowdown', async () => {
    setup2PlayerGame();    
    table.tableConfig.maxPlayers = 9;
    table.currentPlayers[0].holecards = ['AD', 'KD'];    
    table.currentPlayers[1].holecards = ['2S', '3S']; 
    
    
    for(let i=0;i<9;i++)
      table.pastPlayers.push([]);      

    await table.postShowdown();

    assertBroadcast(data => {
      assert.equal(data.gameStarting.isStarting, true);
    });
    assertBroadcast(data => {
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].playercards, null);
      assert.equal(data.tableSeatEvents.seats[1].playercards, null);
    });
    assert.equal(table.currentPlayers, null);
    assert.equal(table.pastPlayers.length, 9);
    assert.equal(table.pastPlayers[8].length, 2);
    assert.equal(table.pastPlayers[8][0].seat, 1);
    assert.equal(table.pastPlayers[8][1].seat, 5);
    for (let player of table.getPlayers())
      assert.equal(null, player.holecards);
    

  });

  it('player is unseated after stack is less than big blind', async () => {

    setup2PlayerGame();
    table.dataRepository = TestHelpers.getDataRepository();
    table.currentPlayers[1].stack = 1;
    let receivedBroadcastTableConfigUpdate: boolean = false;
    let broadcastService:any = TestHelpers.getSubstitute(IBroadcastService);
    table.broadcastService = broadcastService;
    let receivedPlayerBusted:boolean = false;
    table.onPostShowdown = (e:PostShowdownEvent) => { receivedPlayerBusted = e.bustedPlayers.length==1; return Promise.resolve(); }
    clearMessages();

    await table.postShowdown();

    assert.equal(receivedPlayerBusted, true)
    assertBroadcast(data => {      
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 5);
      assert.equal(data.tableSeatEvents.seats[0].empty, true);      
      assert.equal(data.tableSeatEvents.seats[1].seat, 1);      
      assert.equal(data.tableSeatEvents.seats[1].empty, false);
      
    });

    assert.equal(table.currentPlayers, null);
    assert.equal(table.getPlayers().length, 1);
    assert.equal(table.getPlayers()[0].seat, 1);    
    broadcastService.receivedWith('broadcast', substitute.arg.matchUsing((data: DataContainer) => {
      if(data != undefined){
        assert.equal(1, data.tableConfigs.rows.length)
        return true;
      }
      return false;

    }));
    
  });

  it('player is started when player sits back in', function () {

    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);
    table.getPlayers()[0].sitOutNextHand = true;
    clearMessages();
    let request = new SetTableOptionRequest(undefined);
    request.sitOutNextHand = false;

    table.handleSetTableOptionRequest(request, subscriber.user.guid);

    assert.equal(socket1.dequeue().setTableOptionResult.sitOutNextHand, false);
    
    assertBroadcast(data => {      
      assert.equal(data.tableSeatEvents.seats.length, 1);
      assert.equal(data.tableSeatEvents.seats[0].isSittingOut, false);
    });
    assertBroadcast(data => {
      assert.equal(data.gameStarting.startsInNumSeconds, 3);
    });

    assert.notEqual(table.gameStarting, null);

  });

  it('rake with crypto', function () {
    setup2PlayerGame();
    let dataRepository = <any>TestHelpers.getDataRepository();
    table.tableConfig.rake = 1.5;
    table.tableConfig.currency = Currency.dash;
    table.dataRepository = dataRepository;
    table.currentPlayers[0].stack = 603939;
    table.currentPlayers[0].setBet(575180);
    table.currentPlayers[1].stack = 661457;
    table.currentPlayers[1].setBet(661457);    
    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ['4S', '5S', '6S', '8H', 'JC'];
    table.currentPlayers[0].holecards = ['AH', 'KH'];
    table.currentPlayers[1].holecards = ['2S', '3S'];
   
    table.handleShowdown();

    let expectedRake = 17255;
    assert.equal(table.currentPlayers[0].stack, 28759);
    assert.equal(table.currentPlayers[1].stack, 1236637 - expectedRake);    
    dataRepository.receivedWith('saveGame', substitute.arg.matchUsing((arg: DbGameResults) => {
      //if (arg != undefined) console.log('arg.players', arg.players);

      return arg != undefined &&
        arg.potResults[0].allocations[0].amount === 1150360 &&
        arg.players[0].stack === 28759 &&
        arg.players[0].profitLoss === -575180 &&
        arg.players[0].rake === 0 &&
        arg.players[1].stack === 1236637 - expectedRake &&
        arg.players[1].profitLoss === 575180 - expectedRake &&
        arg.players[1].rake === expectedRake;//17255.4

    }));

  });

  it('rake with free', ()=> {
    setup2PlayerGame();
    let dataRepository = <any>TestHelpers.getDataRepository();
    table.tableConfig.rake = 1.55;
    table.dataRepository = dataRepository;
    table.currentPlayers[0].stack = 21;
    table.currentPlayers[0].setBet(21);
    table.currentPlayers[1].stack = 17;
    table.currentPlayers[1].setBet(17);
    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ['4S', '5S', '6S', '8H', 'JC'];
    table.currentPlayers[0].holecards = ['AH', 'KH'];
    table.currentPlayers[1].holecards = ['2S', '3S'];

    table.handleShowdown();

    let expectedRake = 1;//0.527
    assert.equal(table.currentPlayers[0].stack, 4);
    assert.equal(table.currentPlayers[1].stack, 34 - expectedRake);        

    dataRepository.receivedWith('saveGame', substitute.arg.matchUsing((arg: DbGameResults) => {
      //if (arg != undefined) console.log('arg.players', arg.players);

      return arg != undefined &&
        arg.potResults[0].allocations[0].amount === 34 &&
        arg.players[0].stack === 4 &&
        arg.players[0].profitLoss === -17 &&
        arg.players[0].rake === 0 &&
        arg.players[1].stack === 34 - expectedRake &&
        arg.players[1].profitLoss === 17 - expectedRake &&
        arg.players[1].rake === expectedRake;

    }));
  });

  it('rake player folds', function () {
    setup2PlayerGame();
    let dataRepository = <any>TestHelpers.getDataRepository();
    table.tableConfig.rake = 1.55;
    table.dataRepository = dataRepository;
    table.currentPlayers[0].stack = 217;
    table.currentPlayers[0].setBet(217);
    table.currentPlayers[1].stack = 17;
    table.currentPlayers[1].setBet(17);
    table.currentPlayers[1].hasFolded = true;
    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ['4S', '5S', '6S', '8H', 'JC'];
    table.currentPlayers[0].holecards = ['AH', 'KH'];
    table.currentPlayers[1].holecards = ['2S', '3S'];

    table.handleShowdown();

    let expectedRake = 1;
    assert.equal(table.currentPlayers[0].stack, 234 - expectedRake);
    assert.equal(table.currentPlayers[1].stack, 0);

    dataRepository.receivedWith('saveGame', substitute.arg.matchUsing((arg: DbGameResults) => {
      //if (arg != undefined) console.log('arg.players', arg.players);

      return arg != undefined &&
        arg.potResults[0].allocations[0].amount === 34 &&
        arg.players[0].stack === 234 - expectedRake &&
        arg.players[0].profitLoss === 17 - expectedRake &&
        arg.players[0].rake === expectedRake &&
        arg.players[1].stack === 0 &&
        arg.players[1].profitLoss === -17 &&
        arg.players[1].rake === 0;

    }));

    
  });

  it('addition', function () {
    //9007199254740991
    //50000000000000000
    let result = parseInt('50000000000000000') + parseInt('5811796448440467');
      //console.log('result', result);
  });

  it('player_with_dust_balance_remaining_cannot_act_on_next_round', ()=> {
    setup2PlayerGame();
    let dataRepository = <any>TestHelpers.getDataRepository();
    
    table.tableConfig.currency = Currency.dash;
    table.currencyUnit = 100000000;
    table.tableConfig.exchangeRate = 995.619;
    table.tableConfig.smallBlind = 5022;    
    table.tableConfig.bigBlind = table.tableConfig.smallBlind*2;        
    table.dataRepository = dataRepository;
    table.currentPlayers[0].stack = 1543717-1268493;    //275,224
    table.currentPlayers[1].stack = 12272626-1268493;    
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.boardCards = ['4S', '5S', '6S', '8H', 'JC'];
    table.currentPlayers[0].holecards = ['AH', 'KH'];
    table.currentPlayers[1].holecards = ['2S', '3S'];
    table.playerNextToActIndex = 1;
    table.lastToActIndex = 0;
    table.street = PokerStreetType.flop;
    table.dealerSeat = 5;
    table.deck = new Deck();

    table.handleBet(275191, subscriber3.user.guid);    
    socket3.checkNoErrorMessages();
    table.handleBet(275191, subscriber.user.guid);
    socket1.checkNoErrorMessages();

    table.dealCommunityCards();
    assert.equal(table.playerNextToActIndex, -1);
    assert.equal(table.lastToActIndex, -1);

  });

  it('player_who_is_next_to_become_dealer_moves_seat_expect_no_error', ()=> {
    setup2PlayerGame();
    table.dealerSeat = 5;
    table.pastPlayers.push( [ { guid:'guid1', seat: 2 }, { guid:'guid3', seat: 5 }])

    table.currentPlayers[0].stack = 2;
    table.dealHoleCards();    

    assert.equal(table.playerNextToActIndex, 0);
    assert.equal(table.dealerSeat, 1);

  });
  
  it('post showdown event fired', async () => {
    
    setup2PlayerGame();
    let postShowdownEvent:PostShowdownEvent;
    table.onPostShowdown = (event:PostShowdownEvent) =>{
      
      return new Promise((resolve, reject)=>{
        setTimeout(()=>{
          postShowdownEvent = event;
          resolve();
        }, 0)
      })
    }
    
    await table.postShowdown();

    assert.notEqual(undefined, postShowdownEvent);
    assert.equal(table, postShowdownEvent.table);
    assertBroadcast(data => {      
      assert.equal(data.gameStarting.isStarting, true);
    });

  });

  it('GameStartingEvent supressed when PostShowdownEvent is handled', async () => {
    
    setup2PlayerGame();
    let postShowdownEvent:PostShowdownEvent;
    table.onPostShowdown = (event:PostShowdownEvent) =>{
      
      return new Promise((resolve, reject)=>{
        setTimeout(()=>{
          postShowdownEvent = event;
          event.handled = true;
          resolve();
        }, 0)
      })
    }
    
    await table.postShowdown();

    assert.notEqual(undefined, postShowdownEvent);
    assert.equal(table, postShowdownEvent.table);
    assertBroadcast(data => {      
      assert.equal(data.gameStarting, undefined);
    });

  });

  it('player who is currently playing but disconnected is not skipped', async () => {
    
    setup2PlayerGamePreFlop();    
    table.getPlayers().find(h=>h.seat==5).isDisconnected = true;

    table.handleBet(1, subscriber.user.guid);

    assert.equal(table.playerNextToActIndex, 1)
    timerProvider.receivedWith('startTimer', substitute.arg.matchUsing((func: any) => { return func != undefined && func.name === 'startPlayerTimer'; }), table.tableConfig.timeToActSec*1000, table);    
    

  });

  it('showdown all in', async () => {
    setup2PlayerGame();
    table.dataRepository = TestHelpers.getDataRepository();
    let seat1 = table.getPlayerAtSeat(1);
    let seat5 = table.getPlayerAtSeat(5);
    seat1.stack = 400;
    seat5.stack = 100000;
    seat1.setBet(400);//$4
    seat5.setBet(100000);//$1,000
    table.street = 'showdown';
    table.gameState = new TexasHoldemGameState();    
    table.gameState.boardCards = ['4S', '5S', '6S', '8H', 'JC'];
    seat1.holecards = ['AS', 'KS'];
    seat5.holecards = ['2S', '3H'];
    clearMessages();

    await table.handleShowdown();
    
    assert.equal(seat1.stack, 800);
     assert.equal(seat5.stack, 99600);
    assert.equal(table.street, null);
    
    assertBroadcast(data => {
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.game.potResults[0].amount, 800);      
      assert.equal(data.game.potResults.length, 1);      
      assert.equal(data.game.potResults[0].seatWinners[0], 1);//seat 1
      assert.equal(data.game.potResults[0].winningHand, 'Flush');
      
    });

  });

  it('cannot bet less than the big blind', () => {

    setup2PlayerGamePreFlop();    
    table.tableConfig.smallBlind = 10;
    table.tableConfig.bigBlind = 20;
    
    table.handleBet(2, subscriber.user.guid);
    
    var message = socket1.getLastMessage();
    assert.equal(message.error != null, true, JSON.stringify(message))
    assert.equal(message.error.message, `Bet of 0.02 is invalid. The minimum bet or raise must be at least the big blind of 0.20`);

  });

  it('must raise by at least the big blind', () => {

    setup2PlayerGamePreFlop();    
    table.tableConfig.smallBlind = 10;
    table.tableConfig.bigBlind = 20;
    table.toCall = 20;

    table.handleBet(21, subscriber.user.guid);
    
    var message = socket1.getLastMessage();
    assert.equal(message.error != null, true, JSON.stringify(message))
    assert.equal(message.error.message, `Bet of 0.21 is invalid. The minimum bet or raise must be at least the big blind of 0.20`);

  });

  it('A raise must be at least the size of the largest previous bet or raise of the current betting round', () => {

    setup2PlayerGamePreFlop();    
    table.tableConfig.smallBlind = 10;
    table.tableConfig.bigBlind = 20;
    table.toCall = 2;
    table.handleBet(100, subscriber.user.guid);

    table.handleBet(150, subscriber3.user.guid);
    
    var message = socket3.getLastMessage();
    assert.equal(message.error != null, true, JSON.stringify(message))
    assert.equal(message.error.message, `Bet of 1.50 is invalid. A raise must be at least the size of the largest previous bet or raise (0.98)`);

  });
    
});