import { LoginResult, LoginRequest } from './shared/login-request';
import { autoinject } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { ApiService } from "./lib/api-service";
import { ClientMessage, TournamentSubscriptionRequest } from './shared/ClientMessage';
import { RegisterNowClicked, ResetPasswordClicked } from './messages';

@autoinject()
export class LoginForm{
  loggingIn:boolean;
  subscriptions: { dispose: () => void }[] = [];
  loginResult:LoginResult;
  loginEmail:string;
  loginPassword:string;
  
  constructor(private ea: EventAggregator, private apiService: ApiService) {
    this.subscriptions.push(ea.subscribe(LoginResult, (r) => this.handleLoginResult(r)));

  }

  handleLoginResult(result:LoginResult){
    this.loggingIn=false;
    this.loginResult = result;
    this.apiService.send(new TournamentSubscriptionRequest());
  }

  login(){
    this.loggingIn=true;
    let message = new ClientMessage();
    message.loginRequest = new LoginRequest(this.loginEmail, this.loginPassword);
    this.apiService.sendMessage(message);
    this.apiService.loadSounds();
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }
  registerNowClicked(){
    this.ea.publish(new RegisterNowClicked());
  }
  resetPasswordClicked(){
    this.ea.publish(new ResetPasswordClicked());
  }
}
