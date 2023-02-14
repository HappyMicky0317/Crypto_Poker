import { WebSocketHandle } from './../src/model/WebSocketHandle';
import { ISubscriber } from './../src/model/ISubscriber';
var substitute = require('jssubstitute');
import { IDataRepository } from "../src/services/documents/IDataRepository";
import { User } from "../src/model/User";
import { GamePotResult } from "../src/model/TexasHoldemGameState";
import {ExchangeRate} from "../../poker.ui/src/shared/ExchangeRate";
import {ClientMessage, AccountWithdrawlRequest} from "../../poker.ui/src/shared/ClientMessage";
import * as Payment from "../src/model/Payment";
import { Table } from "../src/table";
import * as DataContainer from "../../poker.ui/src/shared/DataContainer";
import {TableBalance} from "../src/model/TableBalance";
import { TableConfig } from '../src/model/TableConfig';
import { Currency } from '../../poker.ui/src/shared/Currency';
import { JoinTableRequest } from '../src/model/table/JoinTableRequest';

export class TestHelpers {
  public static addPlayerHandle(table: Table, seat: number, subscriber: WebSocketHandle): void {
    table.addPlayerHandle(new JoinTableRequest(seat,subscriber.user.guid, subscriber.user.screenName, subscriber.user.gravatar, 1000));
  }

  public static getJoinTableRequest(seat: number, subscriber: WebSocketHandle): JoinTableRequest {    
    return new JoinTableRequest(seat, subscriber.user.guid, subscriber.user.screenName, subscriber.user.gravatar, 1000)
  }

  public static getSubstitute<T>(c: { new (): T; }): T {
    
    let sub = substitute.for(new c());
    return sub;
  }   



  public static getDataRepository(): IDataRepository{
    let dataRepository:any = TestHelpers.getSubstitute(IDataRepository);
    dataRepository.returns('getTablesConfig', Promise.resolve([new TableConfig("table1", 0.1, 0.2, "dash", "id1"), new TableConfig("table2", 0.1, 0.2, "usd", "id1")]));

    let user = new User();
    user.guid = "ABCDEF";
    dataRepository.returns('getUser', Promise.resolve(user));            
    dataRepository.returns('saveUser', Promise.resolve());
    dataRepository.returns('saveGame', Promise.resolve());
    //dataRepository.returns('getAddressInfoByAddress', Promise.resolve());
    dataRepository.returns('saveExchangeRate', Promise.resolve());
    
    dataRepository.returns('getExchangeRate', Promise.resolve());
    dataRepository.returns('saveClientMessage', Promise.resolve());
    dataRepository.returns('savePayment', Promise.resolve());
    dataRepository.returns('saveChat', Promise.resolve());
    dataRepository.returns('getChatMessages', Promise.resolve([]));
    dataRepository.returns('getGames', Promise.resolve([]));
    dataRepository.returns('updateUserAccount', Promise.resolve({ result: { nModified: 1 } }));
    dataRepository.returns('updateTableBalance', Promise.resolve({ result: { nModified: 1 } }));
    dataRepository.returns('removeTableBalance', Promise.resolve({ result: { nModified: 1 } }));
    dataRepository.returns('ensureTableBalance', Promise.resolve(new TableBalance('id1', Currency.free)));
    //dataRepository.returns('xxx', Promise.resolve());
    return dataRepository;
    }

  public static getTableConfig(): TableConfig {
      let tableConfig = new TableConfig("table1", 1, 2, Currency.free, "id1");
    tableConfig.smallBlind = 1;
    tableConfig.bigBlind = 2;
    tableConfig.exchangeRate = 1;
    return tableConfig;
  }

  public static hasDuplicates(array:any[]) {
    return (new Set(array)).size !== array.length;
}

}