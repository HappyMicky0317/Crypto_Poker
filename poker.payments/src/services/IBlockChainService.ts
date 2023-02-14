import { AddressInfo } from "../model/AddressInfo";
import { TransactionResult } from "./BlockCypherService";

export class IBlockChainService {
    
    currency: string;
    init() {     throw new Error("Method not implemented.");  }  
    monitorAddress(info: AddressInfo): Promise<void> { throw new Error("Not implemented"); }
    newTransaction(currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> { throw new Error("Not implemented");}  
    isWaitingOnPriorTransaction(): Promise<string> {
        throw new Error("Method not implemented.");
      }
      getAddress(currency:string, xpub:string, index:number) : Promise<string> {
        throw new Error("Not implemented");
    }
}