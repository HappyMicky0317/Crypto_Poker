import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { PaymentServerUrlService } from '../pages/payment-server/payment-server-url.service';
import { AdminApiService } from './admin-api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    
    constructor(private urlService:PaymentServerUrlService, private apiService:AdminApiService){
        
    }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        
    console.log(`req.url: ${req.url} remoteUrl:${this.apiService.remoteUrl}`);
    
    if(req.url.startsWith(this.apiService.remoteUrl)){            
      console.log('adding auth for remote call');
      req = req.clone({      
        setHeaders: {        
        'Authorization': `Basic ${this.urlService.base64Pass}`,
      },
    });
    }
    

    return next.handle(req);
  }
}