import {TransactionResult, WalletToken} from "./BlockCypherService";
import { AddressInfo } from "../model/AddressInfo";
import { CurrencyConfig } from "../model/currency-config";
import { BlockCypherTx } from "../../../poker.engine/src/model/blockcypher/blockcypher-tx";
import { EventHook } from "../model/EventHook";
import { IBlockCypherApiProvider, IBlockCypherApi } from "./BlockCypherApiProvider";

export class IBlockCypherService {
  
  hooks: EventHook[];
  blockCypherApiProvider:IBlockCypherApiProvider;
  currencyConfigs:CurrencyConfig[];
  
  createHook(currency: string, hook: any): any { throw new Error("Not implemented");}
  delHook(currency: string, hookId: any): any { throw new Error("Not implemented");}

  usesHooks(currency: string): boolean { throw new Error("Not implemented"); }  
  getAddrBal(address: string, currency: string): Promise<number> { throw new Error("Not implemented"); }
  supportsWallet(currency: string) :boolean { throw new Error("Not implemented"); }  
  
  getTx(hash:string, currency:string) : Promise<BlockCypherTx> { throw new Error("Not implemented"); }
  
  loadCurrencyConfigs() : Promise<void> { throw new Error("Not implemented"); }    
  init() {    throw new Error("Method not implemented.");  }
  ensureWallet(currency: string, bcapi: IBlockCypherApi): Promise<WalletToken> {    throw new Error("Method not implemented.");  }
  newTX(currency: string, receivingAddress:string, balance: number, newtx: any, bcapi?: IBlockCypherApi): Promise<TransactionResult> {    throw new Error("Method not implemented.");  }

}