import environment from "../environment";
import { to, randomBytesHex } from "../../../poker.engine/src/shared-helpers";
import { EventHook } from "../model/EventHook";
import { AddressInfo } from "../model/AddressInfo";
import { Logger, getLogger } from "log4js";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { Currency } from "../../../poker.ui/src/shared/Currency";
import { IBlockCypherService } from "./IBlockCypherService";
import { IBlockChainService } from "./IBlockChainService";
import { TransactionResult } from "./BlockCypherService";
import * as BtcDepositAddressService from "../../../poker.engine/src/services/BtcDepositAddressService";
const logger:Logger = getLogger();

export class BtcBlockService implements IBlockChainService {
  

    
  currency: string = Currency.btc;
    
    

    constructor(private dataRepository:ISecureDataRepository, private blockCypherService:IBlockCypherService){

    }

    getAddress(currency: string, xpub: string, index: number): Promise<string> {
      return Promise.resolve(BtcDepositAddressService.genAddr(xpub, index));      
    }



    async newTransaction(currency: string, receivingAddress: string, balance: number, userGuid: string): Promise<TransactionResult> {
      let bcapi = this.blockCypherService.blockCypherApiProvider.getbcypher(currency);
      let walletToken = await this.blockCypherService.ensureWallet(currency, bcapi);      
      let newtx: any = {
        inputs: [{ "wallet_name": walletToken.walletName, "wallet_token": walletToken.token }],                
      };        
  
     
      return await this.blockCypherService.newTX(currency, receivingAddress, balance, newtx, bcapi);
    }

    isWaitingOnPriorTransaction(): Promise<string> {
      return Promise.resolve(null)
    }

    async init() : Promise<void> {
      let addresses = await this.dataRepository.getUnprocessedAddresses(Currency.btc);        
      for(let address of addresses){
        this.monitorAddress(address);
      }
    }

    async monitorAddress(info: AddressInfo): Promise<void> {
        
      if(!info.guid){
        info.guid = await randomBytesHex();
        await this.dataRepository.saveAddress(info);
      }
      
        let existingHook = this.blockCypherService.hooks.find(h => h.address === info.address);
        if (!existingHook) {
          let currencyConfig = await this.dataRepository.getCurrencyConfig(Currency.btc);
          await this.addHookInternal(info, currencyConfig.requiredNumberOfConfirmations);
        }
    
      }
    async addHookInternal(info: AddressInfo, requiredNumberOfConfirmations: number): Promise<any> {
        let baseAddress = process.env.POKER_BASE_ADDRESS;      
    
        let callbackUrl = `${baseAddress}/api/payment-callback?guid=${info.guid}`;
        let hook = { "event": "tx-confirmation", "address": info.address, confirmations: requiredNumberOfConfirmations, url: callbackUrl }
        //let hookEvent: any = await this.blockCypherService.createHook(info.currency, hook);
        let [err,hookEvent] = await to(this.blockCypherService.createHook(info.currency, hook));
        if(!err){
          logger.info('created hook for address: ' + info.address);
          info.hookId = hookEvent.id;
          this.addHook(hookEvent);
          return this.dataRepository.saveAddress(info);
        }else{
          logger.error('unable to create hook: ' + err);
          
        }    
      }
    
      addHook(hookEvent: EventHook) {
        this.blockCypherService.hooks.push(hookEvent);
      }
}