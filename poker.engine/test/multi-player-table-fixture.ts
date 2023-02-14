import { SeatHistory } from './../src/model/seat-history';
//mocha: use --grep multi-player-table-fixture to run specific files

import * as assert from 'assert';
import substitute = require('jssubstitute');
import { Table } from "../src/table";
import { WebSocketHandle, IWebSocket } from "../src/model/WebSocketHandle";
import { MockWebSocket } from "./mockWebSocket";
import { DataContainer, Account,  } from "../../poker.ui/src/shared/DataContainer";
import { Currency } from "../../poker.ui/src/shared/Currency";
import { User } from "../src/model/User";
import { Deck } from "../src/deck";
import {TexasHoldemGameState, GamePot } from "../src/model/TexasHoldemGameState";
import {TestHelpers} from "./test-helpers";
import {UserTableAccount} from "../src/model/TableBalance";
import { CommonHelpers } from '../../poker.ui/src/shared/CommonHelpers';
import { AutoOptionResult } from "../../poker.ui/src/shared/AutoOptionResult";
import { SetTableOptionRequest } from '../../poker.ui/src/shared/ClientMessage';
import { ISubscriber } from '../src/model/ISubscriber';
import { TableState } from '../src/model/TableState';
import { IBroadcastService } from '../src/services/IBroadcastService';
import { IDataRepository } from '../src/services/documents/IDataRepository';
import { ISubstitute } from './shared-test-helpers';
import { PlayerTableHandle } from '../src/model/table/PlayerTableHandle';
import { PokerStreetType } from '../src/model/table/PokerStreetType';
import { PostShowdownEvent } from '../src/model/table/PostShowdownEvent';
import { JoinTableRequest } from '../src/model/table/JoinTableRequest';
import { DbGameResults } from '../src/model/table/DbGameResults';

describe('multi-player-table-fixture', ()=> {
    
  

  var table: Table;
    var subscriber: WebSocketHandle;
    var subscriber2: WebSocketHandle;
    var subscriber3: WebSocketHandle;
    var subscriber4: WebSocketHandle;
    var subscriber5: WebSocketHandle;
    var socket1:MockWebSocket;
    var socket2:MockWebSocket;
    var socket3: MockWebSocket;
    var socket4: MockWebSocket;
    var timerProvider: any;
        
    beforeEach(function() {
      substitute.throwErrors();
      table = new Table(TestHelpers.getTableConfig());    
      table.tableConfig.timeToActSec = 25;
      table.minNumPlayers = 3;      
      timerProvider = substitute.for({ startTimer: () => ({ guid: '' }) });
      timerProvider.callsThrough('startTimer');
      table.timerProvider = timerProvider;
      subscriber = getTableSubscriber("guid1"); 
      socket1 = subscriber.socket as MockWebSocket;
      table.addSubscriber(subscriber);
      socket1.clearMessages();//clear out sub message

      subscriber2 = getTableSubscriber("guid2");
      subscriber3 = getTableSubscriber("guid3");
      subscriber4 = getTableSubscriber("guid4");
      subscriber5 = getTableSubscriber("guid5");
      socket2 = subscriber2.socket as MockWebSocket;
      socket3 = subscriber3.socket as MockWebSocket;
      socket4 = subscriber4.socket as MockWebSocket;
    });

    
  let setupGameState = () => {
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 3;
    for (let player of table.currentPlayers)
      player.playing = true;
    table.deck = new Deck();
  }
    

  let setup3PlayerGame = function () {
    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);    
    TestHelpers.addPlayerHandle(table, 5, subscriber3);    
    
    table.setCurrentPlayers(table.getPlayers().slice());    
    table.currentPlayers[1].bet = 1;
    table.currentPlayers[2].bet = 2;
    table.dealerSeat = 1;
    table.playerNextToActIndex = 0;
    table.currentPlayers[0].myturn = true;
    table.lastToActIndex = 2;
    table.toCall = 2;
    setupGameState();
    
  }

  let getPlayerHandle = (subscriber:WebSocketHandle) :  PlayerTableHandle =>  {
    return table.currentPlayers.find(p=>p.guid===subscriber.user.guid);
  }

  let setup4PlayerGame = function (){
    setup3PlayerGame();
    table.subscribers.push(subscriber4);      
    TestHelpers.addPlayerHandle(table, 7, subscriber4);   
    let player4 = table.getPlayers()[3];
    player4.playing = true;
    table.currentPlayers.push(player4);      
    table.playerNextToActIndex = 0;
    table.lastToActIndex = 3;
        }

  let getTableSubscriber = function (guid: string): WebSocketHandle {
    let socket = new MockWebSocket();
    let subscriber = new WebSocketHandle(socket);
    
    let user = new User();
    user.guid = guid;
    user.screenName = "player-" + guid;
    subscriber.user = user;
    return subscriber;
  }

  let clearMessages = function() {
    for (let socket of [socket1, socket2, socket3])
      socket.clearMessages();
  }

  let assertBroadcast = function(assertFunc:(data:DataContainer) => void, sockets:MockWebSocket[]=null) : void {
    sockets = sockets || [socket1, socket2, socket3];
    for (let socket of sockets) {
      let lastMessage = socket.getLastMessage();
      assertFunc(lastMessage);
    }
  }  


  it('3 player dealHoleCards',
    function() {
      table.subscribers.push(subscriber2);
      table.subscribers.push(subscriber3);
      table.subscribers.push(subscriber4);
      table.handleJoinTableRequest(TestHelpers.getJoinTableRequest(1, subscriber));
      table.handleJoinTableRequest(TestHelpers.getJoinTableRequest(3, subscriber2));      
      table.handleJoinTableRequest(TestHelpers.getJoinTableRequest(5, subscriber3));
      socket1.clearMessages();
      socket2.clearMessages();
      socket3.clearMessages();
      socket4.clearMessages();

      table.dealHoleCards();

      assert.equal(table.dealerSeat, 1);
      assert.equal(table.playerNextToActIndex, 0);
      assert.equal(table.lastToActIndex, 2);
      assert.equal(table.toCall, 2);
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 1);
      assert.equal(table.deck.cards.length, 46);

      assert.equal(socket1.outgoingMessages.length, 1);
      let data1 = socket1.outgoingMessages[0];      
      assert.equal(data1.deal.holecards.length, 2);
      assert.equal(data1.deal.holecards[0], table.currentPlayers[0].holecards[0]);
      assert.equal(data1.deal.holecards[1], table.currentPlayers[0].holecards[1]);
      assert.equal(data1.tableSeatEvents.seats.length, 3);
      assert.equal(data1.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data1.tableSeatEvents.seats[0].playing, true);
      assert.equal(data1.tableSeatEvents.seats[0].bet, 0);
      assert.equal(data1.tableSeatEvents.seats[0].myturn, true);
      assert.equal(data1.tableSeatEvents.seats[0].playercards, null);

      assert.equal(data1.tableSeatEvents.seats[1].seat, 3);
      assert.equal(data1.tableSeatEvents.seats[1].playing, true);
      assert.equal(data1.tableSeatEvents.seats[1].bet, 1);
      assert.equal(data1.tableSeatEvents.seats[1].myturn, null);      
      assert.equal(data1.tableSeatEvents.seats[1].playercards, null);
      assert.equal(data1.tableSeatEvents.seats[2].seat, 5);
      assert.equal(data1.tableSeatEvents.seats[2].playing, true);
      assert.equal(data1.tableSeatEvents.seats[2].bet, 2);
      assert.equal(data1.tableSeatEvents.seats[2].myturn, null);
      assert.equal(data1.tableSeatEvents.seats[2].playercards, null);
      

      assert.equal(socket2.outgoingMessages.length, 1);
      let data2 = socket2.outgoingMessages[0];
      assert.equal(data2.deal.holecards[0], table.currentPlayers[1].holecards[0]);
      assert.equal(data2.deal.holecards[1], table.currentPlayers[1].holecards[1]);
      assert.equal(data2.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data2.tableSeatEvents.seats[0].bet, 0);
      assert.equal(data1.tableSeatEvents.seats[0].playercards, null);
      assert.equal(data2.tableSeatEvents.seats[1].seat, 3);
      assert.equal(data2.tableSeatEvents.seats[1].bet, 1);
      assert.equal(data1.tableSeatEvents.seats[1].playercards, null);
      assert.equal(data2.tableSeatEvents.seats[2].seat, 5);
      assert.equal(data2.tableSeatEvents.seats[2].bet, 2);
      assert.equal(data1.tableSeatEvents.seats[2].playercards, null);
      

      let data4 = socket4.getLastMessage();      
      assert.equal(data4.deal.holecards, null);
    });

  

  it('3 player fold', function () {
    setup3PlayerGame();

    table.handleFold(subscriber.user.guid);

    assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.currentPlayers.length, 3);
    assert.equal(table.toCall, 1);
    
    assertBroadcast(data => {
        assert.equal(data.game.tocall, 1);

        assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data.tableSeatEvents.seats[0].hasFolded, true);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);

      assert.equal(data.tableSeatEvents.seats[1].seat, 3);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);      
    });

  });

  it('3 player; last player folds; expect flop timer started', function() {
    setup3PlayerGame();
    table.firstToActIndex = 0;
    table.playerNextToActIndex = 2;
    table.lastToActIndex = 2;

    table.handleFold(subscriber3.user.guid);

    socket3.checkNoErrorMessages();
    assert.equal(table.playerNextToActIndex, -1);
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);    

    assertBroadcast(data => {

      assert.equal(data.game.tocall, 0);

      assert.equal(data.tableSeatEvents.seats.length, 1);
      assert.equal(data.tableSeatEvents.seats[0].seat, 5);
      assert.equal(data.tableSeatEvents.seats[0].hasFolded, true);      
    });    
  });

  it('3 player post flop', function () {
    setup3PlayerGame();    
    table.currentPlayers[1].bet = 0;
    table.currentPlayers[2].bet = 0;
    table.dealerSeat = 1;
    table.toCall = 0;
    table.playerNextToActIndex = 1;
    table.lastToActIndex = 0;
    table.firstToActIndex = 1;
    table.street = PokerStreetType.flop;
    //table.currentPlayers[1].hasFolded = true;

    table.handleBet(0, subscriber2.user.guid);

    socket1.checkNoErrorMessages();
    
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.tableConfig.timeToActSec * 1000, table);
    assert.equal(table.playerNextToActIndex, 2);

    assertBroadcast(data => {
      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 3);
      assert.equal(data.tableSeatEvents.seats[0].bet, 0);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);

      assert.equal(data.tableSeatEvents.seats[1].seat, 5);
      assert.equal(data.tableSeatEvents.seats[1].bet, 0);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);
    });
  });

  it('incrementPlayerNextToActIndex loops around', function () {
    setup3PlayerGame();

    table.incrementPlayerNextToActIndex(2, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, 0);
  });


  it('incrementPlayerNextToActIndex middle position', function () {
    setup3PlayerGame();

    table.incrementPlayerNextToActIndex(1, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, 2);
  });

  it('incrementPlayerNextToActIndex where seat 1 has folded', function () {
    setup3PlayerGame();    
    table.currentPlayers[0].hasFolded = true;

    table.incrementPlayerNextToActIndex(2, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, 1);
  });

  it('incrementPlayerNextToActIndex where seat 1 has folded', function () {
    setup3PlayerGame();    
    table.dealerSeat = 1;

    table.incrementPlayerNextToActIndex(0, table.currentPlayers);

    assert.equal(table.playerNextToActIndex, 1);
  });

  it('cannot fold out of turn', function () {
    setup3PlayerGame();

    table.handleFold(subscriber2.user.guid);

    assert.equal(table.currentPlayers.length, 3);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 1);
    assert.equal(socket1.outgoingMessages.length, 0);
    assert.equal(socket2.outgoingMessages.length, 1);
    assert.equal(socket2.outgoingMessages[0].error.message, 'cannot fold out of turn');
    assert.equal(socket3.outgoingMessages.length, 0);

  });

  it('3 player calls', function () {
    setup3PlayerGame();
    table.getPlayers()[1].bet = 1;
    table.getPlayers()[2].bet = 2;

    {//player1 (dealer) calls
      table.handleBet(2, subscriber.user.guid);

      assert.equal(table.playerNextToActIndex, 1);
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3);

      assertBroadcast(data => {
        assert.equal(data.game.tocall, 1);
        assert.equal(data.game.pot[0], 5);

        assert.equal(data.tableSeatEvents.seats.length, 2);
        assert.equal(data.tableSeatEvents.seats[0].seat, 1);
        assert.equal(data.tableSeatEvents.seats[0].stack, 998);
        assert.equal(data.tableSeatEvents.seats[0].myturn, false);
        assert.equal(data.tableSeatEvents.seats[0].bet, 2);
        assert.equal(data.tableSeatEvents.seats[0].hasCalled, true);
        assert.equal(data.tableSeatEvents.seats[0].hasRaised, false);

        assert.equal(data.tableSeatEvents.seats[1].seat, 3);
        assert.equal(data.tableSeatEvents.seats[1].myturn, true);
      });
      
    }

    clearMessages();
    { //player2 bets 1
      table.handleBet(1, subscriber2.user.guid);
      socket2.checkNoErrorMessages();
      assertBroadcast(data => {
        assert.equal(data.game.tocall, 0);
        assert.equal(data.game.pot[0], 6);

        assert.equal(data.tableSeatEvents.seats.length, 2);
        assert.equal(data.tableSeatEvents.seats[0].seat, 3);
        assert.equal(data.tableSeatEvents.seats[0].myturn, false);
        assert.equal(data.tableSeatEvents.seats[0].bet, 2);
        assert.equal(data.tableSeatEvents.seats[0].hasCalled, true);
        assert.equal(data.tableSeatEvents.seats[0].hasRaised, false);

        assert.equal(data.tableSeatEvents.seats[1].seat, 5);
        assert.equal(data.tableSeatEvents.seats[1].myturn, true);
      });      
    }

    clearMessages();
    { //player3 calls
      table.handleBet(0, subscriber3.user.guid);

      assert.equal(table.playerNextToActIndex, -1);      
      socket3.checkNoErrorMessages();
      assertBroadcast(data => {
        assert.equal(data.game.tocall, 0);
        assert.equal(data.game.pot[0], 6);
        assert.equal(data.game.action, 'check');
        assert.equal(data.game.chipsToPot, true);
        assert.equal(data.tableSeatEvents.seats.length, 1);
        assert.equal(data.tableSeatEvents.seats[0].seat, 5);                
        assert.equal(data.tableSeatEvents.seats[0].hasCalled, true); 
        
      });
    }
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.flopDelaySec * 1000, table);


  });

  it('3 player bet', function () {
    setup3PlayerGame();

    table.handleBet(10, subscriber.user.guid);

    assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3);

    assertBroadcast(data => {
      assert.equal(data.game.tocall, 9);
      assert.equal(data.game.pot[0], 13);

      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 1);
      assert.equal(data.tableSeatEvents.seats[0].stack, 990);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);
      assert.equal(data.tableSeatEvents.seats[0].bet, 10);
      assert.equal(data.tableSeatEvents.seats[0].hasCalled, false);
      assert.equal(data.tableSeatEvents.seats[0].hasRaised, true);

      assert.equal(data.tableSeatEvents.seats[1].seat, 3);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);      
    });
   

  });

  it('3 player with raise', function () {
    setup3PlayerGame();

    table.handleBet(10, subscriber.user.guid);//seat 1 raises

    //console.log('playerNextToActIndex', table.playerNextToActIndex);
    assert.equal(table.lastToActIndex, 2);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3);
    assert.equal(table.currentPlayers[0].stack, 990);    
    

    table.handleBet(20, subscriber2.user.guid);//seat 2 raises

    socket1.checkNoErrorMessages();
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);
    assert.equal(table.lastToActIndex, 0);
      
    table.handleBet(50, subscriber3.user.guid);//seat 3 raises

    socket3.checkNoErrorMessages();
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 1);
    assert.equal(table.lastToActIndex, 1);

  });

  it('3 player seat1 folds middle position raises - expect last to act to be last seat', function() {
    setup3PlayerGame();

    table.handleFold(subscriber.user.guid);
    
    assert.equal(table.lastToActIndex, 2);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3);    

    table.handleBet(20, subscriber2.user.guid);//seat 2 raises

    socket1.checkNoErrorMessages();
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);
    assert.equal(table.lastToActIndex, 2);    

  });

  it('cannot bet out of position', function () {
    setup3PlayerGame();

    table.handleBet(10, subscriber2.user.guid);

    assert.equal(socket1.outgoingMessages.length, 0);
    assert.equal(socket2.outgoingMessages.length, 1);
    assert.equal(socket2.outgoingMessages[0].error.message, 'you are not the next player to act.');
    assert.equal(socket3.outgoingMessages.length, 0);

    assert.equal(table.currentPlayers.length, 3);
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 1);


  });

  it('deal flop', function() {
    setup3PlayerGame();
    table.playerNextToActIndex = -1;
    table.dealerSeat = 1;    
    clearMessages();
    table.street = PokerStreetType.flop;

    table.dealCommunityCards();

    //assert.equal(table.playerNextToActIndex, 1);
    assert.equal(table.getPlayers()[table.playerNextToActIndex].seat, 3);
    assert.equal(table.getPlayers()[table.lastToActIndex].seat, 1);
    assert.equal(table.lastToActIndex, 0);

    assertBroadcast(data => {

      assert.equal(data.tableSeatEvents.seats.length, 3);             
      for (let seat of data.tableSeatEvents.seats) {
        
        assert.equal(seat.myturn, seat.seat===3);
        assert.equal(seat.hasRaised, false);
        assert.equal(seat.hasCalled, false);
        assert.equal(seat.bet, 0);
        assert.equal(seat.playercards, undefined);
        
      }

      assert.equal(data.deal.board.length, 3);
      assert.equal(table.deck.cards.length, 49);

    });

  });

  it('deal flop where dealer seat has folded', function() {
    setup3PlayerGame();
    table.playerNextToActIndex = -1;
    table.dealerSeat = 1;    
    clearMessages();
    table.street = PokerStreetType.flop;
    table.currentPlayers[0].hasFolded = true;

    table.dealCommunityCards();

    assert.equal(table.lastToActIndex, 2);
    assertBroadcast(data => {              
      for (let seat of data.tableSeatEvents.seats) {                
        assert.equal(seat.playercards, undefined);        
      }      
    });
    

  });

  it('4 players and 1st to act is seat 4 ', function() {
    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);
    table.subscribers.push(subscriber4);

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);
    TestHelpers.addPlayerHandle(table, 8, subscriber4);    
    table.setCurrentPlayers(table.getPlayers().slice());    
    table.dealerSeat = 1;
    table.playerNextToActIndex = 3;
    table.lastToActIndex = 2;
    table.toCall = 2;
    table.gameState = new TexasHoldemGameState();
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 3;
    table.gameState.pots[0].players.push(table.currentPlayers.find(p => p.seat === 3), table.currentPlayers.find(p => p.seat === 5));//put blinds into the first pot

    table.handleBet(2, subscriber4.user.guid);

    assert.equal(table.gameState.pots[0].amount, 5);
    //assert.equal(table.gameState.pots[0].players.length, 3);
    //assert.equal(table.gameState.pots[0].players[2], table.currentPlayers.find(p => p.seat === 8));
    assert.equal(table.toCall, 2);
    assertBroadcast(data => {

      assert.equal(data.tableSeatEvents.seats.length, 2);
      assert.equal(data.tableSeatEvents.seats[0].seat, 8);
      assert.equal(data.tableSeatEvents.seats[0].myturn, false);      
      assert.equal(data.tableSeatEvents.seats[1].seat, 1);
      assert.equal(data.tableSeatEvents.seats[1].myturn, true);      

    });

  });

  let setup4PlayerShowdown = function() {
    table.dataRepository = TestHelpers.getDataRepository();
    table.dealerSeat = 1;
    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);
    table.subscribers.push(subscriber4);

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 4, subscriber2);
    TestHelpers.addPlayerHandle(table, 6, subscriber3);
    TestHelpers.addPlayerHandle(table, 7, subscriber4);   
    
    table.setCurrentPlayers(table.getPlayers().slice());
    table.currentPlayers.find(p => p.seat === 1).holecards = ["8D", "JC"];
    table.currentPlayers.find(p => p.seat === 4).holecards = ["7C", "QS"];
    table.currentPlayers.find(p => p.seat === 6).holecards = ["8C", "4H"];
    table.currentPlayers.find(p => p.seat === 7).holecards = ["QD", "QH"];
    for (let player of table.getPlayers())
      player.cumulativeBet = 10;

    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ["7H", "2D", "5H", "8H", "5C"];
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].players.push(table.currentPlayers[0],
      table.currentPlayers[1],
      table.currentPlayers[3],
      table.currentPlayers[2]);
    table.gameState.pots[0].amount = 60;
  }

  it('4 players showdown', async () => {
      setup4PlayerShowdown();

      await table.handleShowdown();

      assertBroadcast(data => {
        assert.equal(data.game.potResults.length, 1);
        assert.equal(data.game.potResults[0].seatWinners[0], 7);
        assert.equal(data.tableSeatEvents.seats.length, 4);
        assert.equal(data.tableSeatEvents.seats[0].playercards[0] + data.tableSeatEvents.seats[0].playercards[1], '8DJC');
        assert.equal(data.tableSeatEvents.seats[1].playercards[0] + data.tableSeatEvents.seats[1].playercards[1], '7CQS');
        assert.equal(data.tableSeatEvents.seats[2].playercards[0] + data.tableSeatEvents.seats[2].playercards[1], '8C4H');
        assert.equal(data.tableSeatEvents.seats[3].playercards[0] + data.tableSeatEvents.seats[3].playercards[1], 'QDQH');
      });

      (<any>table.dataRepository).receivedWith('saveTableStates', substitute.arg.matchUsing((arg: TableState[]) => { 
        if(arg == undefined)
            return false;
        assert.equal(1, arg.length);
        assert.equal(table.tableConfig._id, arg[0]._id);
        assert.equal(1, arg[0].dealerSeat);
        assert.equal(4, arg[0].players.length);
        
        return true;
    }));

    });

  it('4 players showdown where winning hand folds',
    async()=>{
      setup4PlayerShowdown();
      table.currentPlayers.find(p => p.seat === 7).hasFolded = true;

      await table.handleShowdown();

      assertBroadcast(data => {
        assert.equal(data.game.potResults.length, 1);
        assert.equal(data.game.potResults[0].seatWinners[0], 1);
        assert.equal(data.tableSeatEvents.seats.length, 4);
        assert.equal(data.tableSeatEvents.seats[0].playercards[0] + data.tableSeatEvents.seats[0].playercards[1], '8DJC');
        assert.equal(data.tableSeatEvents.seats[1].playercards[0] + data.tableSeatEvents.seats[1].playercards[1], '7CQS');
        assert.equal(data.tableSeatEvents.seats[2].playercards[0] + data.tableSeatEvents.seats[2].playercards[1], '8C4H');
        assert.equal(data.tableSeatEvents.seats[3].playercards, undefined);
      });

      });

  it('4 players showdown with collapsing pot', async () => {
        setup4PlayerShowdown();
      let dataRepository = (<any>table.dataRepository);      
      table.currentPlayers.find(p => p.seat === 1).hasFolded = true;
      table.currentPlayers.find(p => p.seat === 1).cumulativeBet = 0;
      table.currentPlayers.find(p => p.seat === 4).hasFolded = true;
      table.currentPlayers.find(p => p.seat === 4).cumulativeBet = 0;
      table.currentPlayers.find(p => p.seat === 6).cumulativeBet = 50;
      table.currentPlayers.find(p => p.seat === 7).cumulativeBet = 100;      
      table.gameState.boardCards = ["10H", "2D", "5H", "8H", "5C"];

      await table.handleShowdown();

      assertBroadcast(data => {
        
        assert.equal(data.game.potResults.length, 1);                
        assert.equal(data.game.potResults[0].seatWinners[0], 7);
        assert.equal(data.tableSeatEvents.seats.length, 4);
        assert.equal(data.tableSeatEvents.seats[0].playercards, undefined);
        assert.equal(data.tableSeatEvents.seats[1].playercards, undefined);
        assert.equal(data.tableSeatEvents.seats[2].playercards[0] + data.tableSeatEvents.seats[2].playercards[1], '8C4H');
        assert.equal(data.tableSeatEvents.seats[3].playercards[0] + data.tableSeatEvents.seats[3].playercards[1], 'QDQH');
      });

      assert.equal(table.currentPlayers.find(p => p.seat === 7).stack, 1150);       

      dataRepository.receivedWith('saveGame', substitute.arg.matchUsing(function(arg: any) {        
        return arg != undefined && arg.potResults[0].allocations[0].player.guid === 'guid4';
      }));
      dataRepository.receivedWith('updateTableBalances', 'id1', 'usd', substitute.arg.matchUsing((arg: UserTableAccount[]) => {        
        return arg != undefined && arg.length === 4 && arg[3].balance === 1150;
      }));

    });

  it('4 players showdown with other players folding',
    async () => {
      setup4PlayerShowdown();
      table.currentPlayers.find(p => p.seat === 1).hasFolded = true;
      table.currentPlayers.find(p => p.seat === 1).cumulativeBet = 0;
      table.currentPlayers.find(p => p.seat === 4).hasFolded = true;
      table.currentPlayers.find(p => p.seat === 4).cumulativeBet = 0;
      table.currentPlayers.find(p => p.seat === 6).hasFolded = true;
      table.currentPlayers.find(p => p.seat === 6).cumulativeBet = 0;
      table.currentPlayers.find(p => p.seat === 7).cumulativeBet = 100;

      await table.handleShowdown();

      assertBroadcast(data => {

        assert.equal(data.game.potResults.length, 1);
        assert.equal(data.game.potResults[0].seatWinners[0], 7);
        assert.equal(data.tableSeatEvents.seats.length, 4);
        assert.equal(data.tableSeatEvents.seats[0].playercards, undefined);
        assert.equal(data.tableSeatEvents.seats[1].playercards, undefined);
        assert.equal(data.tableSeatEvents.seats[2].playercards, undefined);
        assert.equal(data.tableSeatEvents.seats[3].playercards, undefined);
      });

      assert.equal(table.currentPlayers.find(p => p.seat === 7).stack, 1100);

      (<any>table.dataRepository).receivedWith('saveGame', substitute.arg.matchUsing(function (arg: any) {
        return arg != undefined && arg.tableId===table.tableConfig._id && arg.potResults[0].allocations[0].player.guid === 'guid4';
      }));

    });


  it('player folds after re-raise - original raiser call amount should not equal player that folded',
    function() {
      setup3PlayerGame();
      table.currentPlayers[0].bet = 10;
      table.currentPlayers[1].bet = 20;
      table.playerNextToActIndex = 2;
      table.lastToActIndex = 1;
      table.toCall = 18;

      table.handleFold(subscriber3.user.guid);

      socket3.checkNoErrorMessages();
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 1);
      assert.equal(table.toCall, 10);
    });

  it('player goes all in less than the call amount',
    function () {
      setup3PlayerGame();
      table.currentPlayers[0].bet = 10;
      table.currentPlayers[1].bet = 20;
      table.currentPlayers[2].stack = 5;
      table.playerNextToActIndex = 2;
      table.lastToActIndex = 1;
      table.toCall = 18;

      table.handleBet(5, subscriber3.user.guid);

      socket3.checkNoErrorMessages();
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 1);
      assert.equal(table.toCall, 10);
    });

  it('all in player is skipped when player bets', () => {
      setup3PlayerGame();
      table.currentPlayers[1].stack = 0;
      table.playerNextToActIndex = 0;
      table.lastToActIndex = 2;      

      table.handleBet(5, subscriber.user.guid);

      socket1.checkNoErrorMessages();
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);      
    });

  it('all in player is skipped when player folds', () => {
      setup3PlayerGame();
      table.currentPlayers[1].stack = 0;
      table.playerNextToActIndex = 0;
      table.lastToActIndex = 2;

      table.handleFold(subscriber.user.guid);

      socket1.checkNoErrorMessages();
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);
    });

  it('2 all in players are skipped when player folds',
    function () {
      setup4PlayerGame();
            
      table.currentPlayers[1].stack = 0;
      table.currentPlayers[2].stack = 0;      

      table.handleFold(subscriber.user.guid);

      socket1.checkNoErrorMessages();
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 7);
    });


  it('player raising after all-in player sets last to act index as the player before the all in player',
    function() {
      setup3PlayerGame();
      table.currentPlayers[0].stack = 0;
      table.playerNextToActIndex = 1;
      table.lastToActIndex = 2;

      table.handleBet(5, subscriber2.user.guid);

      socket1.checkNoErrorMessages();
      assert.equal(table.lastToActIndex, 2);
    });

    let getJoinTableRequest = (seat:number, user:User, stack:number) : JoinTableRequest=>{
      return new JoinTableRequest(seat, user.guid, user.screenName, user.gravatar, stack)
    }
    let getPlayerTableHandle = (user:User, seat:number) : PlayerTableHandle=>{
      return new PlayerTableHandle(user.guid, user.screenName,user.guid,seat)
    }

  it('play is not started as player is sitting out',    function() {
      table.subscribers.push(subscriber2);
      table.subscribers.push(subscriber3);
      table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));
      table.handleJoinTableRequest(getJoinTableRequest(3, subscriber2.user, 1000));
      var setTableOptionRequest = new SetTableOptionRequest(undefined);
      setTableOptionRequest.sitOutNextHand = true;
      table.handleSetTableOptionRequest(setTableOptionRequest, subscriber2.user.guid);
      
      table.handleJoinTableRequest(getJoinTableRequest(5, subscriber3.user, 1000));

      assert.equal(3, table.getPlayers().length);
      timerProvider.didNotReceive('startTimer');
      assert.equal(null, table.gameStarting);
      assert.equal(null, table.currentPlayers);
      });

  it('play is started without sitting out player',
    function() {
      table.minNumPlayers = 2;
      table.subscribers.push(subscriber2);
      table.subscribers.push(subscriber3);
      table.getPlayers().push(getPlayerTableHandle(subscriber.user, 1));
      table.getPlayers().push(getPlayerTableHandle(subscriber2.user, 3));
      table.getPlayers()[1].sitOutNextHand = true;      

      table.handleJoinTableRequest(getJoinTableRequest(5, subscriber3.user, 1000));

      assert.equal(3, table.getPlayers().length);
      timerProvider.received('startTimer');
      assert.notEqual(null, table.gameStarting);
      assert.equal(null, table.currentPlayers);
    });

  it('deal hole cards excludes disconnected and sitting out player', () =>{
      table.minNumPlayers = 2;
      table.subscribers.push(subscriber2);
      table.subscribers.push(subscriber3);
      table.subscribers.push(subscriber4);
      table.getPlayers().push(getPlayerTableHandle(subscriber.user, 1));
      table.getPlayers().push(getPlayerTableHandle(subscriber2.user, 3));
      table.getPlayers().push(getPlayerTableHandle(subscriber3.user, 5));
      table.getPlayers().push(getPlayerTableHandle(subscriber4.user, 7));
      table.getPlayers()[1].sitOutNextHand = true;
      table.getPlayers()[3].isDisconnected = true;

      table.dealHoleCards();

      assert.equal(table.currentPlayers.length, 2);
      assert.equal(table.currentPlayers[0].guid, 'guid1');
      assert.equal(table.currentPlayers[1].guid, 'guid3'); 
    });

  it('deal hole cards does not proceed when minimum number of players is not met',
    function () {
      table.minNumPlayers = 2;
      table.subscribers.push(subscriber2);
      table.subscribers.push(subscriber3);      
      table.getPlayers().push(getPlayerTableHandle(subscriber.user, 1));
      table.getPlayers().push(getPlayerTableHandle(subscriber2.user, 3));
      table.getPlayers().push(getPlayerTableHandle(subscriber3.user, 5));      
      table.getPlayers()[1].sitOutNextHand = true;
      table.getPlayers()[2].isDisconnected = true;

      table.dealHoleCards();

      assert.equal(table.currentPlayers, null);
      assertBroadcast(data => {

        assert.equal(data.gameStarting.isStarting, false);
        
      });
      
    });

  it('player who is not playing broadcasts their sitting out status immediately',
    function () {
      setup3PlayerGame();
      
      table.subscribers.push(subscriber4);      
      table.addPlayerHandle(getJoinTableRequest(7, subscriber4.user, 1000));
      assert.equal(table.currentPlayers.length, 3);
      assert.equal(table.getPlayers().length, 4);
      
      var setTableOptionRequest = new SetTableOptionRequest(undefined);
      setTableOptionRequest.sitOutNextHand = true;      

      table.handleSetTableOptionRequest(setTableOptionRequest, subscriber4.user.guid);

      var lastMessage = socket4.dequeue();
      assert.equal(lastMessage.setTableOptionResult.sitOutNextHand, true);
      assertBroadcast(data => {
        assert.equal(data.tableSeatEvents.seats.length, 1);
        assert.equal(data.tableSeatEvents.seats[0].seat, 7);
        assert.equal(data.tableSeatEvents.seats[0].isSittingOut, true);
      });
      
    });

  it('player who is playing does not broadcast their sitting out status',
    function () {
      setup3PlayerGame();
      var setTableOptionRequest = new SetTableOptionRequest(undefined);
      setTableOptionRequest.sitOutNextHand = true;

      table.handleSetTableOptionRequest(setTableOptionRequest, subscriber2.user.guid);
      var lastMessage = socket2.dequeue();
      assert.equal(lastMessage.setTableOptionResult.sitOutNextHand, true);
      assertBroadcast(data => {
        assert.equal(data.tableSeatEvents.seats.length, 1);
        assert.equal(data.tableSeatEvents.seats[0].seat, 3);
        assert.equal(data.tableSeatEvents.seats[0].isSittingOut, undefined);
      });

    });

    it('autofold after bet',
    function () {
      setup4PlayerGame();      
      let request = new SetTableOptionRequest(undefined);
      request.autoFold=true;
      table.handleSetTableOptionRequest(request, subscriber2.user.guid);
      assert.equal(getPlayerHandle(subscriber2).autoFold, true);

      table.handleBet(2, subscriber.user.guid);      

      timerProvider.receivedWith('startTimer', 
      substitute.arg.matchUsing((func:()=>void) => { return func != undefined && func.name === 'startAutoFoldTimer'; }), 
        substitute.arg.matchUsing(function(a:number){return a == 500;}),
        table);
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3);
      assert.equal(getPlayerHandle(subscriber2).autoFold, false);
      
    });

    it('autofold after fold',
    function () {
      setup4PlayerGame();      
      let request = new SetTableOptionRequest(undefined);
      request.autoFold=true;
      table.handleSetTableOptionRequest(request, subscriber2.user.guid);
      assert.equal(getPlayerHandle(subscriber2).autoFold, true);

      table.handleFold(subscriber.user.guid);      

      socket1.checkNoErrorMessages();
      timerProvider.receivedWith('startTimer', 
      substitute.arg.matchUsing((func:()=>void) => { return func != undefined && func.name === 'startAutoFoldTimer'; }), 
      substitute.arg.matchUsing(function(a:number){return a === 500;}), table);
      assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3);
      assert.equal(getPlayerHandle(subscriber2).autoFold, false);      
    });

    it('player who is autofolding has autofold unchecked after action folds to them',
    () => {
      setup4PlayerGame();     
      table.playerNextToActIndex = 2; 
      table.currentPlayers[0].hasFolded = true;
      table.currentPlayers[0].myturn = false;
      table.currentPlayers[1].hasFolded = true;
      table.currentPlayers[1].myturn = false;
      table.currentPlayers[2].myturn = true;
      let request = new SetTableOptionRequest(undefined);
      request.autoFold=true;
      table.handleSetTableOptionRequest(request, subscriber4.user.guid);
      assert.equal(getPlayerHandle(subscriber4).autoFold, true);

      table.handleFold(subscriber3.user.guid);      
      
      // console.log('table.currentPlayers[3]', table.currentPlayers[3]);
      assert.equal(getPlayerHandle(subscriber4).autoFold, false);
      let autoOptionResult:AutoOptionResult = CommonHelpers.allowAutoFold(table.currentPlayers[3].guid, table.currentPlayers);
      assert.equal(autoOptionResult.allowAutoCheck, false);
      assert.equal(autoOptionResult.allowAutoFold, false);
    });

    it('player pays big blind when moving seats',  () => {
      //setup subscriber2 moving from seat 3 to seat 8
      setup4PlayerGame();
      for(let player of table.currentPlayers)
        player.bet = 0;
      table.pastPlayers = [[ new SeatHistory(subscriber.user.guid, 1),
        
        new SeatHistory(subscriber3.user.guid, 5),
        new SeatHistory(subscriber4.user.guid, 7),
        new SeatHistory(subscriber2.user.guid, 8),
      ]];


        table.dealHoleCards();

        assert.equal(table.dealerSeat, 5);         
        assert.equal(table.currentPlayers.find(p => p.seat === 1).bet, 2);
        assert.equal(table.currentPlayers.find(p => p.seat === 3).bet, 2);//moved seat
        assert.equal(table.currentPlayers.find(p => p.seat === 5).bet, 0);//regular small blind
        assert.equal(table.currentPlayers.find(p => p.seat === 7).bet, 1);//regular big blind
        assert.equal(table.gameState.pots[0].amount, 5);
      
    });

  it('player who moves seat does become dealer', () => {

    setup4PlayerGame();
    table.dealerSeat = 8;
    //player1 was in seat 8 but moves to seat1
    table.pastPlayers = [[
    new SeatHistory(subscriber2.user.guid, 3),
    new SeatHistory(subscriber3.user.guid,  5),
    new SeatHistory(subscriber4.user.guid, 7),
    new SeatHistory(subscriber.user.guid,  8)
    ]];

    table.dealHoleCards();
    //let result = table.getNextDealerSeat(table.currentPlayers);

    assert.equal(table.dealerSeat, 3);
    assert.equal(table.currentPlayers.find(p => p.seat === 1).bet, 2);//moved seat
    assert.equal(table.currentPlayers.find(p => p.seat === 1).hasCalled, true);
    assert.equal(table.toCall, 0);    

  });

  it('player_with_less_than_0_01_usd_is_skipped_and_cards_are_dealt', () => {
    setup3PlayerGame();        
    table.tableConfig.currency = Currency.dash;
    table.currencyUnit = 100000000;
    table.tableConfig.smallBlind = 15107;
    table.tableConfig.exchangeRate = 330.98;
    table.tableConfig.bigBlind = 30214;    
    table.currentPlayers[0].stack = 3000000;
    table.currentPlayers[1].stack = 3000000;
    table.currentPlayers[2].stack = 2161;
    table.dealerSeat = 1;
    table.playerNextToActIndex = 1;
    table.currentPlayers[1].myturn = true;
    table.lastToActIndex = 2;
    table.toCall = 15107;    

    table.handleBet(15107, subscriber2.user.guid);

    socket2.checkNoErrorMessages();    
    assert.equal(table.playerNextToActIndex, -1);//should start next street  
  });

  it('player_with_stack_less_than_big_blind_is_not_skipped', () => {
    setup3PlayerGame();        
    table.tableConfig.currency = Currency.dash;
    table.currencyUnit = 100000000;
    table.tableConfig.smallBlind = 15107;
    table.tableConfig.exchangeRate = 330.98;
    table.tableConfig.bigBlind = 30214;    
    table.currentPlayers[0].stack = 3000000;
    table.currentPlayers[2].stack = 15107;
    table.dealerSeat = 1; 
    table.playerNextToActIndex = 1;
    table.currentPlayers[1].myturn = true;
    table.lastToActIndex = 0;
    table.toCall = 0;    

    table.handleBet(0, subscriber2.user.guid);

    socket2.checkNoErrorMessages();    
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 5);      
  });

  it('tournament includes player that is sitting out', () => {
    table.minNumPlayers = 2;
    table.tournamentId = 'tournamentId';
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);    
    TestHelpers.addPlayerHandle(table, 5, subscriber3); 
    TestHelpers.addPlayerHandle(table, 7, subscriber4); 
    table.getPlayers().find(p => p.seat === 3).sitOutNextHand = true;
    table.getPlayers().find(p => p.seat === 5).isDisconnected = true;

    table.checkGameStartingEvent();
    
    timerProvider.receivedWith('startTimer', substitute.arg.any('function'), table.gameStartDelaySec * 1000, table);    
    assert.notEqual(null, table.gameStarting);        
    });

    it('tournament is not started when only 1 player is playing', () => {
      table.minNumPlayers = 2;
      table.tournamentId = 'tournamentId';
      TestHelpers.addPlayerHandle(table, 1, subscriber);
      TestHelpers.addPlayerHandle(table, 3, subscriber2);    
      TestHelpers.addPlayerHandle(table, 5, subscriber3); 
      TestHelpers.addPlayerHandle(table, 7, subscriber4); 
      table.getPlayers().find(p => p.seat === 3).sitOutNextHand = true;
      table.getPlayers().find(p => p.seat === 5).isDisconnected = true;
      table.getPlayers().find(p => p.seat === 7).isDisconnected = true;
  
      table.checkGameStartingEvent();
      
      timerProvider.didNotReceive('startTimer');    
      assert.equal(null, table.gameStarting);    
      
      });

  it('tournament sitting out players pay blinds', () => {
    table.tournamentId = 'tournamentId';
    table.minNumPlayers = 2;
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);
    TestHelpers.addPlayerHandle(table, 7, subscriber4);
    TestHelpers.addPlayerHandle(table, 8, subscriber5);
    table.getPlayers().find(p => p.seat === 3).sitOutNextHand = true;
    table.getPlayers().find(p => p.seat === 5).isDisconnected = true;
    table.getPlayers().find(p => p.seat === 7).isDisconnected = true;
    table.dealerSeat = 1;

    table.dealHoleCards();
    
    assert.equal(2, table.currentPlayers.length)
    assert.equal(3, table.dealerSeat)
    assert.equal(1, table.getPlayers().find(p => p.seat === 5).bet);
    assert.equal(2, table.getPlayers().find(p => p.seat === 7).bet);
    assert.equal(8, table.currentPlayers[table.playerNextToActIndex].seat);
    assert.equal(3, table.gameState.pots[0].amount);
    assert.equal(0, table.gameState.pots[0].players.length);
  });
  

  it('blinds of sitting out players are cleared when community cards are dealt', () => {
    table.tournamentId = 'tournamentId';
    table.minNumPlayers = 2;
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);
    TestHelpers.addPlayerHandle(table, 7, subscriber4);            
    table.getPlayers().find(p => p.seat === 5).sitOutNextHand = true;
    table.getPlayers().find(p => p.seat === 5).bet = 1;
    table.getPlayers().find(p => p.seat === 7).isDisconnected = true;
    table.getPlayers().find(p => p.seat === 7).bet = 2;
    table.dealerSeat = 3;
    table.currentPlayers = [table.getPlayers().find(p => p.seat === 1), table.getPlayers().find(p => p.seat === 3)]
    table.street = PokerStreetType.flop    
    setupGameState();

    table.dealCommunityCards();
            
    let message = socket1.getLastMessage()
    let seat5 = message.tableSeatEvents.seats.find(s=>s.seat == 5);
    let seat7 = message.tableSeatEvents.seats.find(s=>s.seat == 5);
    assert.notEqual(null, seat5, 'Expecting seat 5 to be sent to clear out the blinds')
    assert.equal(0, seat5.bet)
    assert.notEqual(null, seat7)
    assert.equal(0, seat7.bet)
    for (let seat of message.tableSeatEvents.seats) {                
      assert.equal(seat.playercards, undefined);        
    }   
  });

  it('dealCommunityCards with dealer who is sitting out', () => {
    table.tournamentId = 'tournamentId';
    table.dealerSeat = 1;
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);
    TestHelpers.addPlayerHandle(table, 7, subscriber4);            
    table.getPlayers().find(p => p.seat === 1).sitOutNextHand = true;
    table.currentPlayers = table.getPlayers().filter(p => !p.sitOutNextHand);
    table.street = PokerStreetType.flop    
    setupGameState();

    table.dealCommunityCards();
        
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3)
    assert.equal(table.currentPlayers[table.lastToActIndex].seat, 7)
    let sockets = table.subscribers.map(s=> <MockWebSocket> (<WebSocketHandle>s).socket);
    assertBroadcast(data => {                          
      for (let seat of data.tableSeatEvents.seats) {                
        assert.equal(seat.playercards, undefined);        
      }      
    }, sockets);
    
  });

  it('must cycle thru multiple sitting out players to get next to act', () => {
    table.tournamentId = 'tournamentId';
    table.dealerSeat = 1;
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);
    TestHelpers.addPlayerHandle(table, 4, subscriber5);
    TestHelpers.addPlayerHandle(table, 5, subscriber3);
    TestHelpers.addPlayerHandle(table, 7, subscriber4);            
    table.getPlayers().find(p => p.seat === 1).sitOutNextHand = true;
    table.getPlayers().find(p => p.seat === 7).sitOutNextHand = true;
    table.currentPlayers = table.getPlayers().filter(p => !p.sitOutNextHand);
    table.street = PokerStreetType.flop    
    setupGameState();

      table.dealCommunityCards();
        
    assert.equal(table.currentPlayers[table.playerNextToActIndex].seat, 3)
    assert.equal(table.currentPlayers[table.lastToActIndex].seat, 5)
    let sockets = table.subscribers.map(s=> <MockWebSocket> (<WebSocketHandle>s).socket);
    assertBroadcast(data => {                          
      for (let seat of data.tableSeatEvents.seats) {                
        assert.equal(seat.playercards, undefined);        
      }      
    }, sockets);
  });

  let setup3PlayerBlindsTest = ()=>{
    table.subscribers.push(subscriber2);
    table.subscribers.push(subscriber3);    
    table.getPlayers().push(getPlayerTableHandle(subscriber.user, 1));
    table.getPlayers().push(getPlayerTableHandle(subscriber2.user, 3));
    table.getPlayers().push(getPlayerTableHandle(subscriber3.user, 5));
    table.setCurrentPlayers(table.getPlayers().slice());
    table.tableConfig.smallBlind = 50;
    table.tableConfig.bigBlind = 100;
    table.currentPlayers[0].stack = 25;
    table.currentPlayers[1].stack = 15;
    table.currentPlayers[2].stack = 5;
  }

  it('players balance does not go negative when blinds exceed current stack size', () => {

    setup3PlayerBlindsTest();
    
    table.dealHoleCards();

    for(let player of table.currentPlayers){
      if(player.stack < 0){
        assert.fail(`stack size of ${player.stack} is invalid`)
      }
    }

  });

  it('player is not removed from table postShowdown when playing a tournament when their stack is less than the blinds', async () => {

    setup3PlayerBlindsTest();
    let expectedBustedPlayer = table.currentPlayers[2];
    expectedBustedPlayer.stack = 0;
    table.tournamentId = 'id1'
    table.broadcastService = <any>substitute.for(new IBroadcastService());
    let dataRepository : ISubstitute<IDataRepository> = <any>substitute.for(new IDataRepository());
    dataRepository.returnsFor('getUser', Promise.resolve(new User()));
    table.dataRepository = dataRepository;
    
    let event:PostShowdownEvent;
    table.onPostShowdown = (e:PostShowdownEvent):Promise<void>=>{
      event = e;
      return Promise.resolve();
    }

    await table.postShowdown();

    assert.equal(event!=null, true)
    assert.equal(event.bustedPlayers.length, 1)
    assert.equal(event.bustedPlayers[0], expectedBustedPlayer)

  });

  it('2 players deal hole cards when other players sitting out', ()=> {
    table.minNumPlayers = 2;
    table.tournamentId = 'tournamentId';

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 2, subscriber2);    
    TestHelpers.addPlayerHandle(table, 3, subscriber3);   
    TestHelpers.addPlayerHandle(table, 4, subscriber4);        
    
    table.getPlayerAtSeat(3).isDisconnected = true;
    table.getPlayerAtSeat(4).isDisconnected = true;

    table.dealHoleCards();

    assert.equal(table.playerNextToActIndex, 0)
  });

  let setupdealCommunityCardsWhenDealerIsRemovedDueToIdleness = (dealerSeat:number)=>{
    table.minNumPlayers = 2;
    table.dealerSeat = dealerSeat;
    table.tournamentId = 'tournamentId';
    table.street = PokerStreetType.flop;    
    
    table.setCurrentPlayers(table.getPlayers())
    setupGameState();
  }

  it('setupdealCommunityCardsWhenDealerIsRemovedDueToIdleness 3', ()=> {
    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 2, subscriber2);        
    TestHelpers.addPlayerHandle(table, 4, subscriber4);
    setupdealCommunityCardsWhenDealerIsRemovedDueToIdleness(3)

    table.dealCommunityCards();

    assert.equal(table.currentPlayers[table.lastToActIndex].seat, 2)
  });

  it('setupdealCommunityCardsWhenDealerIsRemovedDueToIdleness 1', ()=> {
    TestHelpers.addPlayerHandle(table, 2, subscriber);
    TestHelpers.addPlayerHandle(table, 3, subscriber2);        
    TestHelpers.addPlayerHandle(table, 4, subscriber4);
    setupdealCommunityCardsWhenDealerIsRemovedDueToIdleness(1)

    table.dealCommunityCards();

    assert.equal(table.currentPlayers[table.lastToActIndex].seat, 4)
  });


  let setupShowdownForSittingOutPlayerWhoPaidBlind = ()=>{    
    table.dataRepository = TestHelpers.getDataRepository();
    table.dealerSeat = 1;
    table.tournamentId = 'tournamentId'

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 4, subscriber2);
    TestHelpers.addPlayerHandle(table, 6, subscriber3);
    TestHelpers.addPlayerHandle(table, 7, subscriber4);

    let players = table.getPlayers();
    table.setCurrentPlayers(players.slice(0, 3));
    let seat1 = table.getPlayerAtSeat(1);
    seat1.stack = 998;
    seat1.holecards = ["8D", "JC"];
    let seat4 = table.getPlayerAtSeat(4);
    seat4.stack = 998;
    seat4.holecards = ["7C", "QS"];
    let seat6 = table.getPlayerAtSeat(6);
    seat6.stack = 998;
    seat6.holecards = ["8C", "4H"];
    let seat7 = players.find(p => p.seat === 7);
    seat7.isDisconnected = true;    
    seat7.stack = 0;
    seat7.holecards = null;

    for (let player of players){
      player.bet = 2;
      player.cumulativeBet = 2;
    }
      

    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ["7H", "2D", "5H", "8H", "5C"];
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 8;

  }

  it('blind of sitting out player is added to pot', async () => {
    setupShowdownForSittingOutPlayerWhoPaidBlind();
    let dataRepository: ISubstitute<IDataRepository> = <any>table.dataRepository;
    
    await table.handleShowdown();

    let seat7 = table.getPlayerAtSeat(7)
    assert.equal(seat7.bet, 0)
    assert.equal(seat7.cumulativeBet, 0)
    let dbState = <TableState>dataRepository.argsForCall('saveTableStates', 0)[0][0];    
    assert.equal(dbState.players.find(s=>s.seat==1).stack, 1006);
    assert.equal(dbState.players.find(s=>s.seat==4).stack, 998);
    assert.equal(dbState.players.find(s=>s.seat==6).stack, 998);
    assert.equal(dbState.players.find(s=>s.seat==7).stack, 0);
    

  });

  it('sitting out player is removed when they are blinded out', async () => {
    setupShowdownForSittingOutPlayerWhoPaidBlind();
    table.broadcastService = <any>substitute.for(new IBroadcastService());
    let dataRepository: ISubstitute<IDataRepository> = <any>table.dataRepository;
    socket1.clearMessages();

    await table.handleShowdown();
    await table.postShowdown();
    
    assert.equal(3, table.getPlayerCount())
    let message1 = socket1.dequeue();    
    let message2 = socket1.dequeue();
    
    assert.equal(message2.tableSeatEvents.seats.length, 4);
    assert.equal(message2.tableSeatEvents.seats.find(s=>s.seat==7).empty, true);

  });

  it('sitting out player pays blind that is bigger than other players', async () => {
    
    table.dataRepository = TestHelpers.getDataRepository();
    let dataRepository: ISubstitute<IDataRepository> = <any>table.dataRepository;
    table.dealerSeat = 1;
    table.tournamentId = 'tournamentId'
    table.tableConfig.smallBlind = 250;
    table.tableConfig.bigBlind = 500;

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 4, subscriber2);    
    TestHelpers.addPlayerHandle(table, 7, subscriber4);
        
    let seat1 = table.getPlayerAtSeat(1);
    seat1.stack = 500;    
    seat1.bet = 500;    
    seat1.cumulativeBet = 500;
    
    let seat4 = table.getPlayerAtSeat(4);
    seat4.stack = 1000;
    seat4.holecards = ["AC", "AS"];
    seat4.hasFolded = true;
    let seat7 = table.getPlayerAtSeat(7);
    seat7.stack = 750;
    seat7.holecards = ["8C", "4H"];
    seat7.bet = 250;
    seat7.cumulativeBet = 250;
    table.setCurrentPlayers([seat4, seat7]);

    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ["AH", "AD", "5H", "8H", "5C"];
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 750;

    await table.handleShowdown();

    let dbGame = <DbGameResults>dataRepository.argsForCall('saveGame', 0)[0];
    assert.equal(dbGame.potResults.length, 1)
    assert.equal(dbGame.potResults[0].allocations[0].amount, 750)
    assert.equal(dbGame.potResults[0].allocations[0].player.guid, seat7.guid)
    for(let player of table.getPlayers()){
      assert.equal(player.bet, 0)
      assert.equal(player.cumulativeBet, 0)
    }
    

  });

  it('folded player pays blind that is bigger than other players', async ()=>{
    //this is similar to the above test except that the player has folded instead of sitting out
    table.dataRepository = TestHelpers.getDataRepository();
    let dataRepository: ISubstitute<IDataRepository> = <any>table.dataRepository;
    table.dealerSeat = 1;
    table.tournamentId = 'tournamentId'
    table.tableConfig.smallBlind = 250;
    table.tableConfig.bigBlind = 500;

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 4, subscriber2);    
    TestHelpers.addPlayerHandle(table, 7, subscriber4);
        
    let seat1 = table.getPlayerAtSeat(1);
    seat1.hasFolded = true;
    seat1.stack = 500;    
    seat1.bet = 500;
    seat1.cumulativeBet = 500;
    seat1.holecards = ["7C", "QS"];

    let seat4 = table.getPlayerAtSeat(4);
    seat4.stack = 1000;
    seat4.holecards = ["7C", "QS"];
    let seat7 = table.getPlayerAtSeat(7);
    seat7.stack = 750;
    seat7.holecards = ["8C", "4H"];
    seat7.bet = 250;
    seat7.cumulativeBet = 250;
    table.setCurrentPlayers([seat1, seat4, seat7]);
    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ["7H", "2D", "5H", "8H", "5C"];
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 750;

    await table.handleShowdown();

    let dbGame = <DbGameResults>dataRepository.argsForCall('saveGame', 0)[0];
    assert.equal(dbGame.potResults[0].allocations[0].amount, 750)
  });


  it('player wins as other players fold', async ()=>{
    table.dataRepository = TestHelpers.getDataRepository();
    let dataRepository: ISubstitute<IDataRepository> = <any>table.dataRepository;
    table.dealerSeat = 1;
    table.tableConfig.smallBlind = 250;
    table.tableConfig.bigBlind = 500;

    TestHelpers.addPlayerHandle(table, 1, subscriber);
    TestHelpers.addPlayerHandle(table, 2, subscriber2);
    TestHelpers.addPlayerHandle(table, 3, subscriber3);
    TestHelpers.addPlayerHandle(table, 4, subscriber4);
    TestHelpers.addPlayerHandle(table, 7, subscriber5);
        
    //action folds round to seat1
    let seat1 = table.getPlayerAtSeat(1);
    seat1.holecards = ["7C", "7H"];
    
    //seats 2 and 3 are sitting out players who paid the blinds
    let seat2 = table.getPlayerAtSeat(2);
    seat2.bet = 10;
    seat2.cumulativeBet = 10;
    seat2.holecards = [];
    let seat3 = table.getPlayerAtSeat(3);
    seat3.bet = 20;
    seat3.cumulativeBet = 20;
    seat3.holecards = [];

    let seat4 = table.getPlayerAtSeat(4);
    seat4.holecards = ["9C", "9H"];
    seat4.hasFolded = true;
    let seat7 = table.getPlayerAtSeat(7);
    seat7.holecards = ["9C", "9H"];
    seat7.hasFolded = true;
    
    table.setCurrentPlayers([seat1, seat4, seat7]);
    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ["7H", "2D", "5H", "8H", "5C"];
    table.gameState.pots.push(new GamePot());
    table.gameState.pots[0].amount = 750;

    await table.handleShowdown();

    let dbGame = <DbGameResults>dataRepository.argsForCall('saveGame', 0)[0];
    assert.equal(dbGame.potResults[0].allocations[0].amount, 30)
    assert.equal(dbGame.potResults[0].allocations[0].player.guid, 'guid1')
  })


});