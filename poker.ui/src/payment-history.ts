import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from "./lib/util";
import {ApiService} from "./lib/api-service";
import { PaymentHistoryResult, PaymentHistoryRowView } from "./shared/DataContainer";
import { CommonHelpers } from "./shared/CommonHelpers";


@autoinject()
export class PaymentHistory {

  loading: boolean=true; 
  subscriptions: { dispose: () => void }[] = [];
  payments:PaymentHistoryRowView[];

  constructor(public util: Util, private ea: EventAggregator) {    
    this.subscriptions.push(ea.subscribe(PaymentHistoryResult, (r) => this.handlePaymentHistoryResult(r)));
  }

  handlePaymentHistoryResult(result: PaymentHistoryResult) {
    this.loading = false;   
    if(!result.payments){
      result.payments = [];
    }
    this.payments = result.payments;
    for(let payment of result.payments){      
      (<any>payment).txHashLink = CommonHelpers.getTxHashLink(payment.txHash, payment.currency);
    }
  }

  attached(){
    
  }

  
  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

 
  

}
