import { Subject, Observable } from "rxjs";
import { Injectable } from "@angular/core";

import 'rxjs-compat'
import { HttpClient, HttpParams } from "@angular/common/http";
import { Response } from "@angular/http";
import { PaymentServerUrlService } from "./payment-server-url.service";


@Injectable()
export class PaymentServerApiService {
    localUrl:string;

    constructor(private http:HttpClient, private urlService:PaymentServerUrlService){
        this.localUrl = urlService.localUrl;
    }
    

    getCurrencyConfigs() : Observable<any[]>{
        let url = `${this.localUrl}currency-config`;
        let observable = this.http.get(url)
        .map((currencyConfig:any[])=>{            
            return currencyConfig;            
        });
        
        return this.chainCatch(observable, url);         
    }

    
    saveCurrencyConfigs(configs:any[]) : Observable<Object>{
        let url = `${this.localUrl}currency-config`;
        return this.http.post(url, configs)
    }        

    
    chainCatch<T>(ob:Observable<T>, url:string) : Observable<T>{
        return ob.catch(x=>{
            console.error('error', x)
            return Observable.throw(`error fetching ${url} the request!: ${x.message}`)
          })       
    }

    getDepositAddresses(currency:string){
        let url = `${this.localUrl}deposit-addresses?currency=${currency}`;
        let observable = this.http.get(url)
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }





    
}