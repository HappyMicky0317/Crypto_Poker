var crypto = require('crypto');
import { Currency } from "../../poker.ui/src/shared/Currency";
import { Decimal } from './../../poker.ui/src/shared/decimal';
import { CurrencyConfig } from '../../poker.payments/src/model/currency-config';
import fs = require('fs');
import os = require("os");

export class SharedHelpers {
    
    public static readonly Erc20RegExp = RegExp(/0x.*/)
    
    public static ensureDate(date:Date) : Date {
        if(typeof date === 'string'){
          return new Date(date)
        }
        return date;
      }



    public static getCurrency(currencyConfig: CurrencyConfig): string {
        if (SharedHelpers.Erc20RegExp.exec(currencyConfig.contractAddress)) {
            return Currency.eth;
        }
        return currencyConfig.name;
    }

    public static ensureGteLteDates(obj: any):any {

        if (obj.$gte) {
            obj.$gte = this.ensureDate(obj.$gte)
        } else if (obj.$lte) {
            obj.$lte = this.ensureDate(obj.$lte)
        }

        return obj;
    }

    public static getPaymentQueryArgs(args:{guid?:string, currency?:string, type?:string, screenName?:string, timestamp?:any, status?:string, updated?:any}): any {
        let mongoArgs: { $and: any[] } = {
            $and: []
        };

        if (args.guid) {
            mongoArgs.$and.push({ "guid": args.guid });
        }
        if (args.currency) {
            mongoArgs.$and.push({ "currency": args.currency });
        }
        if (args.type) {
            mongoArgs.$and.push({ "type": args.type });
        }
        if (args.status) {
            mongoArgs.$and.push({ "status": args.status });
        }

        if(args.timestamp){
            mongoArgs.$and.push({ "timestamp": SharedHelpers.ensureGteLteDates(args.timestamp) });
        }
        if(args.updated){
            mongoArgs.$and.push({ "updated": SharedHelpers.ensureGteLteDates(args.updated) });
        }


        if (args.screenName) {
            mongoArgs.$and.push(
                { 'screenName': { '$regex': args.screenName, '$options': 'i' }, }
            );
        }

        if(!mongoArgs.$and.length){
            return {};
        }
        return mongoArgs;
    }
    
    public static convertToLocalAmount(currency:string, amount: any): string {
        if(currency == Currency.eth || currency == Currency.beth){
            return SharedHelpers.convertToDeciGwei(amount);
        }
        return amount;
    }
    public static convertToDeciGwei(amount: any): string {
        let result = new Decimal(amount + '').dividedBy(this.ethDeciGweiDivisor);
        return result.toString();
    }

    static ethDeciGweiDivisor: Decimal = new Decimal('10000000000');
    static ethWeiEtherDivisor: Decimal = new Decimal('1000000000000000000');

    
    

    public static convertToNativeAmount(currency:string, amount: any): number {
        if(currency == Currency.eth || currency == Currency.beth){
            return SharedHelpers.convertToWei(amount);
        }
        return amount;
    }
    public static convertToWei(amount: number): number {
        let result = new Decimal(amount + '').mul(this.ethDeciGweiDivisor);
        return result.toNumber();
    }
    public static fromWei(amount: number|string): number {
        let result = new Decimal(amount + '').dividedBy(this.ethWeiEtherDivisor);
        return result.toNumber();
    }
}
export function to(promise:Promise<any>) {  
    return promise.then(data => {
       return [null, data];
    })
    .catch(err => [err]);
  }
  export function randomBytesHex() : Promise<string>{
    return new Promise<any>((resolve, reject) => {
        crypto.randomBytes(20, (err:any, buf:any)=> {
            if(err)
                reject(err);
            else
                resolve(buf.toString('hex'));
          });
    });
    
}

export function logToFile(logfile:string, text:string){
    let line = `${new Date().toLocaleString()} ${text}${os.EOL}`;
    fs.writeFile(logfile, line, {'flag':'a'}, (err: any) => {
        if (err) { console.error(err); };
      });
}

export function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  export function escapeHtml(html:string) {
    return html
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }