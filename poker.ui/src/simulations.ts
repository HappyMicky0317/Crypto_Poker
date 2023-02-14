import { TableViewRow } from './shared/TableViewRow';
import { autoinject } from "aurelia-framework";
import {ApiService} from "./lib/api-service";
import {FundingWindow} from "./funding-window";
import { UserData, Account as Account1, DataContainer, LeaderboardResult, LeaderboardUser, CashOutRequestResult, CashOutAccount, FundAccountResult, GameEvent, TournamentSubscriptionResult, SubscribeTableResult, PaymentHistoryResult, PaymentHistoryRowView, TableSeatEvent, SetTableOptionResult, GlobalUsers, UserStatus, GlobalChatResult } from "./shared/DataContainer";
import { LoginResult } from "./shared/login-request";
import { ClientMessage } from "./shared/ClientMessage";
import { TournmanetStatus } from "./shared/TournmanetStatus";
import { EventAggregator } from "aurelia-event-aggregator";
import { DataMessageEvent } from "./messages";
import { TournamentViewRow } from './shared/tournmanet-view-row';
import { TournamentResultView } from './shared/TournamentResultView';
import { Currency } from './shared/Currency';

@autoinject()
export class Simulations {

  constructor(private ea: EventAggregator) {  }
  test() {
     //let tableConfig = { name: "table 1", smallBlind: 29552, smallBlindUsd: 0.1, bigBlind: 59104	, bigBlindUsd: 0.2, currency: 'dash', _id: 'id1', exchangeRate: 1, timeToActSec: 10, maxBuyIn: 10000000 }
     //tableConfig.exchangeRate = 338.38657282079047103410936654034;
    
    let row1 = this.getTableViewRow(Currency.free, 'table1', 'id1');
    let row2 = this.getTableViewRow('dash', 'table2', 'id2');
    let row3 = this.getTableViewRow('btc', 'table3', 'id3');
    let row4 = this.getTableViewRow('eth', 'table4', 'id4');
    let userData = new UserData();
    userData.screenName = 'john';
    userData.initialData=true;
    userData.guid = 'guid1';
    userData.accounts.push(new Account1('usd', 1000));
    //userData.accounts.push(new Account1('dash', 30000000));
    this.sendMessage({ user: userData });    
    this.sendMessage({ tableConfigs: [ row1, row2, row3, row4 ] });
    let subscribeTableResult:SubscribeTableResult = new SubscribeTableResult();
    subscribeTableResult.tableId = "id1";
    
    subscribeTableResult.tableConfig = row1;
    this.sendMessage({subscribeTableResult:subscribeTableResult});
    this.sendTournamentSubscriptionResult();
    this.sendGlobalUsers();
    //this.testGlobalChatResult();
    //setTimeout(() => { this.sendTournamentUpdate1(); }, 3000);
    //setTimeout(() => { this.sendTournamentUpdate2(); }, 6000);
    //setTimeout(() => { this.sendSetAccountSettingsResult(); }, 5000);    
    //setTimeout(() => { this.sendLoginResult(); }, 4000);
    //setTimeout(() => { this.sendCashOutRequest(); }, 1000);
    //setTimeout(() => { this.sendCashOutCompleted(); }, 2000);
    //setTimeout(() => { this.sendPaymentHistoryResult(); }, 2000);

    //this.sendTournamentResult();
    // this.sendGame();    
    // this.seatPlayers();
    // this.dealBoard();
    // this.sendSetTableOptionResult(true)
    
    // setTimeout(() => { this.sendSetTableOptionResult(false); }, 10000);
    
    //this.playerFold();
    
    //this.newHandStartingThenStops();
     //this.sendAccountFunded();
    this.testFundAccount();
    //this.testTableClosed();
    //this.testGlobalChatResult();
    //this.sendTransferFundsResult();
    //setTimeout(() => { this.leaderboard(10); }, 500);
  }

  getTableViewRow(currency:string, name:string, id:string) : TableViewRow{
    let row = new TableViewRow();
    row.name= name;
    row.smallBlind = 1298
    row.smallBlindUsd= 0.1;
    row.bigBlind= 2596;
    row.bigBlindUsd= 0.2;
    row.currency= currency;
    row._id= id;
    row.timeToActSec = 10;
    row.maxBuyIn= 200;
    row.exchangeRate = 7700;
    return row;
  }

  sendSetTableOptionResult(sitOutNextHand:boolean){
    let data = new DataContainer();
    data.setTableOptionResult = new SetTableOptionResult();
    data.setTableOptionResult.tableId = 'id1';
    data.setTableOptionResult.sitOutNextHand = sitOutNextHand;
    this.sendMessage(data);   
  }

  sendPaymentHistoryResult(){
    let message = new DataContainer();
    message.paymentHistoryResult = new PaymentHistoryResult();
    message.paymentHistoryResult.payments = []
    for (let i = 0; i < 20; i++) {
      let confs = Math.random() < 0.5 ? 0:1;
      message.paymentHistoryResult.payments.push(<PaymentHistoryRowView>{
        timestamp: new Date().toISOString(),
        type: Math.random() < 0.5 ? 'outgoing':'incoming',
        currency: 'dash',
        amount: '1000000',
        status: confs === 1 ? 'complete':'pending',
        confirmations: confs,
        requiredConfirmations: 1,
        txHash: 'abcd'
      })      
      
    }
   
    this.sendMessage(message);    
  }
  sendTournamentResult(): any {
    let message = new DataContainer();
    message.tournamentResult = new TournamentResultView('id1', 'Friday Freeroll', 4, "0.01", "dash", false);    
    this.sendMessage(message);    
  }

  sendTournamentSubscriptionResult(){
    let message = new DataContainer();
    message.tournamentSubscriptionResult = new TournamentSubscriptionResult();
    message.tournamentSubscriptionResult.tournaments.push( <TournamentViewRow>{ status: 1,  id:"5aa724aed855ec4e100b70f3", "name":"Friday Freeroll","currency":"dash","startTime":"2018-06-04T23:44:34.826Z","totalPrize":"0.42", "playerCount":0 });
    this.sendMessage(message);    
  }

  sendTournamentUpdate1(){
    let message = new DataContainer();
    message.tournamentSubscriptionResult = new TournamentSubscriptionResult();
    message.tournamentSubscriptionResult.tournaments.push( <TournamentViewRow>{ id:"5aa724aed855ec4e100b70f3", joined: true, playerCount:1 });
    this.sendMessage(message);
  }

  sendTournamentUpdate2(){
    let message = new DataContainer();
    message.tournamentSubscriptionResult = new TournamentSubscriptionResult();
    message.tournamentSubscriptionResult.tournaments.push( <TournamentViewRow>{ id:"5aa724aed855ec4e100b70f3", status: TournmanetStatus.Started });
    this.sendMessage(message);
  }

  sendLoginResult(){
    let result = new LoginResult();
    result.success = true;
    // result.success = false;
    // result.errorMessage = 'Invalid username or password';

    let userData = new UserData();
    userData.accounts.push(new Account1('usd', 999));
    userData.accounts.push(new Account1('dash', 30000000));

    this.sendMessage( { loginResult: result, user: userData});
  }

  handsPlayed:number=0;
  // leaderboard(numUsers:number) {
  //   this.handsPlayed++;
  //   let data = new DataContainer();
  //   data.leaderboardResult = new LeaderboardResult();
        
  //   for (let i = 0; i < numUsers; i++) {
  //     let amount1:number = Math.round(Math.random() * 6000000) * (Math.random() < 0.5 ? -1 : 1);      
  //     // let amount1:number = Math.round(1/10 * 6000000);
  //     data.leaderboardResult.users.push(new LeaderboardUser(`user-${i+1}`, "DASH", this.handsPlayed, amount1));        
  //   }
        
  //   this.sendMessage(data);

  //   setTimeout(() => { this.leaderboard(2); }, 3000);
  // }

  sendTransferFundsResult() {
    setTimeout(() => {
      this.sendMessage({ transferFundsResult: {
        success: true,
        errorMessage: '',
        currency: 'dash',
        amount: 0.03,
        screenName: 'bob'
      } });

      },
      5000);
  }

  sendGlobalUsers(){
    let globalUsers = new GlobalUsers();
    globalUsers.initialData = true;
    for (let i = 0; i < 20; i++) {
      globalUsers.users.push(new UserStatus(`maxLength_${i}`, true, 'nl', 'Netherlands'));
      
    }
    this.sendMessage({
      globalUsers:globalUsers
    })
  }

  testGlobalChatResult() {
    let globalChatResult = new GlobalChatResult();
    for (let index = 0; index < 10; index++) {
      globalChatResult.initialData=true;
      globalChatResult.messages.push({
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        screenName: 'maxLength1',
        tableId:null
      })
      
    }
    this.sendMessage({
      globalChatResult: globalChatResult
    });
  }

  testTableClosed() {


    setTimeout(() => {
      let event = { data: JSON.stringify({ tableClosed: { tableId:'' } }) };
      this.sendMessage(event);
    }, 1500);

    
  }


  seatPlayers() {
    let seats: TableSeatEvent[] = [];
    seats.push(<TableSeatEvent>{ name: "anon3", bet: 29552, seat: 0, empty: false, stack: 3000000, avatar: '', playing: true, myturn: false, guid: '', playercards: ['10D', '10C'] });
    seats.push(<TableSeatEvent>{ name: "anon2", bet: 2596, seat: 3, empty: false, stack: 7456, avatar: '', playing: true, myturn: true, guid: '', hasFolded: false });
    seats.push(<TableSeatEvent>{ name: "john", bet: 2596, seat: 5, empty: false, stack: 7456, avatar: '', playing: false, myturn: false, guid: 'user1', hasFolded: false, isSittingOut: true });
    this.sendMessage({ seats: seats });
  }

  sendAccountSettings() {
    let data = {
      accountSettings:
      {
        guid: "abcdef",
        screenName: "bob"
      }
    };
    this.sendMessage(data);
  }

  sendSetAccountSettingsResult() {
    let data = {
      setAccountSettingsResult:
      {
        result: false,
        errorMessage: "Screen name too short. Must be at least 3 characters"
      }
    };
    this.sendMessage(data);
  }

  sendCashOutRequest() {
    let result = new CashOutRequestResult();
    let currencies = [ "dash", "eth", "btc"];
    for(let currency of currencies){
      let account = new CashOutAccount();
      account.currency = currency;
      account.balance = Math.round(Math.random()*500000);      
      result.accounts.push(account)
    }
    
    
    let data = new DataContainer();
    data.cashOutRequestResult = result;
   
    this.sendMessage(data);
  }

  sendCashOutCompleted() {
    let successEvent = { accountWithdrawlResult: { success: true, currency: 'dash', fees: 20000, sentAmount: 9512345, balance: 0, errorMessage: "", txHash: "0x8619eb919a1f0fa154d51886749bdc1342a42155394793649534dfc2d809f3da", txHashLink:"https://etherscan.io/tx/${result.txHash}" } };
    let errorEvent = { accountWithdrawlResult: { success: false, fees: 0, sentAmount: 0, balance: 0, errorMessage: "a big long error message here", txHash: "" } };
    this.sendMessage(successEvent);
  }

  sendGame() {
    let data = { game: new GameEvent('id1') };
    data.game.pot.push(3);
    data.game.tocall = 29552;
    this.sendMessage(data);
  }

  sendAccountFunded() {
    setTimeout(() => {
      //let data = { accountFunded: { balance: 1000, currency: "USD", paymentReceived:1000 } };
      let data = { accountFunded: { balance: 50000000, currency: "DASH", paymentReceived: 50000000 } };
      this.sendMessage(data);
    }, 1500);
  }

  

  newHandStartingThenStops() {
    setTimeout(() => {
      let data = { gameStarting: { startsInNumSeconds: 3, isStarting: true } };
      this.sendMessage(data);
    }, 1000);

    setTimeout(() => {
      let data = { gameStarting: { isStarting: false } };
      this.sendMessage(data);
    }, 4000);
  }

  dealBoard() {
    let deal = { board: ['2C', '2H', '2S'] };
    this.sendMessage({ deal: deal });
  }

  playerFold() {
    setTimeout(() => {
      let data = { game: null, seats: [] };
      let game: GameEvent = new GameEvent('id1');
      game.action = 'fold';
      data.game = game;
      data.seats.push({ seat: 3, hasFolded: true });
      this.sendMessage(data);
    }, 1000);
  }

  sendMessage(data) {
    console.log('simulation receiving data' + data);
    this.ea.publish(new DataMessageEvent(data));
    //this.apiService.socket_onmessage({ data: JSON.stringify(data) });
  }

  testFundAccount() {
    
     let balance = 64987;
     let currency = 'btc';
    //let balance = 5000000;
    //let currency = 'dash';
    setTimeout(() => {
      let result = new FundAccountResult();
      result.currency= currency;
      result.paymentAddress= '19AuoKqQb5Tjj7c32mw5LsjBFvGs9jcfs1';
      result.requiredConfirmations= 1;
      result.addressQrCode= 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHIAAAByCAYAAACP3YV9AAAAAklEQVR4AewaftIAAAQ6SURBVO3BW2pkSRYAQfcg979ln+qPA0lzRb6kGnUQZvYHx3/e4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjCjTeo/ISKoTIqrqh8ouIVKqNiqHy3ilcsji0sji3c+FDFJ1QeUXlXxVdUvlvFJ1TesTi2sDi2cOMbqTxS8YyKoTIqhsqo+AkVQ+VVKo9UfGpxbGFxbOHGL6UyKh5RGRVD5SsVQ+WKyqj4rRbHFhbHFm78UhVDZVSMiqHyjIqhMiqGyhWVUfGbLI4tLI4t3PhGFT+hYqiMiisqo+KeyhWVUTFUPlHxNyyOLSyOLSyOLdz4kMpPUBkVr6gYKvcqhsqoGCqjYqg8ovL/sDi2sDi2YH/wC6m8ouIZKlcqhsojFb/J4tjC4tjCjTeojIqhcqViqDyjYqiMiisqVyqeoTIqhsqouKIyKr6iMiqGyr9VvGJxbGFxbMH+4AeojIpPqIyKofKJinepjIqh8pWKR1T+UfGKxbGFxbGFGx9SuVIxVJ5RcaViqIyKoXKl4hkq36HinsoVlSsV71gcW1gcW7A/+IDKKypepTIqrqiMimeovKviu6j8W8UrFscWFscW7A9epHKl4orKJyqGyqh4ROUrFVdUHqm4onKv4m9YHFtYHFu48UNURsWrVH5CxRWVUfGIyqgYFV9RGRVD5d8qXrE4trA4tnDjDRWvUBkV91RGxagYKldURsVQGRX3VK5UXFF5RGVU3FP5GxbHFhbHFhbHFm58SOWRiq9UvKLikYqhcq/iisqoGBVD5UrFUPlKxSMV71gcW1gcW7jxBpVHKp6hMiqGyhWVRyq+ojIqHlH5Liqj4jstji0sji3YH3xA5ZGKoXKvYqhcqbiiMiquqHyiYqi8quJvWBxbWBxbuPEGlVExVB6puKcyKobKFZUrKs+oGCqvqHhE5Z7KqPgpi2MLi2MLN95Q8UjFUPlKxZWKoTIqhsonKobKIyqjYqh8pWKoXKn41OLYwuLYwo0PqYyKRyruqVypeEXFUPmKyqgYFVdUrqg8Q+VKxXdaHFtYHFuwP/iFVN5V8RNURsUzVK5UfKfFsYXFsYUbb1D5CRVXKq6oPKLylYpHVB5RGRXPULlS8Y7FsYXFsYUbH6r4hMojKo9UDJWvVHy3imdUXFEZKv+oeMXi2MLi2MLi2MKNb6TySMUzKt5V8QyVUTFURsVQGSqvUhkVVyresTi2sDi2cOOXUhkVr1AZFfdURsVQGRWvqHiVyndaHFtYHFu48R+g8oqKr1QMlUdUXqFyr+KRiqHyj4pXLI4tLI4t3PhGFd+lYqiMiqEyKl5VcUXlXRX3VK5UDJVR8Y7FsYXFsYUbH1L5CSqvUBkVz1AZFaNiqFypGCqj4l7F37A4tmB/cPznLY4tLI4tLI4tLI4tLI4tLI4tLI4tLI4tLI4tLI4tLI4t/A9tKy36yOmzGAAAAABJRU5ErkJggg==';
      
      this.sendMessage({ fundAccountResult: result });       
    
    }, 5000);

    setTimeout(() => {            
      this.sendMessage({ accountFunded: { paymentReceived: balance, currency: currency, confirmations:0 } });      
    }, 7000);
    setTimeout(() => {      
      this.sendMessage({ accountFunded: { paymentReceived: balance,  balance: balance, currency: currency, confirmations:1 } });
    }, 9000);
  }

}
