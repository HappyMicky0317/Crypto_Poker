import { IBlockCypherService } from "./IBlockCypherService";
import { AddressInfo } from "../model/AddressInfo";
import { DashCoreBlockService } from "./DashCoreBlockService";
import { EthBlockService } from "./EthBlockService";
import bjs = require("bitcoinjs-lib");
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();
var fs = require('fs');
import * as encryption from '../../../poker.engine/src/framework/encryption';
import { Currency } from "../../../poker.ui/src/shared/Currency";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { CurrencyConfig } from "../model/currency-config";
import { randomBytesHex, SharedHelpers } from "../../../poker.engine/src/shared-helpers";
import { ECPair, ECPairInterface } from "bitcoinjs-lib";
import { IBlockCypherApiProvider, BlockCypherApiProvider, IBlockCypherApi } from "./BlockCypherApiProvider";
import { BlockCypherTx } from "../../../poker.engine/src/model/blockcypher/blockcypher-tx";
import { Decimal } from "../../../poker.ui/src/shared/decimal";
import { EventHook } from "../model/EventHook";
const b58 = require('bs58check')
const bip32 = require('bip32')

export class BlockCypherService implements IBlockCypherService {

  logJson:boolean = true;
  currencyConfigs:CurrencyConfig[];
  hooks: EventHook[] = [];
  
  usesHooks(currency: string): boolean {
    return  currency == Currency.btc || currency == Currency.bcy || currency == Currency.beth;
  }

  constructor(dataRepository: ISecureDataRepository, public blockCypherApiProvider:IBlockCypherApiProvider) {
    this.dataRepository = dataRepository;   
    
    if(!blockCypherApiProvider){
      this.blockCypherApiProvider = new BlockCypherApiProvider();
    }
  }
  async init():Promise<void> {    
    this.hooks = await this.listHooks('btc');   
  }

  async loadCurrencyConfigs() : Promise<void>{
    this.currencyConfigs = await this.dataRepository.getCurrencyConfigs();      
}

  
  private dataRepository: ISecureDataRepository;
  private walletTokens: WalletToken[] = [];
  
 
  genAddressInternal(currency: string, bcapi: any): Promise<AddressKeychain> {
    return new Promise<AddressKeychain>((resolve, reject) => {
      this.generateAddress(currency, bcapi, (err: any, data: any) => {
        //this.printResponse(err, data);
        if (err !== null) {
          reject(err);
        } else {
          
          resolve(data);
        }
      });

    });
  }

  supportsWallet(currency: string) :boolean {
    return currency != Currency.eth && currency != Currency.beth;
  }

  getTx(hash:string, currency:string) : Promise<BlockCypherTx>{
    return new Promise((resolve, reject)=>{
      let bcapi = this.blockCypherApiProvider.getbcypher(currency);
      bcapi.getTX(hash, {}, (err:any, data:any)=>{
        if(err){
          return reject(err);
        }else{
          return resolve(data);
        }
      })
    })
    
  }


  addAddrToWallet(address:string, currency:string, bcapi:IBlockCypherApi): Promise<any> {
    if(this.supportsWallet(currency))  {
      return new Promise<void>((resolve, reject) => {        
        let walletName = this.getWalletName(currency);
        bcapi.addAddrWallet(walletName, [address], (err2: any, data2: any) => {
  
          if (err2 !== null || data2.error) {
            reject(err2);
          } else {
            resolve();
          }
        });
      });
    }
    return Promise.resolve(); 
  }

  generateAddress(currency: string, bcapi: IBlockCypherApi, callback: (err: any, data: any) => void) {
    bcapi.genAddr({}, callback);
  }

  async ensureMasterAddressInWallet(currency: string): Promise<void> {
    let bcapi = this.blockCypherApiProvider.getbcypher(currency);
    let currencyConfig = this.currencyConfigs.find(c=>c.name==currency);
    let walletName = this.getWalletName(currency);
    let addresses = await this.getWalletAddresses(bcapi, walletName);    
    for(let addr of addresses.filter(a=>a != currencyConfig.masterAccount.public)){
      await this.removeAddressFromWallet(bcapi, walletName, addr);
    }
    
    if(!addresses.filter(a=>a === currencyConfig.masterAccount.public)){
      logger.info(`master address for currency ${currency} not in wallet ${walletName}. Adding...`)
      await this.addAddrWallet(bcapi, walletName, [currencyConfig.masterAccount.public]);
    }        
    addresses = await this.getWalletAddresses(bcapi, walletName);
    if(addresses.length !== 1 || addresses[0] !== currencyConfig.masterAccount.public){
      throw new Error(`wallet ${walletName} has unexpected items. ${addresses.join()}`)
    }
  }

  addAddrWallet(bcapi: IBlockCypherApi, walletName:string, addresses:string[]) : Promise<void>{
    return new Promise((resolve, reject)=>{
      bcapi.addAddrWallet(walletName, addresses, (err, data)=>{
        if(err){
          reject(err)
        }else{
          resolve();
        }
      });
    });
  }

  removeAddressFromWallet(bcapi: IBlockCypherApi, walletName:string, address:string) : Promise<void>{
    return new Promise((resolve, reject)=>{
      bcapi.delAddrsWallet(walletName, [address], (err, data)=>{
        if(err){
          reject(err)
        }else{
          resolve();
        }
      });
    });
  }

  getWalletAddresses(bcapi: IBlockCypherApi, walletName:string) : Promise<string[]>{
    return new Promise((resolve, reject)=>{
      bcapi.getWallet(walletName, (err, data)=>{
        if(err){
          reject(err)
        }else{
          resolve(data.addresses);
        }
      });
    });
  }

  ensureWallet(currency: string, bcapi: IBlockCypherApi): Promise<WalletToken> {

    return new Promise((resolve, reject) => {
      let walletName = this.getWalletName(currency);
      let walletToken = this.walletTokens.find(wt => wt.walletName === walletName);
      if (!walletToken) {
        bcapi.getWallet(walletName, (err: any, data: any) => {
          if (err)
            reject(err);
          else if (data.error && data.error.toLowerCase().indexOf('not found') > -1) {
            bcapi.createWallet({ "name": walletName }, (err: any, data: any) => {
              if (err)
                reject(err);
              else {
                resolve(this.addWalletToken(data.token, walletName));
              }

            });
          }
          else if (data.token) {
            resolve(this.addWalletToken(data.token, walletName));
          } else {
            reject('unknown result');
          }
        });


      } else {
        resolve(walletToken);
      }
    });
  }

  addWalletToken(token: string, walletName: string): WalletToken {
    let walletToken = new WalletToken();
    walletToken.token = token;
    walletToken.walletName = walletName;
    this.walletTokens.push(walletToken);
    return walletToken;
  }

  getWalletName(currency: string): string {
    return 'th-' + currency.toLowerCase();
  }

  getAddrBal(address: string, currency: string): Promise<number> {

    return new Promise((resolve, reject) => {
      let bcapi = this.blockCypherApiProvider.getbcypher(currency);
      bcapi.getAddrBal(address, {}, (err: any, data: any) => {
        //this.printResponse(err, data);
        if (err !== null) {
          reject(err);
        } else {
          resolve(data.balance);
        }
      });
    });
  }





  
  
  async newTX(currency: string, receivingAddress:string, balance: number, newtx: any, bcapi?: IBlockCypherApi): Promise<TransactionResult> {
    let result = new TransactionResult();//includeToSignTx

    if(!bcapi)
      bcapi = this.blockCypherApiProvider.getbcypher(currency);
    let currencyConfig:CurrencyConfig = this.currencyConfigs.find(c=>c.name==currency);
    if(!currencyConfig.withdrawlFee){
      result.errorMessage = 'withdrawlFee not defined'; 
      return result;
    }
    balance = SharedHelpers.convertToNativeAmount(currency, balance);
    
    let withdrawlFeeDecimal = new Decimal(currencyConfig.withdrawlFee);
    let withdrawlFee = withdrawlFeeDecimal.toNumber();
    let value = new Decimal(balance).minus(withdrawlFeeDecimal).toNumber();
    newtx.outputs =  [{ "addresses": [receivingAddress], value: value }];
    newtx.fees = withdrawlFee;

    let promise = new Promise<TransactionResult>(async (resolve, reject) => {
            
      
      bcapi.newTX(newtx, (err: any, tmptx: any) => {

        if (err) {
          result.errorMessage = err;
          resolve(result);
        } else if (tmptx.errors && tmptx.errors.length) {
          result.errorMessage = tmptx.errors[0].error;
          resolve(result);
        }
        else {
          //console.log('tmptx:', tmptx);
          this.signTX(tmptx, currencyConfig)
            .then((data: any) => {
              tmptx.signatures = data;
              
              if(this.logJson){
                fs.writeFile(`tmptx_${receivingAddress}.json`, JSON.stringify(tmptx), (err: any) => {
                  if (err) { logger.error(err); };
                });
              }
              

              bcapi.sendTX(tmptx, (err: any, data: any) => {
                if (err || data.error || data.errors) {
                  result.errorMessage = err || data.error || JSON.stringify(data.errors);
                  resolve(result);
                }
                else {
                  result.txHash = data.tx.hash;
                  result.fees = SharedHelpers.convertToLocalAmount(currency, withdrawlFee)+'';
                  result.sentAmount = parseFloat(SharedHelpers.convertToLocalAmount(currency, value));          
                  result.success = true;
                  resolve(result);
                }
              });
            }).catch((err: any) => {
              logger.error('error on signTX', err);
              result.errorMessage = 'Internal Server Error';
              resolve(result);
            });

        }
      });


    });

    return promise;
  }
  



  async signTX(tmptx: any, currencyConfig:CurrencyConfig): Promise<string[]> {
    tmptx.pubkeys = [];  
    let signed:string[] = [];  
    for(let i=0;i<tmptx.tosign.length;i++){
      let result = await this.signAddress(tmptx.tosign[i], i, tmptx, currencyConfig)
      signed.push(result);
    }
    return signed;
  }

  async signAddress(tosign: string, n: number, tmptx: any, currencyConfig:CurrencyConfig): Promise<string> {
    var addr = tmptx.tx.inputs[n].addresses[0];
    if(addr != currencyConfig.masterAccount.public){
      throw new Error(`address mismatch. expecting ${currencyConfig.masterAccount.public} but got ${addr}`);
    }
    
    let keypair :ECPairInterface = null;
    if(currencyConfig.masterAccount.private){
      let pKey: string = encryption.decrypt(currencyConfig.masterAccount.private);
      keypair = ECPair.fromPrivateKey(Buffer.from(pKey, "hex"))    
    }else if(currencyConfig.masterAccount.wif){
      let pKey: string = encryption.decrypt(currencyConfig.masterAccount.wif);
      keypair = ECPair.fromWIF(pKey)    
    }
    
    tmptx.pubkeys.push(keypair.publicKey.toString("hex"));    
    
    let signature = keypair.sign(Buffer.from(tosign, "hex"));    
    let encodedSignature = bjs.script.signature.encode(signature,  bjs.Transaction.SIGHASH_NONE);    
    let hexStr = encodedSignature.toString("hex");
    hexStr = hexStr.substring(0, hexStr.length-2)
    return hexStr;
  }



  printResponse(err: any, data: any) {
    console.log('blockcypher result:');
    if (err !== null) {
      console.log(err);
    } else {
      console.log(data);
    }
  }

  createHook(currency: string, hook: any): any {
    return new Promise<void>((resolve, reject) => {
      let bcapi = this.blockCypherApiProvider.getbcypher(currency);
      bcapi.createHook(hook, (err: any, data: any) => {
        if (err !== null || data.error) {
          reject(err || data.error);
        } else {
          resolve(data);
        }
      });
    });
  }

  
  listHooks(currency: string): Promise<EventHook[]> {
    return new Promise<EventHook[]>((resolve, reject) => {
      let bcapi = this.blockCypherApiProvider.getbcypher(currency);
      bcapi.listHooks((err: any, data: any) => {
        if (err !== null || data.error) {
          reject(err || data.error);
        } else {
          resolve(data);
        }
      });
    });
  }

  delHook(currency: string, hookId: any): any {
    return new Promise<void>((resolve, reject) => {
      let bcapi = this.blockCypherApiProvider.getbcypher(currency);
      bcapi.delHook(hookId, (err2: any, data2: any) => {
        if (err2 !== null || data2.error) {
          reject(err2);
        } else {
          resolve();
        }
      });
    });
  }

}

interface AddressKeychain {
  address:string;
  public:string;
  private:string;
  wif:string;  
}

export class TransactionResult {
  success: boolean = false;
  errorMessage: string;  
  sentAmount: number;
  fees: string;
  txHash: string;  
}

export class WalletToken {
  walletName: string;
  token: string;
}


