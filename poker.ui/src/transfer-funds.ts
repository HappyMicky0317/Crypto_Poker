import { autoinject, computedFrom } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from "./lib/util";
import {ApiService} from "./lib/api-service";
import {TransferFundsResult } from "./shared/DataContainer";
import { CurrencyUnit } from "./shared/Currency";
import { ClientMessage, TransferFundsRequest } from "./shared/ClientMessage";

@autoinject()
export class TransferFunds {

  saving: boolean;
  transferToScreenName:string;
  transferAmount:number;
  successMessage:string;
  subscriptions: { dispose: () => void }[] = [];
  result: TransferFundsResult;

  constructor(private controller: DialogController, public util: Util, private ea: EventAggregator, private apiService: ApiService) {
    //this.subscriptions.push(ea.subscribe(GetAccountSettingsResult, (r) => this.handleAccountSettings(r)));
    this.subscriptions.push(ea.subscribe(TransferFundsResult, (r) => this.handleTransferFundsResult(r)));
  }

  handleTransferFundsResult(result: TransferFundsResult) {
    this.result = result;    
    this.saving = false;
    if(result.success)
      this.successMessage = `${result.amount/CurrencyUnit.default} ${result.currency} has been transferred to ${result.screenName}`;
  }

  
  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

  @computedFrom('saving', 'result')
  get transferButtonText(): string {
    if (this.saving)
      return 'Transferring...';
    else {
      if (this.result && this.result.success) {
        return 'Transferred!';
      }
    }
    return 'Transfer Now';
  }

  transfer() {
    this.saving = true;

    //this.saving = true;
    let message = new ClientMessage();
    message.transferFundsRequest = new TransferFundsRequest();
    message.transferFundsRequest.screenName = this.transferToScreenName;    
    message.transferFundsRequest.amount = Math.round(this.transferAmount*CurrencyUnit.default);
    this.apiService.sendMessage(message);
  }
  

}
