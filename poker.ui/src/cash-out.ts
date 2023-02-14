import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { ApiService } from "./lib/api-service";
import { PaymentHistoryRequest, CashOutRequest, FundAccountRequest } from "./shared/ClientMessage";
import * as $ from 'jquery';
import { Util } from "./lib/util";

@autoinject()
export class CashOut {


  constructor(private apiService: ApiService, private util: Util) {

  }
  sentFundAccountRequest:boolean;

  attached() {
    this.apiService.send(new CashOutRequest());


    $('#pHistory').on('shown.bs.tab', (e) => {
      this.apiService.send(new PaymentHistoryRequest())
    });

    $('#depositTab').on('shown.bs.tab', (e) => {
      if(!this.sentFundAccountRequest){
          this.apiService.send(new FundAccountRequest(this.util.getCryptoCurrencies()[0]));
          this.sentFundAccountRequest = true;
        }
    });
  }


}



