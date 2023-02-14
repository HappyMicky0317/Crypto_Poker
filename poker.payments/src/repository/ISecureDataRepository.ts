import { AddressInfo } from "../model/AddressInfo";
import { SweepEvent } from "../model/sweep-event";
import { CurrencyConfig } from "../model/currency-config";
import { Payment } from "../../../poker.engine/src/model/Payment";
import { TxLog } from "../model/tx-log";
import { PaymentProcessorSettings } from "../model/PaymentProcessorSettings";

export class ISecureDataRepository{
  getAddressesByCurrency(currency: string): Promise<any[]> { throw new Error('not implemented');}
  getAddressCount(currency: string): Promise<number> { throw new Error('not implemented');}
  saveAddress(info: AddressInfo): any { throw new Error("Not implemented"); };
  getUnprocessedAddresses(currency?:string): Promise<AddressInfo[]> { throw new Error("Not implemented"); };
  getAddressInfoByAddress(address: string): Promise<AddressInfo|null> { throw new Error("Not implemented"); };
  getAddressInfo(guid: string, currency: string, processed: boolean): Promise<AddressInfo[]> { throw new Error("Not implemented"); };
  getAddressInfoByGuid(guid: string): Promise<AddressInfo|null> { throw new Error("Not implemented"); };
  getAddressesForSweeping(currency:string): Promise<AddressInfo[]> { throw new Error("Not implemented"); };
  saveSweepEvent(event:SweepEvent): Promise<any> { throw new Error("Not implemented"); };
  getSweepEvents(args:any, limit?:number): Promise<SweepEvent[]> { throw new Error("Not implemented"); };  
  updateSweepEvent(incomingPaymentHash:string, setObj:any): Promise<any> { throw new Error("Not implemented"); };  
  getSweepEventById(id:string): Promise<SweepEvent|null> { throw new Error("Not implemented"); };  
  getCurrencyConfig(currency:string): Promise<CurrencyConfig> { throw new Error("Not implemented"); }; 
  getCurrencyConfigs(options?:any): Promise<CurrencyConfig[]> { throw new Error("Not implemented"); };  
  getErc20Tokens(): Promise<CurrencyConfig[]> { throw new Error("Not implemented"); };
  saveCurrencyConfig(token:CurrencyConfig): Promise<any> { throw new Error("Not implemented"); };
  savePayment(payment: Payment): any { throw new Error("Not implemented"); };
  getLastProcessedBlock(currency:string): Promise<number> { throw new Error("Not implemented"); };
  saveLastProcessedBlock(currency: string, blockNumber: number): Promise<any> { throw new Error("Not implemented"); };  
  addTxLog(txLog:TxLog): Promise<any> { throw new Error("Not implemented"); };
  getTxLog(txHash:string): Promise<TxLog|null> { throw new Error("Not implemented"); };  
  getTxLogs(options:any): Promise<TxLog[]> { throw new Error("Not implemented"); };  
  getTxLogByRelatedHash(txHash:string, type:string): Promise<TxLog|null> { throw new Error("Not implemented"); };    
  getPaymentsWithoutFees(): Promise<Payment[]> { throw new Error("Not implemented"); };
  getPaymentByTxId(currency:string, txId: string): Promise<Payment|null> { throw new Error("Not implemented"); };
  getLastOutgoingPayment(): Promise<Payment|null> { throw new Error("Not implemented"); };
  getPaymentById(id: string): Promise<Payment> { throw new Error("Not implemented"); }
  getPayments(args:{guid?:string, currency?:string, type?:string, screenName?:string, timestamp?:any, status?:string, updated?:any}): Promise<Payment[]> { throw new Error("Not implemented"); }
  getPaymentProcessorSettings(): Promise<PaymentProcessorSettings> { throw new Error("Not implemented"); }
  getLastAddressInfo(): Promise<AddressInfo|null> { throw new Error("Not implemented"); }
  getAddressInfoById(id: string): Promise<AddressInfo> { throw new Error("Not implemented"); }
  // saveUserReconcilliationResult(result: UserReconcilliationResult): Promise<any> { throw new Error("Not implemented"); }
  // getUserReconcilliationResult(): Promise<UserReconcilliationResult[]> { throw new Error("Not implemented");}
}