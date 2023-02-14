import * as assert from 'assert';
var substitute = require('jssubstitute');
import { Table } from "../src/table";
import { WebSocketHandle, IWebSocket } from "../src/model/WebSocketHandle";
import { DataContainer, Account } from "../../poker.ui/src/shared/DataContainer";
import { MockWebSocket } from "./mockWebSocket";
import { User } from "../src/model/User";
import { TestHelpers } from "./test-helpers";
import { TexasHoldemGameState, GamePot } from "../src/model/TexasHoldemGameState";
import {SetTableOptionRequest} from "../../poker.ui/src/shared/ClientMessage";
import { IBroadcastService } from '../src/services/IBroadcastService';
import { BlindConfig } from '../src/model/tournament';
import { Currency } from '../../poker.ui/src/shared/Currency';
import { JoinTableRequest } from '../src/model/table/JoinTableRequest';
import { PlayerTableHandle } from '../src/model/table/PlayerTableHandle';
import { NextBlind } from '../../poker.ui/src/shared/NextBlind';
describe('#Table()', function () {
    
    var table:Table;
    var subscriber: WebSocketHandle;
    var subscriber2: WebSocketHandle;
    var subscriber3: WebSocketHandle;
    var socket1:MockWebSocket;
    var socket2:MockWebSocket;
    var socket3:MockWebSocket;
    var timerProvider: any;

    let getJoinTableRequest = (seat:number, user:User, stack:number) : JoinTableRequest=>{
      return new JoinTableRequest(seat, user.guid, user.screenName, user.gravatar, stack)
    }
    let getPlayerTableHandle = (user:User, seat:number) : PlayerTableHandle=>{
      return new PlayerTableHandle(subscriber.user.guid, subscriber.user.screenName,subscriber.user.guid,seat)
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

    beforeEach(function() {
        table = new Table(TestHelpers.getTableConfig());
      table.minNumPlayers = 2;
      timerProvider = substitute.for({ startTimer: function() {} });
      table.timerProvider = timerProvider;
      table.broadcastService = TestHelpers.getSubstitute(IBroadcastService)
        subscriber = getTableSubscriber("guid1"); 
        socket1 = subscriber.socket as MockWebSocket;
        table.addSubscriber(subscriber);
        socket1.clearMessages();//clear out sub message

        subscriber2 = getTableSubscriber("guid2");
        subscriber3 = getTableSubscriber("guid3");
        socket2 = subscriber2.socket as MockWebSocket;
        socket3 = subscriber3.socket as MockWebSocket;
  });

 
  
        
    it('addSubscriber', function () {
        assert.equal(table.getSubscribers().length, 1);
        assert.equal(subscriber, table.getSubscribers()[0]);
    });



    it('join table', function () {
        

      let request = getJoinTableRequest(1, subscriber.user, 1000);
      
        let result = table.handleJoinTableRequest(request);
        assert.equal(result.success, true);
        var players = table.getPlayers();
        assert.equal(players.length, 1);
        let handle = players.filter(h => h.guid === request.guid)[0]; 
        assert.equal(handle.guid, request.guid);
        assert.equal(handle.seat, 1); 
        assert.equal(socket1.outgoingMessages.length, 1);
        let data = socket1.outgoingMessages[0] as DataContainer;        
        assert.equal(data.tableSeatEvents.seats.length, 1);  
        assert.equal(data.tableSeatEvents.seats[0].seat, 1);
        assert.equal(data.tableSeatEvents.seats[0].guid, request.guid);
        assert.equal(data.tableSeatEvents.seats[0].stack, 1000);
        
    });

    it('seat occupied', function () {
        
      let request = getJoinTableRequest(1, subscriber.user, 1000);
        table.handleJoinTableRequest(request);
        let result = table.handleJoinTableRequest(request);
        assert.equal(result.success, false);
        assert.equal(result.errorMessage, "Seat 1 is occupied");
        var players = table.getPlayers();
        assert.equal(players.length, 1);        
        assert.equal(socket1.outgoingMessages.length, 1);
    });

    it('invalid seat', function () {

      table.tableConfig.maxPlayers = 2;
      
      let result1 = table.handleJoinTableRequest(getJoinTableRequest(8, subscriber.user, 1000));
      assert.equal(result1.success, true, result1.errorMessage);
      
      table.addSubscriber(subscriber2);
      let result2 = table.handleJoinTableRequest(getJoinTableRequest(1, subscriber2.user, 1000));      
      assert.equal(result2.success, true, result2.errorMessage);

      table.addSubscriber(subscriber3);
      let result3 = table.handleJoinTableRequest(getJoinTableRequest(5, subscriber3.user, 1000));
      assert.equal(result3.success, false);

      assert.equal(result3.errorMessage, "Max number of players is 2");
      var players = table.getPlayers();
      assert.equal(players.length, 2);
    });

    it('player cannot join table as player is not a subscriber', function () {
        
        assert.equal(table.getPlayers().length, 0);
        let player = new User();
        player.guid = "guid-foo";        
        let request = getJoinTableRequest(1, player, 1000);
        let result = table.handleJoinTableRequest(request);        
        assert.equal(result.success, false);
        assert.equal(result.errorMessage, "player is not a subscriber");
        var players = table.getPlayers();
        assert.equal(players.length, 0);                
    });

  it('player cannot join table as player stack less than big blind', function () {
    
    let request = getJoinTableRequest(8, subscriber.user, 1000);
    request.stack = 1;
    let result = table.handleJoinTableRequest(request);
    
    assert.equal(result.success, false);
    assert.equal(result.errorMessage, "Minimum stack size is 2 and your stack is 1");
    var players = table.getPlayers();
    assert.equal(players.length, 0);
    });

  it('player cannot join table as player stack is null', function () {

    let request = getJoinTableRequest(8, subscriber.user, 0);
    let result = table.handleJoinTableRequest(request);

    assert.equal(result.success, false);
    assert.equal(result.errorMessage, "Minimum stack size is 2 and your stack is 0");
    var players = table.getPlayers();
    assert.equal(players.length, 0);
  });


  



    it('same subscriber cannot subscribe twice', function () {

        table.addSubscriber(subscriber);   
        assert.equal(table.getSubscribers().length, 1);
    });

    it('same player cannot join table more than once', function () {
        
      let result1 = table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));
        assert.equal(result1.success, true);
        socket1.clearMessages();
        let result2 = table.handleJoinTableRequest(getJoinTableRequest(2, subscriber.user, 1000));
        assert.equal(result2.success, false);
        assert.equal(result2.errorMessage, "player is already playing at seat 1");
        assert.equal(socket1.outgoingMessages.length, 0);
    });

    it('second player joining starts game', function () {                                 
        table.addSubscriber(subscriber2);
        let result1 = table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));        
        assert.equal(result1.success, true, result1.errorMessage);
        socket1.outgoingMessages = [];

        let result2 = table.handleJoinTableRequest(getJoinTableRequest(2, subscriber2.user, 1000));

        assert.equal(result2.success, true, result2.errorMessage);
        assert.notEqual(table.gameStarting, null);
               

        let dataContainer = socket1.getLastMessage();
        let gameStartingEvent = dataContainer.gameStarting;
        assert.equal(gameStartingEvent!=null, true)
        assert.equal(gameStartingEvent.startsInNumSeconds, 3);
        //(timerProvider as any).receivedWith('startTimer', substitute.arg.matchUsing((func: any) => { return func!=undefined && func.name === 'dealHoleCards'; }), 3000);    
        timerProvider.receivedWith('startTimer', substitute.arg.any('function'), 3000, table);
        //assert.equal(dataContainer.seats.length, 2);
        //assert.equal(dataContainer.seats[0].playing, false);
        //assert.equal(dataContainer.seats[1].playing, false);
    });

    it('third player joining after game has started does not restart gameStarting time', function () {
      table.addSubscriber(subscriber2);
      let result1 = table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));
      assert.equal(result1.success, true, result1.errorMessage);      
      let result2 = table.handleJoinTableRequest(getJoinTableRequest(2, subscriber2.user, 1000));
      assert.equal(result2.success, true, result2.errorMessage);
      socket1.outgoingMessages = [];
      socket2.outgoingMessages = [];
      let startingAt = table.gameStarting;
      assert.notEqual(startingAt, null);

      table.addSubscriber(subscriber3);
      let result3 = table.handleJoinTableRequest(getJoinTableRequest(3, subscriber3.user, 1000));
      assert.equal(result3.success, true, result3.errorMessage);
      assert.equal(table.gameStarting, startingAt);
      
    });

    it('new player receives existing seat data', function () {                              
        table.addSubscriber(subscriber2);
        let result1 = table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));        
        assert.equal(result1.success, true, result1.errorMessage);
        let result2 = table.handleJoinTableRequest(getJoinTableRequest(2, subscriber2.user, 1000));
        assert.equal(result2.success, true, result2.errorMessage);
        let subscriber3 = getTableSubscriber("guid3");              
        // console.log("players.length: " + table.getPlayers().length)

        table.addSubscriber(subscriber3);
        
        let socket3 = subscriber3.socket as MockWebSocket;
        assert.equal(socket3.outgoingMessages.length, 1);
        let data = socket3.outgoingMessages[0] as DataContainer;        
        assert.equal(data.tableSeatEvents.seats.length, 2);
        assert.equal(data.tableSeatEvents.seats[0].name, "player-guid1");
        assert.equal(data.tableSeatEvents.seats[0].guid, null);
        assert.equal(data.tableSeatEvents.seats[1].name, "player-guid2");        
        assert.equal(data.tableSeatEvents.seats[1].guid, null);
      //var prototypeMembers = Object.getOwnPropertyNames(Object.getPrototypeOf(table));
      // for(let funcKey in prototypeMembers)
      //     console.log(prototypeMembers[funcKey])
      // console.log('--');
      // for (var member in table)
      //     console.log(member)
    });

    it('removeSubscriber', function () {                             
      let result1 = table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));        
        assert.equal(result1.success, true, result1.errorMessage);        
        table.addSubscriber(subscriber2);
        let socket2 = subscriber2.socket as MockWebSocket;
        socket2.clearMessages();
        table.removeSubscriber(subscriber);
        
        assert.equal(table.getSubscribers().length, 1);
        assert.equal(table.getSubscribers()[0], subscriber2);
        assert.equal(table.getPlayers().length, 1);        
        assert.equal(table.getPlayers()[0].isDisconnected, true);        
        
    });

    it('onClientDisconnected', function () {
      table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));    
    table.addSubscriber(subscriber2);
    table.handleJoinTableRequest(getJoinTableRequest(2, subscriber2.user, 1000));    
    socket1.clearMessages();
    socket2.clearMessages();

    table.onClientDisconnected(subscriber2);

    assert.equal(table.getSubscribers().length, 1);
    assert.equal(table.getSubscribers()[0], subscriber);
    assert.equal(table.getPlayers().length, 2);
    assert.equal(table.getPlayers()[0].isDisconnected, undefined);
    assert.equal(table.getPlayers()[1].isDisconnected, true);
    
  });

  it('resubscribe to table', function () {
    table.gameState = new TexasHoldemGameState();
    table.gameState.boardCards = ['2S', '3S', '4S', '5S', '6S'];
    table.toCall = 10;
    let gamePot = new GamePot();
    gamePot.amount = 100;
    table.gameState.pots.push(gamePot);
    table.dealerSeat = 1;
    table.handleJoinTableRequest(getJoinTableRequest(1, subscriber.user, 1000));
    table.getPlayers()[0].holecards = ['AD', 'KD'];
    socket1.clearMessages();
    table.onClientDisconnected(subscriber);
    let newSubscriber = getTableSubscriber("guid1"); 
    table.addSubscriber(subscriber2);
    socket2.clearMessages();
    table.addSubscriber(subscriber3);
    socket2.clearMessages();

    table.addSubscriber(newSubscriber);

    assert.equal(table.getPlayers()[0].isDisconnected, false);
    let socket = newSubscriber.socket as MockWebSocket;
    assert.equal(socket.outgoingMessages.length, 1);
    {
      let data = socket.dequeue();
      assert.equal(data.tableSeatEvents.seats.length, 1);
      assert.equal(data.tableSeatEvents.seats[0].name, "player-guid1");
      assert.equal(data.tableSeatEvents.seats[0].guid, "guid1");
      assert.equal(data.tableSeatEvents.seats[0].playercards[0] + data.tableSeatEvents.seats[0].playercards[1], 'ADKD');
      assert.equal(data.game.board.length, 5);
      assert.equal(data.game.pot, 100);
      assert.equal(data.game.tocall, 10);
      assert.equal(data.game.dealer, 1);
    }

    for(let otherSubscriber of [ socket2, socket3 ]){
      let data = otherSubscriber.dequeue();
      assert.equal(data.tableSeatEvents.seats.length, 1);
      assert.equal(data.tableSeatEvents.seats[0].name, "player-guid1");
      assert.equal(data.tableSeatEvents.seats[0].isSittingOut, false);
    }
    
  });

    it('getNextDealerSeat two player in position', function () {
      
      assert.equal(table.getNextDealerSeat([
        getPlayerTableHandle(new User(), 0),
        getPlayerTableHandle(new User(), 1)]),

        0);

      table.dealerSeat = 0;
      assert.equal(table.getNextDealerSeat([
        getPlayerTableHandle(new User(), 0),
        getPlayerTableHandle(new User(), 1)]),

        1);
    });

  it('getNextDealerSeat two player not at first seat', function () {

    assert.equal(table.getNextDealerSeat([
      getPlayerTableHandle(new User(), 3),
      getPlayerTableHandle(new User(), 4)]),

      3);

   
  });

  it('getNextDealerSeat multi player middle position', function () {
    table.dealerSeat = 3;
    assert.equal(table.getNextDealerSeat([
      getPlayerTableHandle(new User(), 3),
      getPlayerTableHandle(new User(), 4),
      getPlayerTableHandle(new User(), 5)
      ]),

      4);  

    table.dealerSeat = 4;
    assert.equal(table.getNextDealerSeat([
      getPlayerTableHandle(new User(), 3),
      getPlayerTableHandle(new User(), 4),
      getPlayerTableHandle(new User(), 5)
      ]),

      5);    
  });

  it('getNextDealerSeat wrap around', function () {

    table.dealerSeat = 8;
    assert.equal(table.getNextDealerSeat([
      getPlayerTableHandle(new User(), 1),
      getPlayerTableHandle(new User(), 5),
      getPlayerTableHandle(new User(), 8)
    ]),

      1);

    table.dealerSeat = 5;
    assert.equal(table.getNextDealerSeat([
      getPlayerTableHandle(new User(), 3),
      getPlayerTableHandle(new User(), 4),
      getPlayerTableHandle(new User(), 5)
      ]),

      3);

  });

  it('handleSetTableOptionRequest', function () {
    var setTableOptionRequest = new SetTableOptionRequest(undefined);
    setTableOptionRequest.sitOutNextHand = true;
    table.getPlayers().push(getPlayerTableHandle(subscriber.user, 1));

    table.handleSetTableOptionRequest(setTableOptionRequest, subscriber.user.guid);

    assert.equal(table.getPlayers()[0].sitOutNextHand, true);

  });

  it('leaveTable', async () => {
    table.dataRepository = TestHelpers.getDataRepository();
    let playerHandle = getPlayerTableHandle(subscriber.user, 1);
    playerHandle.stack = 1;
    table.getPlayers().push(playerHandle);    

    await table.leaveTableInternal(playerHandle, false);
    assert.equal(table.getPlayers().length, 0);    
    assert.equal('ABCDEF', socket1.getLastMessage().user.guid);//guid from test db user
  });

  it('exception when adding 2 different users to same seat', function () {
    
    table.addPlayerHandle(getJoinTableRequest(1, subscriber.user, 1000));
    assert.throws(()=>{
      table.addPlayerHandle(getJoinTableRequest(1, subscriber2.user, 1000));
    }, Error);;

     assert.equal(1, table.getPlayers().length)

  });

  it('user cannot join tournament table', () => {
    
    let request = getJoinTableRequest(1, subscriber.user, 1000);
    table.tournamentId = '5aa724aed855ec4e100b70f3'
      let result = table.handleJoinTableRequest(request);
      assert.equal(result.success, false);
      assert.equal(result.errorMessage, "Cannot join a tournament table");

  });

  it('subscriber receives GameStartingEvent on subscribe', () => {
    
    let startingAt = new Date();
    startingAt.setSeconds(startingAt.getSeconds() + 6);
    table.gameStarting = startingAt;
    table.addSubscriber(subscriber2);

    let message = socket2.getLastMessage();
    assert.equal(message.gameStarting.isStarting, true)
    assert.equal(message.gameStarting.startsInNumSeconds, 6)

  });

  it('getPriorPlayerIndex', () => {
    
    let seat1 = getPlayerTableHandle(new User(), 1);
    seat1.hasFolded = true;
    let seat2 = getPlayerTableHandle(new User(), 2);
    seat2.hasFolded = true;
    let seat3 = getPlayerTableHandle(new User(), 3);  
    let seat4 = getPlayerTableHandle(new User(), 4);
    let seat5 = getPlayerTableHandle(new User(), 5);
    seat5.stack = 0;    
    table.currentPlayers = [seat1,seat2,seat3,seat4,seat5 ]
    
    let index = table.getPriorPlayerIndex(1);
    
    assert.equal(3, index);

  });

  it('blinds not changing', () => {
    
    table.blindConfig = [ new BlindConfig(1,2,5) ]
    table.blindsStartTime = new Date(new Date().getTime() - 60*1000);
    
    table.handleGameStartingEvent();

    assert.equal(table.tableConfig.smallBlind, 1);
    assert.equal(table.tableConfig.bigBlind, 2);

    let message = socket1.getLastMessage();    
    assert.equal(null, message.tableConfigs)
    assert.equal(3, message.gameStarting.startsInNumSeconds)
    assert.equal(undefined, message.gameStarting.blindsChanging)
    

  });

  it('blind config', () => {
    
    table.blindConfig = [ new BlindConfig(10,20,5) ]
    table.blindsStartTime = new Date(new Date().getTime() - 60*1000);
    
    table.handleGameStartingEvent();

    assert.equal(table.tableConfig.smallBlind, 10);
    assert.equal(table.tableConfig.bigBlind, 20);

    let message = socket1.getLastMessage();    
    assert.equal(10, message.tableConfigs.rows[0].smallBlind)
    assert.equal(20, message.tableConfigs.rows[0].bigBlind)
    assert.equal(10, message.gameStarting.blindsChanging.smallBlind)
    assert.equal(20, message.gameStarting.blindsChanging.bigBlind)

  });

  it('blind increase', () => {
    
    table.blindConfig = [ new BlindConfig(10,20,5), new BlindConfig(50,100,5) ]
    table.blindsStartTime = new Date(new Date().getTime() - 6*60*1000);
    
    table.handleGameStartingEvent();

    assert.equal(table.tableConfig.smallBlind, 50);
    assert.equal(table.tableConfig.bigBlind, 100);

    let message = socket1.getLastMessage();    
    assert.equal(50, message.tableConfigs.rows[0].smallBlind)
    assert.equal(100, message.tableConfigs.rows[0].bigBlind)
    assert.equal(6, message.gameStarting.startsInNumSeconds)
    assert.equal(50, message.gameStarting.blindsChanging.smallBlind)
    assert.equal(100, message.gameStarting.blindsChanging.bigBlind)

  });

  it('last blind is used', () => {
    
    table.blindConfig = [ new BlindConfig(10,20,5), new BlindConfig(50,100,5), new BlindConfig(200,400,5)]
    table.blindsStartTime = new Date(new Date().getTime() - 20*60*1000);
    
    table.handleGameStartingEvent();

    assert.equal(table.tableConfig.smallBlind, 200);
    assert.equal(table.tableConfig.bigBlind, 400);

    let message = socket1.getLastMessage();    
    assert.equal(200, message.tableConfigs.rows[0].smallBlind)
    assert.equal(400, message.tableConfigs.rows[0].bigBlind)
    assert.equal(200, message.gameStarting.blindsChanging.smallBlind)
    assert.equal(400, message.gameStarting.blindsChanging.bigBlind)

  });

  it('invalid seat number', () => {

    let request = getJoinTableRequest(10, subscriber.user, 1000);

    let result = table.handleJoinTableRequest(request);
    assert.equal(result.success, false);
    assert.equal(result.errorMessage, "Invalid seat number: 10. Must be between 1 and 9");

  });

  it('getNextBlind', () => {

    table.blindsStartTime = new Date();
    table.blindsStartTime.setMinutes(new Date().getMinutes() - 130);
    table.blindConfig = [];
    let blindConfig = table.blindConfig;
    blindConfig.push(new BlindConfig(10, 20, 20));
    blindConfig.push(new BlindConfig(20, 40, 20));
    blindConfig.push(new BlindConfig(40, 80, 20));
    blindConfig.push(new BlindConfig(80, 160, 20));
    blindConfig.push(new BlindConfig(150, 300, 20));
    blindConfig.push(new BlindConfig(300, 600, 20));
    blindConfig.push(new BlindConfig(500, 1000, 20));
    blindConfig.push(new BlindConfig(1000, 2000, 20));
    
    let nextBlind:NextBlind = table.getNextBlind(null);

    assert.equal(nextBlind.smallBlind, 1000);
    assert.equal(nextBlind.bigBlind, 2000);

  });

  it('player who has subscribed twice disconnects', () => {

    table.getPlayers().push(getPlayerTableHandle(subscriber.user, 1));
    let subscriber1Duplicate = getTableSubscriber("guid1"); 
    table.addSubscriber(subscriber1Duplicate);

    table.onClientDisconnected(subscriber);

    assert.equal(table.getPlayerAtSeat(1).isDisconnected, false)
   

  });



  

    
});