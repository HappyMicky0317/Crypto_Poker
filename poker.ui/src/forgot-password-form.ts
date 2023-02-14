import { ApiService } from './lib/api-service';
import { ForgotRequest, ForgotResult } from './shared/forgot-request';
import {autoinject} from 'aurelia-framework';
import { ClientMessage } from './shared/ClientMessage';
import { EventAggregator } from 'aurelia-event-aggregator';

@autoinject()
export class ForgotPasswordForm{
  submitting:boolean;
  email:string;
  result:ForgotResult;
  subscriptions: { dispose: () => void }[] = [];

  constructor(private apiService: ApiService, ea: EventAggregator) {
    this.subscriptions.push(ea.subscribe(ForgotResult, (r) => this.handleResult(r)));
    
  }
  submit(){
    this.submitting = true;
    let request:ForgotRequest = new ForgotRequest();
    request.email = this.email;
    let message = new ClientMessage();
    message.forgotRequest = request;
    this.apiService.sendMessage(message);
    
  }
  handleResult(result:ForgotResult){
    this.result = result;
    this.submitting = false;
  }
  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }
}
