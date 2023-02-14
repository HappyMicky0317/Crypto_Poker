import {TransactionResult} from "./BlockCypherService";
import { Currency, CurrencyUnit } from "../../../poker.ui/src/shared/Currency";
import { to } from "../../../poker.engine/src/shared-helpers";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { AddressInfo } from "../model/AddressInfo";
import * as DashDepositAddressService from "../../../poker.engine/src/services/DashDepositAddressService";
import { IBlockChainService } from "./IBlockChainService";
import { Http } from "../../../poker.engine/src/services/Http";
import { IHttpOptions } from "../../../poker.engine/src/services/IHttp";
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();

const { HDPublicKey, Address } = require('@dashevo/dashcore-lib');
var fs = require('fs');

export class DashCoreBlockService implements IBlockChainService {
  
  currency: string = Currency.dash;
    
  constructor(private dataRepository:ISecureDataRepository){

  }
  
  getAddress(currency: string, xpub: string, index: number): Promise<string> {
    return Promise.resolve(DashDepositAddressService.genAddr(xpub, index));
  }

  async init() : Promise<void> {
    await this.checkMissingAddresses();
  }

  async checkMissingAddresses()  : Promise<void> {
    const walletCount = await this.getColdAddressCount();    
    const dbCount = await this.dataRepository.getAddressCount(Currency.dash);
    if(dbCount !== walletCount){
      const dbAddresses:AddressInfo[] = await this.dataRepository.getAddressesByCurrency(Currency.dash);
      let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency.dash);
      
      for(let info of dbAddresses){
        let addr = DashDepositAddressService.getAddress(currencyConfig.xpub, info.index);
        await this.importpubkey(addr.publicKey, info.index);
      }      
    }
  }

  async getColdAddressCount() : Promise<number> {
    
    // const data = await this.listreceivedbyaddress();
    let count = 1;
    // let count = 0;
    // for(let addr of data.result){
    //   if(addr.label.includes('cold')){
    //     const tokens = addr.label.split('/');
    //     const index = +tokens[tokens.length-1];
    //     if(!isNaN(index)){
    //       count++;
    //     }
        
    //   }
    // }

    return count;
  }

  async listreceivedbyaddress(): Promise<any> {
    //  List incoming payments grouped by receiving address.
    //Arguments:
    //1. minconf           (numeric, optional, default=1) The minimum number of confirmations before payments are included.
    //2. addlocked         (bool, optional, default=false) Whether to include transactions locked via InstantSend.
    //3. include_empty     (bool, optional, default=false) Whether to include addresses that haven't received any payments.
    //4. include_watchonly (bool, optional, default=false) Whether to include watch-only addresses (see 'importaddress').
    let post_data = { "method": "listreceivedbyaddress", "params": [0, false, true, true] };
    let data = await this.post(post_data)
    return data;
  }
      

  async monitorAddress(info: AddressInfo): Promise<void> {
    let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency.dash);
    let addr = DashDepositAddressService.getAddress(currencyConfig.xpub, info.index);
    await this.importpubkey(addr.publicKey, info.index);
  }


  async newTransaction(currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> {
    let amount= balance / CurrencyUnit.getCurrencyUnit(Currency.dash);
    let post_data = { "method": "sendtoaddress", "params": [receivingAddress, amount, userGuid, "", false] };
    let result = new TransactionResult();
    let [err,data] = await to(this.unlockWallet())
    if(!err){
      [err,data] = await to(this.post(post_data))
      if(!err && data){
        this.writeResult(receivingAddress, data);        
        result.txHash = data.result;        
        result.fees = '0';
        result.sentAmount = balance;        
        result.success = true;
      }                  
    }
    await to(this.lockWallet())
    if(!result.success){
      if (err.error && err.error.error && err.error.error.message)
      result.errorMessage = err.error.error.message;
    else if(err.message)
      result.errorMessage = err.message;
    else
      result.errorMessage = err;
    }
    
    return result;
 
  }

  isWaitingOnPriorTransaction(): Promise<string> {
    return Promise.resolve(null)
  }

  unlockWallet() : Promise<string|null>{
    return new Promise((resolve, reject) => {
      let post_data = {"method": "walletpassphrase","params": [ process.env.POKER_UNLOCK_WALLET, 10] }
      this.post(post_data)
      .then((data=>{
        if(!data.error){
          resolve(null)
        }else{          
          reject(`unexpecting result unlocking wallet ${JSON.stringify(data)}`)
        }
        
      })).catch((err:any) =>{        
        reject(`unexpecting result unlocking wallet ${JSON.stringify(err)}`);
      })
    });
  }

  lockWallet() : Promise<string|null>{
    return new Promise((resolve, reject) => {
      let post_data = {"method": "walletlock" }
      this.post(post_data)
      .then((data=>{
        if(!data.error){
          resolve(null)
        }else{          
          reject(`lockWallet ${JSON.stringify(data)}`)
        }
        
      })).catch((err:any) =>{        
        reject(`lockWallet ${JSON.stringify(err)}`);
      })
    });
  }

  writeResult(receivingAddress: string, data:any) {
    fs.writeFile(`sendtoaddress_result_${receivingAddress}.json`, JSON.stringify(data), (err: any) => {
      if (err) { console.log('error writing to file: ' + err); };
    });
  }

  async importpubkey(pubKeyHex: string, index:number): Promise<any> {
    //view imported addresses using



     let post_data = { "method": "importpubkey", "params": [`${pubKeyHex}`, `cold m/0/${index}`, false] };    
     return this.post(post_data)
 }

 async deriveAddress(index:number) : Promise<any> {
  // let pubKey = new HDPublicKey('xpub661MyMwAqRbcF8dQCNnr92GPFUCsjQs5EwKjh8rzkuDGNarXvSNHKSL3iv94kwqVfhmRNMnFXQpEeZK7crNuotMe46vfX2PXV7iVAWdwTcX');  
  let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency.dash);
  let pubKey = new HDPublicKey(currencyConfig.xpub);
  let account1 = pubKey.derive(0);
  let addr = account1.derive(index);    
  return addr;
 }

 async getTransaction(txid:string)  : Promise<any> {
  let post_data = { "method": "gettransaction", "params": [txid, true] };
  return this.post(post_data);
 }

  private post(post_data:{}) : Promise<any> {
    const options:IHttpOptions = {      
      body: post_data,
      headers: {
        "Authorization": "Basic dHJveTpmMDBiYXIx"
      },
      //json: true // Automatically stringifies the body to JSON
    };
    const http = new Http();
    return http.post(`http://${process.env.DASH_RPC_HOST}:9998`, options);
  }
  
}