import { Server, Db } from 'mongodb';
import { ISecureDataRepository } from './ISecureDataRepository';
import { AddressInfo } from '../model/AddressInfo';
import { SweepEvent } from '../model/sweep-event';
import { CurrencyConfig } from '../model/currency-config';
import { Payment } from '../../../poker.engine/src/model/Payment';
import { TxLog } from '../model/tx-log';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { PaymentProcessorSettings } from '../model/PaymentProcessorSettings';
import { SharedHelpers } from '../../../poker.engine/src/shared-helpers';
const ObjectID = require('mongodb').ObjectID;
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();

export class SecureDataRepository implements ISecureDataRepository {
    
    server!: Server;
    db!: Db;
    dbName:string;

    constructor(dbName:string) {
        this.dbName = dbName;
    }

    init() {
      const host = process.env.POKER_MONGODB || 'localhost';
      logger.info(`mongodb host:${host}`);   
        this.server = new Server(host, 27017);
        this.db = new Db(this.dbName, this.server);
        return this.db.open(); 
    } 

    getAddressesByCurrency(currency: string): Promise<any[]> {
        var collection = this.db.collection('addressInfo');
        return collection.find({ currency: currency }).toArray();
    }
    getAddressCount(currency: string): Promise<number> {
      return this.db.collection('addressInfo').count({ currency: currency });      
  }
    getAddressInfo(guid: string, currency: string, processed: boolean): Promise<AddressInfo[]> {        
        return this.db.collection('addressInfo').find({ userGuid: guid, currency: currency, processed: processed }).toArray();
    }

    saveAddress(info: AddressInfo): any {        
      if (info._id && typeof info._id === 'string') {
        info._id = ObjectID.createFromHexString(info._id);
      }  
      return this.db.collection('addressInfo').save(info);
    }

    getAddressInfoByAddress(address: string): Promise<AddressInfo|null> {
        var collection = this.db.collection('addressInfo');
        return collection.findOne({ address: address });
      }
      getAddressInfoByGuid(guid: string): Promise<AddressInfo|null> {
        var collection = this.db.collection('addressInfo');
        return collection.findOne({ guid: guid });
      }
      getUnprocessedAddresses(currency?:string): Promise<AddressInfo[]> {
        var collection = this.db.collection('addressInfo');
        let args:any = { processed: false, master: {$in: [null, false]} };
        if(currency){
          args.currency = currency;
        }
        return collection.find(args).toArray();
      }

      getAddressesForSweeping(currency:string): Promise<AddressInfo[]> {     
        return this.db.collection('addressInfo').find({ currency: currency, checkSweep: true }).toArray();
     };
  
     updateAddressInfo(address:string, setObj:any): Promise<any> {
      return this.db.collection('addressInfo').update({ address: address }, { $set: setObj });
    }
    saveSweepEvent(event:SweepEvent): Promise<any> { 
        return this.db.collection('sweepEvents').save(event);;    
        };
      getSweepEvents(args:any, limit?:number): Promise<SweepEvent[]> { 
        let query = this.db.collection('sweepEvents').find(args).sort({ _id: -1 });
        if(limit)
          query = query.limit(limit)
        
          return query.toArray();
      };  
      getSweepEventById(id:string): Promise<SweepEvent|null> { 
        return this.db.collection('sweepEvents').findOne({ '_id': ObjectID(id)});
      };  
      updateSweepEvent(incomingPaymentHash:string, setObj:any): Promise<any> {
        return this.db.collection('sweepEvents').update({ incomingPaymentHash: incomingPaymentHash }, { $set: setObj });
      }

      async getCurrencyConfig(currency:string): Promise<CurrencyConfig> { 
        var collection = this.db.collection('currencyConfig');
        let config = await collection.findOne({ 'name': currency });    
        return config;
      };
    
      async getCurrencyConfigs(options?:any): Promise<CurrencyConfig[]> { 
        return this.db.collection('currencyConfig').find(options).toArray();    
      };
    
      async getErc20Tokens(): Promise<CurrencyConfig[]> {
        let tokens = await this.getCurrencyConfigs({contractAddress: /0x.*/})
       
          return tokens;
      };
      saveCurrencyConfig(config:CurrencyConfig): Promise<any> {
        let collection = this.db.collection('currencyConfig');
          if (config._id) {
            config._id = ObjectID.createFromHexString(config._id);
          }
          return collection.replaceOne(
            { '_id': ObjectID(config._id) },
            config,
            { upsert: true });
      };

      savePayment(payment: Payment): any {    
        if (payment._id && typeof payment._id === 'string') {
          payment._id = ObjectID.createFromHexString(payment._id);
        }
        payment.timestamp = SharedHelpers.ensureDate(payment.timestamp)
        return this.db.collection('payments').save(payment);
      }



      async getLastProcessedBlock(currency: string): Promise<number> {
        var collection = this.db.collection('lastProcessedBlock');
        let result = await collection.findOne({ 'currency': currency });
        if (result)
          return Promise.resolve(result.blockNumber);
        return Promise.resolve(0);
      };

      saveLastProcessedBlock(currency: string, blockNumber: number): Promise<any> {
        let collection = this.db.collection('lastProcessedBlock');
    
        return collection.replaceOne(
          { 'currency': currency },
          { currency: currency, blockNumber: blockNumber },
          { upsert: true });
      };
    
      
      
    
      
    
      addTxLog(txLog:TxLog): Promise<any> { 
        return this.db.collection('txLog').save(txLog);;    
       };
       getTxLog(hash:string): Promise<TxLog|null> { 
        return this.db.collection('txLog').findOne({ hash: hash });    
       }  
       getTxLogByRelatedHash(hash:string, type:string): Promise<TxLog|null> { 
        return this.db.collection('txLog').findOne({ relatedTxHash: hash, type:type });    
       }  
       getTxLogs(options:any): Promise<TxLog[]> { 
        return this.db.collection('txLog').find(options).sort({ _id: -1 }).limit(50).toArray();
        };  
       
        getPaymentsWithoutFees(): Promise<Payment[]> {
          var collection = this.db.collection('payments');    
          return collection.find({ fees: {$in: [null, 0, '0']}}).sort({ _id: -1 }).toArray();
        }
        getPaymentByTxId(currency:string, txId: string): Promise<Payment|null> {    
          return this.db.collection('payments').findOne({ currency:currency, txId: txId });
        }
        getPaymentById(id: string): Promise<Payment> {        
          return this.db.collection('payments').findOne({ '_id': ObjectID(id)});
        }
        getPayments(args:{guid?:string, currency?:string, type?:string, screenName?:string, timestamp?:any, status?:string, updated?:any, showOption?:string}): Promise<Payment[]> {            
    
          let mongoArgs = SharedHelpers.getPaymentQueryArgs(args);
          let query = this.db.collection('payments').find(mongoArgs).sort({ _id: -1 });

          let limit = parseInt(args.showOption);
          if(!isNaN(limit))
            query = query.limit(limit)

          return query.toArray();
        }
        async getLastOutgoingPayment(): Promise<Payment|null> {           
          let arr = await this.db.collection('payments').find( { type: PaymentType.outgoing }).sort({ _id: -1 }).limit(1).toArray();
          if(arr.length)
            return arr[0];
          return null;
        };

        async getLastAddressInfo(): Promise<AddressInfo|null> {           
          let arr = await this.db.collection('addressInfo').find( { }).sort({ _id: -1 }).limit(1).toArray();
          if(arr.length)
            return arr[0];
          return null;
        };

        getAddressInfoById(id: string): Promise<AddressInfo> {        
          return this.db.collection('addressInfo').findOne({ '_id': ObjectID(id)});
        }

  getPaymentProcessorSettings(): Promise<PaymentProcessorSettings> {
    return this.db.collection('paymentProcessorSettings').findOne({});
  }
    

      // saveUserReconcilliationResult(result: UserReconcilliationResult): Promise<any> {
      //   return this.db.collection('userReconcilliationResults').replaceOne({ 'userGuid': result.userGuid, 'currency': result.currency }, result, { upsert: true });
      // }
      // getUserReconcilliationResult(): Promise<UserReconcilliationResult[]> {
      //   return this.db.collection('userReconcilliationResults').find({}).sort({ profitLossTotal: -1 }).toArray();
      // }
    
}

