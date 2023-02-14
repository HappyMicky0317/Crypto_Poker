import { Injectable } from "@angular/core";

@Injectable()
export class PaymentServerUrlService {
    localUrl:string;
    base64Pass:string;
    constructor(){
        this.localUrl = `http://${window.location.hostname}:8113/`;
    }
}