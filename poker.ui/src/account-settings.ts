import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import * as $ from 'jquery';
import { ApiService } from "./lib/api-service";
import { PaymentHistoryRequest, CashOutRequest, FundAccountRequest } from "./shared/ClientMessage";
import { Util } from "./lib/util";

@autoinject()
export class AccountSettings {

  constructor(private controller: DialogController, private apiService: ApiService, private util: Util) {    
  }
  
  historyTab:HTMLElement;
  withdrawTab:HTMLElement;
  depositTab:HTMLElement;
  sentFundAccountRequest:boolean;

  attached(){
      $(this.historyTab).on('shown.bs.tab', (e) => {
        this.apiService.send(new PaymentHistoryRequest())
      });

      $(this.withdrawTab).on('shown.bs.tab', (e) => {
        this.apiService.send(new CashOutRequest());
      });

      $(this.depositTab).on('shown.bs.tab', (e) => {
        if(!this.sentFundAccountRequest){
          this.apiService.send(new FundAccountRequest(this.util.getCryptoCurrencies()[0]));
          this.sentFundAccountRequest = true;
        }
        
      });
  }
}
