import { PaymentProcessorMessage } from './../processor/PaymentProcessorMessage';
import { Router, Request, Response } from 'express';
import { DashCoreBlockService } from "../services/DashCoreBlockService";
import { IAccountService } from "../services/AccountService";
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { Logger, getLogger } from "log4js";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { CurrencyConfig } from "../model/currency-config";
import { Currency,CurrencyUnit } from "../../../poker.ui/src/shared/Currency";
import { IncomingPaymentEvent } from "../model/incoming-payment-event";
import { to } from '../../../poker.engine/src/shared-helpers';
import { PaymentProcessor } from '../processor/PaymentProcessor';
const logger:Logger = getLogger();
 const fs = require('fs');


export class DashTxController{
    router: Router = Router();    
    logJson:boolean = true;

    constructor(private dataRepository:ISecureDataRepository, private paymentProcessor:PaymentProcessor, private dashCoreBlockService:DashCoreBlockService){
        this.setupRoutes();
    }
    index:number=0;

    setupRoutes(){
        this.router.get('/', async (req:any, res:any) => {

            let [err, data] = await to(this.run(req.query.txid));
            if(err){
                logger.error(err);
            }
            res.send({});
        });
       
    }

    async run(txid: string) :Promise<string[][]> {
      const warnings:string[] = [];  
      const infoLog:string[] = [];  
      /*
        Arguments:
        1. "txid"                  (string, required) The transaction id
        2. "include_watchonly"     (bool, optional, default=false) Whether to include watch-only addresses in balance calculation and details[]
        */
       txid = txid.substring(0, 64);
        
        let [err,data] = await to(this.dashCoreBlockService.getTransaction(txid));
        
        if(err){
          if(err.message){
            logger.error(err.message) 
          }else{
            logger.error(err) 
          }
          
          return;
        }
        if(this.logJson){
          this.index++;
          fs.writeFile(`dash_gettransaction_${txid}_${this.index}.json`, JSON.stringify(data), (err: any) => {
            if (err) { logger.error(err); };
          });
        }
        
        if (data.result) {
          let tx:DashTx = <DashTx>data.result;
          let currencyConfig:CurrencyConfig = await this.dataRepository.getCurrencyConfig(Currency.dash);
          let masterAccountPublic:string = currencyConfig.masterAccount != null ? currencyConfig.masterAccount.public : '';
          
          let detail = tx.details.find(d=>d.category=='receive' && d.address==masterAccountPublic);
          if(detail){
            infoLog.push(`received credit to master account ${currencyConfig.masterAccount.public} of ${detail.amount} confirmations:${tx.confirmations} txid:${tx.txid}`);
          }else{
            await this.process(tx, currencyConfig, warnings, infoLog)
          }
          

        } else {
          warnings.push('data.result not defined', data);
        }

        if(warnings.length){
          logger.warn(warnings.join())
        }
        if(infoLog.length){
          logger.info(infoLog.join())
        }

        return [warnings, infoLog];
      }

      async process(tx:DashTx, currencyConfig:CurrencyConfig, warnings:string[], infoLog:string[]){
        for (let detail of tx.details) {
          let address = detail.address;
          if (detail.category === "receive") {
            let info = await this.dataRepository.getAddressInfoByAddress(address);
            if (info) {
              let amount = new Decimal(tx.amount).mul(CurrencyUnit.getCurrencyUnit(Currency.dash)).toString();
              let event: IncomingPaymentEvent = new IncomingPaymentEvent(info.address, amount, tx.confirmations, tx.txid);
              event.instantlock = tx.instantlock;
              if (event.instantlock) {
                //for instantsend set confirmations to the required number so creditAccount proceeds              
                event.confirmations = currencyConfig.requiredNumberOfConfirmations;
              }

              let ppMessage = new PaymentProcessorMessage();
              ppMessage.incomingPaymentEvent = event;
              this.paymentProcessor.sendMessage(ppMessage)                
            }
            else {
              warnings.push(`TxCallback cannot handle txid: ${tx.txid} for ${address}. This address is unknown`);
            }
          }
          else if (detail.category === "send") {
            
            if(tx.confirmations == 0){
              //may have been outgoing payment that was just pushed
              setTimeout(async ()=>{
                await this.checkSend(tx, address);
              }, 2000)
            }else{
              await this.checkSend(tx, address);
            }
            
          }
  
        }
      }

      async checkSend(tx:DashTx, address:string) : Promise<void>{
        const payment = await this.dataRepository.getPaymentByTxId(Currency.dash, tx.txid);
        if (payment) {
          logger.info(`DashTxController category send txid: ${tx.txid} for ${address}. payment: ${payment._id.toString()}`);
        } else {
          logger.warn(`DashTxController cannot handle txid: ${tx.txid} for ${address}. There is no outgoing payment with this address`);                
        }
      }

      // mock() : any {
      //   let data = JSON.parse(`{"result":{"amount":0.123456,"confirmations":${DashTxController.count%2},"instantlock":false,"trusted":false,"txid":"${String.fromCharCode('a'.charCodeAt(0) + DashTxController.count/2)}cc30ae25d7814f9ee88588b1bc4e5975f27f03a3a07f2642372a0c4128b2412","walletconflicts":[],"time":1537706081,"timereceived":1537706081,"bip125-replaceable":"no","details":[{"account":"","address":"XmnBzFgz5zZetzRLAPDaZaqiofJ5jPhr71","category":"receive","amount":0.01,"label":"","vout":0}],"hex":"01000000022a330d13cffae29068fe187d69b35a4b2c7df1fa44c3ee5a0fb910df7096585b010000006b483045022100eb1d47a4d90a30d0d84be8d928b28c4986e8204bffcbbab0caca4a99204b167d0220747899248f19adf86ebd9882bdeceb7b0d9a41752bfeb5bcf0f968ba0cd7ccb201210339f125d9de770003073ad2913265c78c6bfd5174f42cd7d430bfd42c9f196365ffffffff34bdbfae1937b42c9493c14d810654af39d68ee0606e9c84ac8d51bd7a14b52a010000006a4730440220397de34651e0d895d0a0179265d8151026c39f27886c111e682994ae8e289cc302203d87ab1fe8932ae9e69f576cc68ca2dbdd46bb0def6e1b08836d542c50b0158a012103cc80c2746fb95f7f8dbeb0223892b1f771ad4a202b550e25959f7134dbbed8c5ffffffff0240420f00000000001976a9140124f0313500c281ea9772b0e8597d9d7b2e40df88acba790000000000001976a9140daa7734f37be24cd916f09a53a510cf26f3b03688ac00000000"},"error":null,"id":null}`);        
      //   DashTxController.count++
      //   console.log(`${data.result.confirmations} ${data.result.txid}`)
      //   return data;
      // }

      // static count:number = 0;  
}
interface DashTx{
    amount:number;
    confirmations:number;
    txid:string;
    instantlock:boolean;
    details:{address:string, category:string, amount: number}[];
}

