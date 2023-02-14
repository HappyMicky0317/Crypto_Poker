import { TableViewRow } from './../../poker.ui/src/shared/TableViewRow';
import { LoginRequest } from './../../poker.ui/src/shared/login-request';
import * as assert from 'assert';
var substitute = require('jssubstitute');
var crypto = require('crypto');
import { PokerProcessor, IHttpIncomingRequest } from "../src/poker-processor";
import { MockWebSocket } from "./mockWebSocket";
import { Table } from "../src/table";
import { IDataRepository } from "../src/services/documents/IDataRepository";
import { DataContainer, ChatMessage, Account, AccountWithdrawlResult } from "../../poker.ui/src/shared/DataContainer";
import {Currency } from "../../poker.ui/src/shared/Currency";
import { User } from "../src/model/User";
import { ClientMessage, JoinTableRequest as ClientJoinTableRequest, ListTablesRequest, SubscribeToTableRequest, FundAccountRequest, SetTableOptionRequest,
  ChatRequest, BetRequest, AccountWithdrawlRequest } from "../../poker.ui/src/shared/ClientMessage";
import {TestHelpers} from "./test-helpers";
import {WebSocketHandle} from "../src/model/WebSocketHandle";
import { ExchangeRate } from "../../poker.ui/src/shared/ExchangeRate";
import { PaymentStatus } from "../../poker.ui/src/shared/PaymentStatus";
import { Helpers } from "../src/helpers";
import protobufConfig from './../../poker.ui/src/shared/protobuf-config';
import { TournamentLogic } from '../src/handlers/TournamentLogic';
import { RequestHandlerInit } from '../src/RequestHandlerInit';
import { TableConfig } from '../src/model/TableConfig';
import { SharedHelpers } from '../src/shared-helpers';
import { CurrencyConfig } from '../src/model/CurrencyConfig';
import { IConnectionToPaymentServer } from '../src/admin/AdminSecureSocketService';
import { GameServerToPaymentServerMessage } from '../src/admin/model/GameServerToPaymentServerMessage';
import { CheckPaymentsTrigger } from '../src/admin/model/outgoing/CheckPaymentsTrigger';
import { Payment } from '../src/model/Payment';
import { ISubstitute } from './shared-test-helpers';
import to from '../../poker.ui/src/shared/CommonHelpers';
import { encrypt } from '../src/framework/encryption';
import { TableProcessorMessage, TableProcessorResult } from '../src/admin/processor/table-processor/TableProcessor';
import { JoinTableResult } from '../src/model/table/JoinTableResult';
import { JoinTableRequest } from '../src/model/table/JoinTableRequest';
import environment from '../src/environment';


describe('#PokerProcessor()', function() {
    var processor: PokerProcessor;
    var httpIncomingRequest: IHttpIncomingRequest;
    const connectionToPaymentServer:any = substitute.for(new IConnectionToPaymentServer());;
  let currencyConfig:CurrencyConfig;
  protobufConfig.init();

  let dataRepository: ISubstitute<IDataRepository>;
    beforeEach(() => {      
      process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
      process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC'; 
      substitute.throwErrors();
      dataRepository = <any>TestHelpers.getDataRepository();
        processor = new PokerProcessor(dataRepository);
        processor.tournamentLogic = substitute.for(new TournamentLogic(null, null, null, null, null, null));
        new RequestHandlerInit().init(dataRepository, processor, processor.tournamentLogic, connectionToPaymentServer, null);
        httpIncomingRequest = { headers: { cookie: 'guid=ABCDEF;isNewUser=1,' }, url:'' };      
        (<any>httpIncomingRequest).customData = {user:null,sid:''};
        currencyConfig = new CurrencyConfig();   
        currencyConfig.minimumWithdrawl = '0.001';
  });
  
    let setupSubstitutedRepository = (): any => {
    let dataRepositorySub = <any>processor.dataRepository;
    let user = new User();
    let accounts:Account[] = [];
    accounts.push(new Account(Currency.free, 1000));
    accounts.push(new Account(Currency.dash, 5123456));
    for(let account of accounts){
      account.updateIndex = 0;
    }
    dataRepositorySub.returns('getUser', Promise.resolve(user));
    dataRepositorySub.returns('getCurrencyConfig', Promise.resolve(currencyConfig));
    dataRepositorySub.returns('getUserAccounts', Promise.resolve(accounts));
    dataRepositorySub.returns('getUserAccount', Promise.resolve(accounts[1]));
    dataRepositorySub.returns('getAddressInfoByAddress', Promise.resolve([]));

    return dataRepositorySub;
  }

  it('should return tables from repository', function() {
      processor.dataRepository.getExchangeRate = (base: string) => {
        let exchangeRate: ExchangeRate;
        if (base.toLowerCase() === "dash") {
          exchangeRate = new ExchangeRate();
          exchangeRate.price = 190.43589233;
        }
        return Promise.resolve(exchangeRate);
      }

      return processor.loadTables().then(()=> {
            let tables = processor.getTables();
            assert.equal(tables.length, 2);
            
            let table1= tables.find(t=>t.tableConfig.name=="table1");
            assert.equal(table1.tableConfig.smallBlind, 52511);
            assert.equal(table1.tableConfig.bigBlind, 105022);

            let table2= tables.find(t=>t.tableConfig.name=="table2");
          assert.equal(table2.tableConfig.smallBlind, 10);
          assert.equal(table2.tableConfig.bigBlind, 20);
          
        });
    });
	it('add table', function() {
      
	  processor.addTable(new Table(TestHelpers.getTableConfig()));
	  assert.equal(processor.getTables().length, 1);
    });

  it('handle socket connection new user', async()=> {
    let substituteRepo = substitute.for(dataRepository);
    processor.dataRepository = substituteRepo;
    substituteRepo.callsThrough('getUser');
	  processor.addTable(new Table(TestHelpers.getTableConfig()));
    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    assert.equal(processor.clients.length, 1);
        var socketHandle = processor.clients[0];
        assert.equal(socketHandle.user.guid.length > 0, true);
        assert.equal(socketHandle.user.screenName.length, 8);
        assert.equal(socketHandle.user.screenName.substr(0, 4), "anon");
        substituteRepo.didNotReceive('getUser');
  });

  it('verifyClient', async () => {
    //the sid below was created using:
    //let tmp = encrypt( JSON.stringify({guid:'d38c3b43c803f9056f98a5355ed1b84bd0345296'}))
    //console.log('tmp', tmp)
    let user = new User();
    user.guid = 'd38c3b43c803f9056f98a5355ed1b84bd0345296';
    processor.dataRepository.getUser = (guid: string) => { return Promise.resolve(guid===user.guid?user:null); }
    let sid = '48babfe44148b739cedd07ef6b003edf48586672d8b3f41f4368ca8179b7a278a96120789435f23a2bb8bbfc6830993aeb0839cad30835e76305b44132329985$8a2949a87d4a1443070830adf684b461$2e4ef89bdbf2d8d153ef4fe26aefc602b5a136a4ee51c3ff911420fc9047962b';
    httpIncomingRequest.url = `/ws?sid=${sid}`;
    let info:any = { req: httpIncomingRequest};
    await processor.verifyClient(info, (success:boolean)=> {
      assert.equal(success, true);
    });
    
    assert.equal(processor.clients.length, 0);
    assert.equal(user, info.req.customData.user);
  });

    it('handle_socket_connection_existing_user', async () => {
      let socket = new MockWebSocket();
      let user = new User();
      user.guid = 'd38c3b43c803f9056f98a5355ed1b84bd0345296';
      processor.dataRepository.getUser = (guid: string) => { return Promise.resolve(guid===user.guid?user:null); }
      (<any>httpIncomingRequest).customData = { user: user, sid: 'sid'};

      await processor.connection(socket, httpIncomingRequest)
      
      assert.equal(processor.clients.length, 1);
      assert.equal(processor.clients[0].user.guid, user.guid);
      assert.equal(socket.getLastMessage().loginResult.sid, 'sid');
      
    });

    it('handle_socket_connection_invalid_sid', async () => {
      let substituteRepo = <any>processor.dataRepository;
      dataRepository.getUser = ()=> Promise.resolve(null);
      let socket = new MockWebSocket();
      httpIncomingRequest.url = "/ws?sid=_";

      await processor.connection(socket, httpIncomingRequest)
      
      assert.equal(processor.clients.length, 1);
      assert.equal(processor.clients[0].user.guid, 'ABCDEF');
      substituteRepo.didNotReceive('getUser');
    });

    it('same IP disconnects first user', async () => {
      environment.debug = false;
      dataRepository.getUser = ()=> Promise.resolve(null);
      let socket1 = new MockWebSocket();
      let socket2 = new MockWebSocket();
      await processor.connection(socket1, httpIncomingRequest);

      let guid2 = crypto.randomBytes(20).toString('hex');
      let httpIncomingRequest2 = { headers: { cookie: `guid=${guid2};isNewUser=1,` }, url:'' };      
      (<any>httpIncomingRequest2).customData = {user:null,sid:''};
      await processor.connection(socket2, httpIncomingRequest2);
      
      assert.equal(processor.clients.length, 2);//will be disconnected after 5 sec
      let lastMessage = socket1.getLastMessage();
      assert.equal(lastMessage.duplicateIpAddress != null, true)
    });


  it('join table request is forwarded to table', async () => {

    let dataRepositorySub = setupSubstitutedRepository();    
    processor.addTable(new Table(new TableConfig("table1", 1, 2, Currency.free, "id1")));
    
    let joinTableResult = new JoinTableResult();
    joinTableResult.success = true;

    let tableTmp = new Table(new TableConfig("table2", 1, 2, Currency.dash, "id2"));
    tableTmp.sendTableProcessorMessage = (message:TableProcessorMessage):Promise<TableProcessorResult> => { return null };
    tableTmp.validateJoinTable = (req: any) => { return joinTableResult };
    let table = substitute.for(tableTmp);    
    table.callsThrough('sendTableProcessorMessage');
    table.callsThrough('validateJoinTable');
    table.callsThrough('getTableConfigUpdate');
    processor.addTable(table);
    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let joinTableRequest = new ClientJoinTableRequest();
    joinTableRequest.seat = 1;
    joinTableRequest.tableId = "id2";
    (<any>joinTableRequest).amount = "5123456";
    let ws = new WebSocketHandle(socket);
    ws.user = new User();
    ws.user.guid = 'guid1';
    let message = new ClientMessage();
    message.joinTableRequest = joinTableRequest;

    await processor.onSocketMessage(ws, message);
    
    let tMessage = <TableProcessorMessage>table.argsForCall('sendTableProcessorMessage', 0)[0];
    assert.equal(tMessage.joinTableRequest.seat, 1);
    assert.equal(tMessage.joinTableRequest.stack, 5123456);    

    dataRepositorySub.receivedWith('updateUserAccount', 'guid1', Currency.dash, -joinTableRequest.amount, 0);
  }
    );

  it('join table request fails validation', async () => {

    let user = new User();
    
    processor.dataRepository.getUser = (guid: string) => { return Promise.resolve(user); }
    let table = substitute.for(new Table(new TableConfig("table2", 1, 2, Currency.dash, "id2")));    
    table.validateJoinTable = (req: any) => { return new JoinTableResult() };
    processor.addTable(table);
    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let joinTableRequest = new ClientJoinTableRequest();
    joinTableRequest.seat = 1;
    joinTableRequest.tableId = "id2";
    let ws = new WebSocketHandle(socket);
    ws.user = new User();
    let message = new ClientMessage();
    message.joinTableRequest = joinTableRequest;

    await processor.onSocketMessage(ws, message)
    table.didNotReceive('handleJoinTableRequest');        
    
    

  });

  it('request stack size exceeds player balance', async ()=> {

    let account = new Account(Currency.dash, 1000);
    processor.dataRepository.getUserAccount = (guid: string, currency: string) => { return Promise.resolve(account); }
    let table = substitute.for(new Table(new TableConfig("table2", 1, 2, Currency.dash, "id2")));    
    table.validateJoinTable = (req: any) => { return new JoinTableResult() };
    processor.addTable(table);
    
    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let joinTableRequest = new ClientJoinTableRequest();
    (<any>joinTableRequest).amount = "2000";
    joinTableRequest.tableId = "id2";
    let ws = new WebSocketHandle(socket);
    ws.user = new User();
    let message = new ClientMessage();
    message.joinTableRequest = joinTableRequest;

    return processor.onSocketMessage(ws, message)
      .then(() => {
        table.didNotReceive('handleJoinTableRequest');
        assert.equal(socket.getLastMessage().error.message, "request stack size of 2000 exceeds player balance of 1000");
      });
  });

  it('non integer request amount', async ()=> {
    processor.dataRepository.getUserAccount = (guid: string, currency: string) => { return Promise.resolve(new Account(Currency.dash, 1000)); }    
    
    processor.addTable(new Table(new TableConfig("table2", 1, 2, Currency.dash, "id2")));

    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let joinTableRequest = new ClientJoinTableRequest();
    (<any>joinTableRequest).amount = 12.34;
    joinTableRequest.tableId = "id2";
    let ws = new WebSocketHandle(socket);
    ws.user = new User();
    let message = new ClientMessage();
    message.joinTableRequest = joinTableRequest;

    return processor.onSocketMessage(ws, message)
      .then(() => {        
        assert.equal(processor.getTables()[0].getPlayerCount(), 0);
        assert.equal(socket.getLastMessage().error.message, "request amount of 12.34 is invalid");
      });
  });

  it('non integer request amount2', async ()=> {
    
    processor.dataRepository.getUserAccount = (guid: string, currency: string) => { return Promise.resolve(new Account(Currency.dash, 1000)); }    
        processor.addTable(new Table(new TableConfig("table2", 1, 2, Currency.dash, "id2")));
    
        let socket = new MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let joinTableRequest = new ClientJoinTableRequest();
        (<any>joinTableRequest).amount = "";
        joinTableRequest.tableId = "id2";
        let ws = new WebSocketHandle(socket);
        ws.user = new User();
        let message = new ClientMessage();
        message.joinTableRequest = joinTableRequest;

        await processor.onSocketMessage(ws, message);
        
        assert.equal(processor.getTables()[0].getPlayerCount(), 0);
        assert.equal(socket.getLastMessage().error.message, "request amount of  is invalid");
      });
    



  it('fund request is forwarded to account service', async()=> {
    
    processor.addTable(new Table(new TableConfig("table1", 1, 2, "bcy", "id1")));    
    let socket = new MockWebSocket();
    processor.connection(socket, httpIncomingRequest);

    let message = new ClientMessage();
    message.fundAccountRequest = new FundAccountRequest('bcy');
    
    //accountService.returnsFor('handleFundAccountRequest', Promise.resolve());
    // return processor.logAndEnqueue(processor.clients[0], message)
    //   .then(() => {
    //     accountService.receivedWith('handleFundAccountRequest', substitute.arg.matchUsing(function (r: FundAccountRequestInternal) { return r != null && r.seat === 1 && r.currency === "bcy" && r.socketHandle === processor.clients[0]; }));
    //   });
    
  });

  it('client listTables', async () => {
    const tConfig = new TableConfig("table1", 1, 2, "bcy");
    tConfig._id = "id";
    let table = substitute.for(new Table(tConfig));
    processor.addTable(table);
    let socket = new MockWebSocket();
    let message = new ClientMessage();
    message.listTablesRequest = new ListTablesRequest();
    await processor.connection(socket, httpIncomingRequest);
    
    await processor.logAndEnqueue(processor.clients[0], message);

    let message2 = socket.getLastMessage();
    let tableConfig = message2.tableConfigs.rows[0] as TableViewRow;
    assert.equal(tableConfig.name, "table1");
    table.didNotReceive('handleJoinTableRequest');

  });

    it('subscribe to table', async() => {        
        let table1 = substitute.for(new Table(new TableConfig("table1", 1, 2, "bcy", "id1")));
        let table2 = substitute.for(new Table(new TableConfig("table2", 1, 2, "bcy", "id2")));
        processor.addTable(table1);
        processor.addTable(table2);
        
        let socket = new MockWebSocket();
        await processor.connection(socket, httpIncomingRequest);
        let message = new ClientMessage();
        message.subscribeToTableRequest = new SubscribeToTableRequest();
        message.subscribeToTableRequest.tableId = "id2";

      return processor.logAndEnqueue(processor.clients[0], message)
        .then(() => {
          table2.receivedWith('addSubscriber', substitute.arg.matchUsing(function (arg: any) {
            return arg instanceof WebSocketHandle && arg === processor.clients[0];
          }));
          table1.didNotReceive('addSubscriber');
          table1.receivedWith('removeSubscriber', substitute.arg.matchUsing(function (arg: any) {
            return arg === processor.clients[0];
          }));       
        });
         
    });

  it('client is removed on socket close', async()=> {
    
    const tConfig1 = new TableConfig();
    tConfig1._id = "id1";
      let table1 = substitute.for(new Table(tConfig1));
    const tConfig2 = new TableConfig();
    tConfig2._id = "id2";
      let table2 = substitute.for(new Table(tConfig2));
      processor.addTable(table1);
      processor.addTable(table2);
      let socket = new MockWebSocket();      
      await processor.connection(socket, httpIncomingRequest);
      let socketHandle = processor.clients[0];
	    socket.triggerClose(); 
    
    
      assert.equal(processor.clients.length, 0);
      table1.receivedWith('onClientDisconnected', substitute.arg.matchUsing((arg:any) => { return arg === socketHandle; })); 
      table2.receivedWith('onClientDisconnected', substitute.arg.matchUsing((arg:any) => { return arg === socketHandle; })); 
    });



  it('sit out next hand', async()=> {    
      let table1 = substitute.for(new Table(TestHelpers.getTableConfig()));
      table1.tableConfig = new TableConfig("table1", 1, 2, "bcy");
    table1.tableConfig._id = "id1";
      
    processor.addTable(table1);    
    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let message = new ClientMessage();
    message.setTableOptionRequest = new SetTableOptionRequest("id1");    

    await processor.logAndEnqueue(processor.clients[0], message);
    let tMessage = <TableProcessorMessage>table1.argsForCall('sendTableProcessorMessage', 0)[0];
    assert.equal(tMessage.setTableOptionRequest.request.tableId, 'id1');
    assert.equal(tMessage.setTableOptionRequest.user.guid, processor.clients[0].user.guid);
    assert.equal(tMessage.setTableOptionRequest.user.screenName, processor.clients[0].user.screenName);
   
    
  });

  it('send chat message', async() => {
        let table = new Table(TestHelpers.getTableConfig());
        dataRepository.getUser = ()=> Promise.resolve(null);
      
      table.tableConfig._id = "id1";
        table.dataRepository = processor.dataRepository;
        processor.addTable(table);

        let addTableSubscriber = async(userGuid:string)=> {
          let socket = new MockWebSocket();
          let req = { headers: { cookie: `guid=${userGuid};isNewUser=1` }, url:'',customData : {sid:''} };
          await processor.connection(socket, req);
          let tableSubscriber = processor.clients[processor.clients.length-1];          
          table.addSubscriber(tableSubscriber);          
          return socket;
        }
        let socket1 = await addTableSubscriber("user1");
        let socket2 = await addTableSubscriber("user2");
        let socket3 = await addTableSubscriber("user3");
        let message = new ClientMessage();
        message.chatRequest = new ChatRequest("id1", "hi");
        let sockets = [socket1, socket2, socket3];
        for (let socket of sockets){
          socket.clearMessages();
        }

        await processor.logAndEnqueue(processor.clients[0], message);
        for (let socket of sockets) {
          assert.equal(1, socket.outgoingMessages.length);

          let dataContainer = socket.getLastMessage();              
          let chatMessage = dataContainer.chatMessageResult.messages[0] as ChatMessage;
          assert.equal('id1', dataContainer.chatMessageResult.tableId);
          assert.equal('hi', chatMessage.message);
          assert.equal('anonuser', chatMessage.screenName);
        }
    });

  it('bet is forwarded to table', async ()=> {

    let substituteRepo = <any>processor.dataRepository;
    let table = substitute.for(new Table(new TableConfig("table1", 1, 2, "bcy", "id1")));
    processor.addTable(table);
    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let message = new ClientMessage();
    message.bet = new BetRequest();
    message.bet.amount = 5;
    message.bet.tableId = "id1";

    await processor.logAndEnqueue(processor.clients[0], message)
    
    substituteRepo.receivedWith('saveClientMessage', message, "id1", processor.clients[0].user.guid); 
    let args = table.argsForCall('sendBet', 0);
    assert.equal(args[0], 5);
    assert.equal(args[1].guid, processor.clients[0].user.guid);
  });


  

  it('handleAccountWithdrawlRequest invalid balance', async () => {    
    let dataRepositorySub = setupSubstitutedRepository();
    processor.dataRepository.getUserAccount = (guid: string, currency: string) => { return Promise.resolve(new Account('bcy', 0)); }    

    let result = new AccountWithdrawlResult();
    result.success = true;//should not even make it to the point where this is returned    

    let socket = new MockWebSocket();
    await processor.connection(socket, httpIncomingRequest);
    let message1 = new ClientMessage();
    message1.accountWithdrawlRequest = new AccountWithdrawlRequest();
    message1.accountWithdrawlRequest.currency = 'bcy';

    await processor.logAndEnqueue(processor.clients[0], message1)
    let lastMessage = socket.getLastMessage();
    assert.equal(false, lastMessage.accountWithdrawlResult.success);
    assert.equal('Invalid withdrawl amount', lastMessage.accountWithdrawlResult.errorMessage);
  });

  it('handle saveClientMessage  error', async ()=> {
    let user = new User();
    let socket = new MockWebSocket();    
    processor.dataRepository.getUser = (guid: string) => { return Promise.resolve(user); }
    await processor.connection(socket, httpIncomingRequest);    
    let message1 = new ClientMessage();
    message1.accountWithdrawlRequest = new AccountWithdrawlRequest();
    message1.accountWithdrawlRequest.currency = Currency.dash;
    processor.clients[0].user = null;
   
    let err:string;
    try {
      processor.logAndEnqueue(processor.clients[0], message1)
    } catch (error) {
      err = error;
    }
    assert.equal(err, "TypeError: Cannot read property 'guid' of null");

    processor.clients[0].user = user;
    let message2 = new ClientMessage();
    message2.accountWithdrawlRequest = new AccountWithdrawlRequest();
    message2.accountWithdrawlRequest.currency = Currency.dash;
    

    await processor.logAndEnqueue(processor.clients[0], message2);
    
    let lastMessage = socket.getLastMessage();
    assert.equal(false, lastMessage.accountWithdrawlResult.success);
    assert.equal('Invalid withdrawl amount', lastMessage.accountWithdrawlResult.errorMessage);
    
  });

  it('handleAccountWithdrawlRequest error', async ()=> {
    let dataRepositorySub = setupSubstitutedRepository();
    dataRepositorySub.returns('updateUserAccount', Promise.resolve( { "result" : { "nModified" : 0 }}));
    dataRepositorySub.returns('getUser', Promise.resolve(null));    

    let socket = new MockWebSocket();
      await processor.connection(socket, httpIncomingRequest);
      let message1 = new ClientMessage();
      message1.accountWithdrawlRequest = new AccountWithdrawlRequest();
      message1.accountWithdrawlRequest.currency = 'dash';
      message1.accountWithdrawlRequest.receivingAddress = 'address1';
      message1.accountWithdrawlRequest.amount = '1000000';
   
    let [err, data] = await to(processor.logAndEnqueue(processor.clients[0], message1))    
    assert.equal(err, 'Error: updateUserAccount: expecting update to exactly 1 document instead {"nModified":0} for player: ABCDEF accountWithdrawlRequest: {"currency":"dash","receivingAddress":"address1","amount":"1000000"}');
    
  });


  it('handleAccountWithdrawlRequest', async ()=> {
      let dataRepositorySub = setupSubstitutedRepository();
      dataRepositorySub.returns('getUser', Promise.resolve(null));      

      let socket = new MockWebSocket();
      await processor.connection(socket, httpIncomingRequest);
      let message1 = new ClientMessage();
      message1.accountWithdrawlRequest = new AccountWithdrawlRequest();
      message1.accountWithdrawlRequest.currency = 'dash';
      message1.accountWithdrawlRequest.receivingAddress = 'address1';
      message1.accountWithdrawlRequest.amount = '1000000';

      await processor.logAndEnqueue(processor.clients[0], message1);
      
      connectionToPaymentServer.receivedWith('send', substitute.arg.matchUsing((r:GameServerToPaymentServerMessage)=>{
        if(r != null){
          assert.equal(r.constructor.name, CheckPaymentsTrigger.name)          
          return true;
        }
        return false;
      }));
      
      dataRepositorySub.receivedWith('updateUserAccount', 'ABCDEF', Currency.dash, -1000000, 0);

      

      dataRepositorySub.receivedWith('savePayment', substitute.arg.matchUsing((payment: Payment) => {
        if(payment != null){
          
          assert.equal(payment.amount, 1000000)
          assert.equal(payment.status, PaymentStatus.pending)
          return true;
        }
        return false;
      }));


      let lastMessage = socket.getLastMessage();
      assert.equal(true, lastMessage.accountWithdrawlResult.success);
  });

  it('removeIdlePlayers', async ()=> {
    let dataRepositorySub = setupSubstitutedRepository();
        
    await processor.setupNewTable(new TableConfig("table1", 1, 2, Currency.free, "id1"));
    let table = processor.getTables()[0];
    table.idleTimeSec = 120;
    table.dataRepository = dataRepositorySub;
    let user1 = new User(); user1.guid = 'guid1';
    let user2 = new User(); user2.guid = 'guid2';
    let user3 = new User(); user3.guid = 'guid3';
    table.addPlayerHandle(new JoinTableRequest(1, user1.guid, user1.screenName, user1.gravatar, 1000));
    table.addPlayerHandle(new JoinTableRequest(2, user2.guid, user2.screenName, user2.gravatar, 1000));
    table.addPlayerHandle(new JoinTableRequest(3, user3.guid, user3.screenName, user3.gravatar, 1000));
    
    let players = table.getPlayers();
    assert.equal(players.length, 3);

    players[1].isSittingOut = true;
    players[1].sittingOutSince = new Date(new Date().getTime() - 2 * 60000);
    players[2].isSittingOut = true;
    players[2].sittingOutSince = new Date(new Date().getTime() - 1 * 60000);

    await processor.checkIdlePlayers();
    assert.equal(table.getPlayers().length, 2);
    assert.equal(table.getPlayers()[0].guid, 'guid1');
    assert.equal(table.getPlayers()[1].guid, 'guid3');
    dataRepositorySub.receivedWith('updateUserAccount', 'guid2', 'usd', 1000);
    
  });

  let setupLoginTest = () : User => {    
    let user = new User();
    user.activated = false;
    user.password = '$2a$05$iDZW.wlhW92whK7I.if.6e4aDxn1H8yBmW1tQ90Hu9na6Y3MBYnfO';
    processor.dataRepository.getUserByEmail = (guid: string) => { return Promise.resolve(user); }
    return user;
  }

  it('login_authenticate_success', async ()=> {
    let user = setupLoginTest();
    user.activated = true;    

    let socket = new MockWebSocket();    
    await processor.connection(socket, httpIncomingRequest);
    let message = new ClientMessage();
    message.loginRequest = new LoginRequest("foo@bar.com", "fred");

    await processor.logAndEnqueue(processor.clients[0], message);
    
    let lastMessage = socket.getLastMessage();
    assert.equal(lastMessage.loginResult.success, true);
    assert.equal(processor.clients[0].authenticated, true);
});

it('login_authenticate_account_not_activated', async ()=> {
  setupLoginTest();

  let socket = new MockWebSocket();
  await processor.connection(socket, httpIncomingRequest);
  let message = new ClientMessage();
  message.loginRequest = new LoginRequest("foo@bar.com", "fred");

  await processor.logAndEnqueue(processor.clients[0], message);
  
  let lastMessage = socket.getLastMessage();
  assert.equal(lastMessage.loginResult.success, false);
  assert.equal(lastMessage.loginResult.errorMessage, 'Account not activated! Please check your email to confirm registration');
  assert.equal(processor.clients[0].authenticated, false);
});

  
  it('convertToDeciGwei', function () {

    let result = SharedHelpers.convertToDeciGwei("50000000000000000")
    assert.equal(result, 5000000);
  });
  
  it('convertToWei', function () {

    let result = SharedHelpers.convertToWei(5000000);
    assert.equal(result, 50000000000000000);
  });


});

  