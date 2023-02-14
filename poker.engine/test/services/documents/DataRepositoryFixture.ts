import { TableState } from './../../../src/model/TableState';
import * as assert from 'assert';
var mongo = require('mongodb');
var clean = require('mongo-clean');
import { DataRepository } from "../../../src/services/documents/DataRepository";
import { User } from "../../../src/model/User";
import {Account } from "../../../../poker.ui/src/shared/DataContainer";
import {Currency } from "../../../../poker.ui/src/shared/Currency";
import {TableBalance, UserTableAccount } from "../../../src/model/TableBalance";
import { TableConfig } from '../../../src/model/TableConfig';
import { TournamentResult } from '../../../src/model/TournamentResult';
import { Tournament } from '../../../src/model/tournament';
import { PaymentType } from '../../../../poker.ui/src/shared/PaymentType';
import { Payment } from '../../../src/model/Payment';
describe('#DataRepository()', function () {
  let dbName: string = 'pokerGameServerUnitTests';
  let repository: DataRepository;
  let setup: Promise<any>;
  beforeEach(function () {
    repository = new DataRepository(dbName);
    setup = repository.init()
      .then(() => cleanDb(repository.db))
      .then(() => ensureInitialData());
  });

  let ensureInitialData = async () =>{

    var collection = repository.db.collection('tableConfig');
    let dbTables = await collection.find({}).toArray();
    if (dbTables.length == 0) {
      let table1 = new TableConfig('Free Table 1', 1, 2, Currency.free.toUpperCase());
      let table2 = new TableConfig('Free Table 2', 1, 2, Currency.free.toUpperCase());
      let table3 = new TableConfig('Sit n Go 1', 0.1, 0.2, Currency.dash.toUpperCase());
      let table4 = new TableConfig('Sit n Go 2', 0.05, 0.1, Currency.dash.toUpperCase());
      return collection.insertMany([
          table1, table2, table3, table4
      ]);
  }
    
    }

  it('getTablesConfig', function () {

    return setup
      .then(() => repository.getTablesConfig())
      .then((returnValue: TableConfig[]) => {
        assert.equal(returnValue.length, 4);
        assert.equal(returnValue[0].name, 'Free Table 1'); 
        assert.equal(returnValue[1].name, 'Free Table 2');
        assert.equal(returnValue[2].name, 'Sit n Go 1');
        assert.equal(returnValue[3].name, 'Sit n Go 2');
      });

  });

  it('getUser', function () {

    let user1 = new User();    
    user1.guid = "guid-1";
    let user2 = new User();
    user2.guid = "guid-2";
    let user3 = new User();
    user3.guid = "guid-3";
    return setup
      .then(() => repository.saveUser(user1))
      .then(() => repository.saveUser(user2))
      .then(() => repository.saveUser(user3))
      .then(() => repository.getUser("guid-2"))
      .then((returnValue: User) => {
        assert.equal(returnValue.guid, "guid-2");
        
      });

  });

  it('getUser null user', function () {

    
    return setup
      .then(() => repository.getUser('foo'))     
      .then((returnValue: User) => {
        assert.equal(returnValue, null);        
      });

  })

  it('saveUser', async ()=>{
    await setup;
    let user = new User();    
    user.guid = 'guid1';
    user.screenName = 'screenName1';    
    await repository.saveUser(user)

    //fetch user twice representing different processes
    let dbUser1 = await repository.getUser(user.guid);
    let dbUser2 = await repository.getUser(user.guid);

    dbUser1.screenName = 'screenName2';    
    await repository.saveUser(dbUser1)
    
    let error:string;
    try {
      dbUser2.screenName = 'screenName3'
      await repository.saveUser(dbUser2)      
    } catch (e) {
      error=e;
    }
    assert.equal(error, 'Error: expecting modified count of 1 instead it is 0')

    let finalDbUser = await repository.getUser(user.guid);    
    assert.equal(finalDbUser.screenName, 'screenName2')
    
  })


  it('getPaymentAddress', async () => {

    let user1 = new User();
    user1.guid = "guid-1";
    let user2 = new User();
    user2.guid = "guid-2";  
    await setup;
    await repository.saveUser(user1)  
    await repository.saveUser(user2)
    let returnValue: User = await repository.getUser("guid-2")
    assert.equal(returnValue.guid, "guid-2");

  });

  it('saveTableConfig', async () => {

    let config = new TableConfig();
    config.name = 'new_random_name';
    
    await setup;
    await repository.saveTableConfig(config)  
    
    assert.notEqual(config._id, null);

    config._id = config._id.toString();
    config.timeToActSec = 30;
    await repository.saveTableConfig(config)  
    let configs = (await repository.getTablesConfig()).filter(t=>t.name=='new_random_name');
    assert.equal(1, configs.length)
    assert.equal(30, configs[0].timeToActSec)

  });


  
  it('updateUserAccount', async () => {
    
    await setup;
    await repository.updateUserAccount("guid-1", Currency.free, 1)
    await repository.updateUserAccount("guid-1", Currency.dash, 2)
        
    await repository.updateUserAccount("guid-2", Currency.free, 3)
    await repository.updateUserAccount("guid-2", Currency.dash, 4)
    await repository.updateUserAccount("guid-2", Currency.bcy, 5)
        
    let data = await repository.updateUserAccount("guid-2", 'DASH', 6)
    assert.equal(data.result.nModified, 1);
    let accounts1 = await repository.getUserAccounts("guid-1");
    assert.equal(accounts1.length, 2);
    assert.equal(accounts1.find(a=>a.currency==Currency.free).balance, 1);
    assert.equal(accounts1.find(a=>a.currency==Currency.dash).balance, 2);
    
    let accounts2 = await repository.getUserAccounts("guid-2");    
    assert.equal(accounts2.length, 3);
    assert.equal(accounts2.find(a=>a.currency==Currency.free).balance, 3);
    assert.equal(accounts2.find(a=>a.currency==Currency.dash).balance, 10);
    assert.equal(accounts2.find(a=>a.currency==Currency.bcy).balance, 5);    
  });

  it('updateUserAccount where account does not exist', async ()=>{
    await setup;
    let data = await repository.updateUserAccount('guid1', 'DASH', 6)
    
    assert.equal(data.result.n, 1);
    assert.equal(data.result.nModified, 0);
    //console.log('data', data.result)

    let account = await repository.getUserAccount('guid1', 'DASH')
    assert.equal(account.guid, 'guid1')
    assert.equal(account.currency, 'dash')
    assert.equal(account.balance, 6)
  })

  it('updateUserAccount where account exists', async ()=>{
    await setup;
    await repository.updateUserAccount('guid1', 'DASH', 2000000)
    
    let data = await repository.updateUserAccount('guid1', 'DASH', 3123456)
    assert.equal(data.result.n, 1);
    assert.equal(data.result.nModified, 1);
    let account = await repository.getUserAccount('guid1', 'DASH')
    assert.equal(account.guid, 'guid1')
    assert.equal(account.currency, 'dash')
    assert.equal(account.balance, 5123456)
  })

  it('decrement player balance', async ()=>{
    await setup;
    await repository.updateUserAccount('guid1', Currency.dash, 2000000)

    let result = await repository.updateUserAccount('guid1', Currency.dash, -500000, 0)
        
    let account = await repository.getUserAccount('guid1', 'DASH')
    assert.equal(account.balance, 1500000)
})

  it('updateUserAccount-large-amount', async ()=> {
    
    await setup;
    await repository.updateUserAccount('guid-1', Currency.eth, 1)    
    let data = await repository.updateUserAccount('guid-1', 'eth', 5000000000000000);
    assert.equal(data.result.nModified, 1);
    let accounts = await repository.getUserAccounts('guid-1');
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].currency, Currency.eth);         
    assert.equal(accounts[0].balance, 5000000000000001);         
      });
  

  it('updateUserAccount race condition', async () => {
    let guid = 'guid-1';
    await setup;    
    await repository.updateUserAccount(guid, Currency.dash, 100000000)    

    //fetch user twice representing different processes
    let dbAccount1 = await repository.getUserAccount(guid, Currency.dash);
    let dbAccount2 = await repository.getUserAccount(guid, Currency.dash);    

    await repository.updateUserAccount(guid, Currency.dash, -1, dbAccount1.updateIndex)

    let error: string;
    try {
      await repository.updateUserAccount(guid, Currency.dash, -2, dbAccount1.updateIndex)
    } catch (e) {
      error = e;
    }
    assert.equal(error, 'Error: expecting modified count of 1 instead it is 0')

    let finalAccount = await repository.getUserAccount(guid, Currency.dash);
    assert.equal(finalAccount.balance, 99999999)
    let accounts = await repository.getUserAccounts(guid);
    assert.equal(accounts.length, 1)

  })

  it('increment-test', function () {
    let db = repository.db;
    return setup
      .then(() => {
        return db.collection('product').save({ name: 'product1', amount: 0 });
      })
      .then(() => {
        return db.collection('product').update({}, { $inc: { "amount": mongo.Long.fromString("5000000000000000") } });
         //var query = "db.getCollection('product').update({ },{ $inc: { 'amount': NumberLong(5000000000000000) } });";
         //return db.eval('function(){ return ' + query + ' }');
      })
      .then(() => {
        return db.collection('product').find({}).toArray();
      })
      .then((results) => {
        assert.equal(results[0].amount, 5000000000000000);
      })

  });

  it('updateTableBalance', function () {

    let tableId: string;
    return setup
      .then(() => {
        return repository.getTablesConfig();
      })
      .then((arr: TableConfig[]) => {
        tableId = arr[0]._id;
        return Promise.all(arr.map((t: TableConfig) => repository.ensureTableBalance(t._id, t.currency)));
      })
      .then((res: any) => {

        return repository.updateTableBalance(tableId, new UserTableAccount('guid-1', 'user1', 1000));
      })
      .then(() => { return repository.getTableBalance(tableId) })
      .then((tableBalance: TableBalance) => {
        assert.equal(tableBalance.accounts.length, 1);
        assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-1').balance, 1000);
      })
      .then(() => repository.updateTableBalance(tableId, new UserTableAccount('guid-2', 'user2', 850)))
      .then(() => repository.updateTableBalance(tableId, new UserTableAccount('guid-3', 'user3', 550)))
      .then(() => { return repository.getTableBalance(tableId) })
      .then((tableBalance: TableBalance) => {
        assert.equal(tableBalance.accounts.length, 3);
        assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-1').balance, 1000);
        assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-2').balance, 850);
        assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-3').balance, 550);
      })
      .then(() => repository.removeTableBalance(tableId, 'guid-2'))
      .then(() => { return repository.getTableBalance(tableId) })
      .then((tableBalance: TableBalance) => {
        assert.equal(tableBalance.accounts.length, 2);
        assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-1').balance, 1000);
        assert.equal(tableBalance.accounts.find(acc => acc.userGuid === 'guid-3').balance, 550);
      });

  });


 
  it('saveTableStates', async() =>{
  
    await setup;
    let id;
    {
      let state = new TableState();
      state.tournamentId = "1234";
      await repository.saveTableStates([state]);
      id = state._id;
  
      let dbStates = await repository.getTableStates();
      assert.equal(1, dbStates.length);
    }
    
    {
      let state = new TableState();
      state.tournamentId = "5678";
      state._id = id;
      let foo = await repository.saveTableStates([state]);
  
      let dbStates = await repository.getTableStates();
      assert.equal(1, dbStates.length);
      assert.equal("5678", dbStates[0].tournamentId);
    }

    {
      let state = new TableState();
      state.tournamentId = "1111";
      state._id = id.toString();
      let foo = await repository.saveTableStates([state]);
  
      let dbStates = await repository.getTableStates();
      assert.equal(1, dbStates.length);
      assert.equal("1111", dbStates[0].tournamentId);
    }

  });

  it('saveTournamentResult', async() =>{
  
    await setup;
    let result3:TournamentResult;
    {
      let results = [ 
        new TournamentResult("id1", "userGuid1", "userGuid1", 1, new Date()),
        new TournamentResult("id2", "userGuid3", "userGuid3",3, new Date()),
        new TournamentResult("id2", "userGuid2", "userGuid2",2, new Date()),
        new TournamentResult("id2", "userGuid4", "userGuid4",4, new Date()),
        
      ];
      result3 = results[2];
      await repository.saveTournamentResult(results);
    }
    
    {
      let results = await repository.getTournamentResults("id2");
      assert.equal(results.length, 3)
      assert.equal(results[0].userGuid, "userGuid2")
      assert.equal(results[1].userGuid, "userGuid3")
      assert.equal(results[2].userGuid, "userGuid4")
    }
    

    result3.prize = "0.2";
    await repository.saveTournamentResult([ result3 ]);

    {
      let results = await repository.getTournamentResults("id2");      
      assert.equal(results.find(r=>r.userGuid=="userGuid2").prize,  "0.2")      
    }

  })

  it('updateTournamentHasAwardedPrizes', async() =>{
  
    await setup;
    
    let tournament = new Tournament();
    await repository.saveTournmanet(tournament);
    let tournamentId:string = tournament._id.toString();
    let commandResult = await repository.updateTournamentHasAwardedPrizes(tournamentId);
        
    assert.equal(commandResult.result.nModified, 1)
    
  })





  it('getLastIncomingPaymentUpdate', async() =>{
  
    await setup;
    let now = new Date();
    
    await repository.savePayment( <any>{ guid: '1', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*5) });//updated 5 min ago
    await repository.savePayment( <any>{ guid: '2', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*10) });//updated 10 min ago
    await repository.savePayment( <any>{ guid: '3', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*20) });//updated 20 min ago
    await repository.savePayment( <any>{ guid: '4', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*1) });//updated 1 min ago
    await repository.savePayment( <any>{ guid: '5', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*2) });//updated 2 min ago
    await repository.savePayment( <any>{ guid: '6', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*7) });//updated 7 min ago    

    let result = await repository.getLastPaymentUpdate();

    assert.equal(result.guid, '4')
    
  })

  it('get payments', async() =>{
  
    await setup;
    
    await repository.savePayment(<any>{ screenName: 'Foo', type: PaymentType.incoming, amount: '3000000'});
    await repository.savePayment(<any>{ screenName: 'Foo', type: PaymentType.outgoing, amount: '3000000'});
    await repository.savePayment(<any>{ screenName: 'John', type: PaymentType.outgoing, amount: '3000000'});    
    
    let result = await repository.getPayments({ type: 'outgoing', screenName: 'foo'})

    assert.equal(result.length, 1)
    assert.equal(result[0].screenName, 'Foo')    
    
  })

  it('getUserByEmail', async() =>{
    await setup;

    let user = new User();
    user.email = "foo@bar.com";
    await repository.saveUser(user)

    let dbUser = await repository.getUserByEmail("foo@bar.com");
    assert.equal(dbUser.email, user.email);

    dbUser = await repository.getUserByEmail("Foo@bar.com");
    assert.equal(dbUser.email, user.email);
  });

  it('getUsersByScreenName', async ()=>{
    await setup;

    let user = new User();
    user.screenName = "john";
    await repository.saveUser(user)

    let users = await repository.getUsersByScreenName("John");
    assert.equal(1, users.length);
  });


  it('getUserIndex', async () => {
    await setup;
    await repository.createNextUserDocument();
    await repository.createNextUserDocument();
    
    let users = []
    for (let i = 0; i < 10; i++) {
      let user = new User();
      user.screenName = `user${i + 1}`;
      user.guid = user.screenName;
      await repository.saveUser(user);
      users.push(user);
    }

    for (let i = 0; i < 10; i++) {
      let index = await repository.getNextUserIndex();
      assert.equal(index, i);      
    }

    await repository.createNextUserDocument();

    for (let i = 10; i < 20; i++) {
      let user = new User();
      user.screenName = `user${i + 1}`;
      user.guid = user.screenName;
      await repository.saveUser(user);
      users.push(user);
    }


    for (let i = 10; i < 20; i++) {
      let index = await repository.getNextUserIndex();
      assert.equal(index, i);      
    }

  });


});



function cleanDb(db: any) {
  return new Promise((fulfill: any, reject: any) => {
    clean(db, (err: any, db: any) => {
      if (err)
        reject();
      else
        fulfill();
    });

  });

}