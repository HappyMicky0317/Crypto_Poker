import { Subject, Observable } from "rxjs";
import { Injectable } from "@angular/core";

import 'rxjs-compat'
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { isPaymentServer } from "../../app-configuration";
import { PaymentServerUrlService } from "../pages/payment-server/payment-server-url.service";

@Injectable()
export class AdminApiService {
    private loggedInStatus = JSON.parse(localStorage.getItem('loggedIn') || 'false');
    // private loggedInStatus = false;
    private User = JSON.parse(localStorage.getItem('user'));
    remoteUrl:string = environment.production ? '/' : 'localhost:8112';

    constructor(private http:HttpClient, private urlService:PaymentServerUrlService){
    }

    get isLoggedIn(){
        // return this.loggedInStatus;
        return JSON.parse(localStorage.getItem('loggedIn') || this.loggedInStatus.toString());
    }

    get user(){
        // return this.User;
        return JSON.parse(localStorage.getItem('user'));
    }
    setLoggedIn(value : boolean){
        // this.loggedInStatus = value;
        localStorage.setItem('loggedIn', 'true');
    }

    setUser(user : any){
        localStorage.setItem('user', JSON.stringify(user));
        // this.User = user;
    }

    getRemoteAuth(): Observable<Object>{
        
        let url = `${this.urlService.localUrl}remoteAuth`;
        let observable = this.http.get(url)
        .map((data:any)=>{                        
            this.remoteUrl = data.url + '/';
            this.urlService.base64Pass = data.base64Pass;
            return data;
        });
        
        return observable;
    }
    
    
    getAdmin(): Observable<any[]>{
        let url = `${this.remoteUrl}api/admin`;
        let observable = this.http.get(url)
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    saveAdmin(user:any) : Observable<Object>{
        let url = `${this.remoteUrl}api/admin`;
        return this.http.post(url, user)
    } 


    getCurrencies(): Observable<any[]>{
        
        let url = `${this.remoteUrl}api/currencies`;
        let observable = this.http.get(url)
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    
    chainCatch<T>(ob:Observable<T>, url:string) : Observable<T>{
        return ob.catch(x=>{
            console.error('error', x)
            return Observable.throw(`error fetching ${url} the request!: ${x.message}`)
          })       
    }

    

    getPayments(currency?:string, type?:string, screenName?:string, showOption?:string){
        let url = this.getPaymentUrl();
        let params = new HttpParams()
        if(currency)
            params = params.append('currency', currency);
        if(type)
            params = params.append('type', type);     
        if(screenName)
            params = params.append('screenName', screenName);    
        if(showOption)
            params = params.append('showOption', showOption);  
                      
        let observable = this.http.get(url, { params: params })
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    approvePayment(id:string) : Observable<Object>{
        let url = `${this.getPaymentUrl()}/approve?id=${id}`;
        return this.http.post(url, {})
    }

    cancelPayment(id:string) : Observable<Object>{
        let url = `${this.getPaymentUrl()}/cancel?id=${id}`;
        return this.http.post(url, {})
    }

    getPaymentUrl() : string{
        let url =  isPaymentServer ? `${this.urlService.localUrl}payments` : `${this.remoteUrl}api/payments`;
        return url;
    }

    
    getTournaments(id:string){
        let params = new HttpParams()
        if(id)
            params = params.append('id', id);       

        let url = `${this.remoteUrl}api/tournaments`;
        let observable = this.http.get(url, { params: params })
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    

    getUsers(searchTerm:string, count:number, includeAnon:boolean){
        let params = new HttpParams()
        params = params.append('count', ''+count);              
        if(searchTerm)
            params = params.append('searchTerm', searchTerm);
        if(includeAnon)
            params = params.append('includeAnon', "1");         
            

        let url = `${this.remoteUrl}api/users`;
        let observable = this.http.get(url, { params: params })
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    getUser(guid?:string){
        const params = new HttpParams()
        .set('guid', guid)

        let url = `${this.remoteUrl}api/user`;
        let observable = this.http.get(url, { params: params })
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    saveUser(user:any) : Observable<Object>{
        let url = `${this.remoteUrl}api/user`;
        return this.http.post(url, user)
    } 

   
    saveTournament(tournament:any) : Observable<Object>{
        let url = `${this.remoteUrl}api/tournaments`;
        return this.http.post(url, tournament)
    } 

    getTables(tournamentId:string){
        let params = new HttpParams()          
        if(tournamentId)
            params = params.append('tournamentId', tournamentId);        
        
            let url = `${this.remoteUrl}api/tables`;
        let observable = this.http.get(url, { params: params })
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    saveTable(table:any) : Observable<Object>{
        let url = `${this.remoteUrl}api/tables`;
        return this.http.post(url, table)
    } 

    deleteTable(id:string) : Observable<Object>{
        let url = `${this.remoteUrl}api/tables?id=${id}`;
        return this.http.delete(url);
    } 

    getGameHistory(tableId:string|null, userGuid:string|null, tournamentId:string|null) : Observable<Object>{
       
        let params = new HttpParams()          
        if(tableId)
            params = params.append('tableId', tableId);        
        if(userGuid)
            params = params.append('userGuid', userGuid);
        if(tournamentId)
            params = params.append('tournamentId', tournamentId);
        
        
        let url = `${this.remoteUrl}api/games`;
        let observable = this.http.get(url, { params: params })
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

    getTournamentResults(tournamentId:string) : Observable<Object>{
        let url = `${this.remoteUrl}api/tournamentResults?tournamentId=${tournamentId}`;
        let observable = this.http.get(url)
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
      }

      deleteTournament(id:string) : Observable<Object>{
        let url = `${this.remoteUrl}api/tournaments?id=${id}`;
        return this.http.delete(url);
    } 

    deleteUser(guid:string) : Observable<Object>{
        let url = `${this.remoteUrl}api/user?guid=${guid}`;
        return this.http.delete(url);
    } 
    
      awardPrizes(tournamentId:string) : Observable<Object>{
        let url = `${this.remoteUrl}api/awardPrizes?tournamentId=${tournamentId}`;
        return this.http.post(url, {})
    }

    dumpState() : void {
        let url = `${this.remoteUrl}api/dumpState`;
        window.open(url);
        //return this.http.get(url, {})
    }
    

    addFundsToAccount(request:any) : Observable<Object>{
        let url = `${this.remoteUrl}api/addFundsToAccount`;
        return this.http.post(url, request)
    }

    getUserBalances(currency:string){
        let url = `${this.remoteUrl}api/userBalances?currency=${currency}`;
        let observable = this.http.get(url)
        .map((data:any)=>{                        
            return data;
        });
        
        return this.chainCatch(observable, url);
    }

}
