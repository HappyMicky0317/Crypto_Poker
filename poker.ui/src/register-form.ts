import { LoginResult, LoginRequest } from './shared/login-request';
import { autoinject, bindable } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { ApiService } from "./lib/api-service";
import { ClientMessage } from './shared/ClientMessage';
import { RegisterRequest, RegisterResult } from './shared/signup-request';

@autoinject()
export class RegisterForm{
  registering:boolean;
  subscriptions: { dispose: () => void }[] = [];
  loginResult:LoginResult;
  email:string;
  screenName:string;
  password:string;
  confirmPassword:string;
  result:RegisterResult;
  @bindable tournamentId;

  constructor(private ea: EventAggregator, private apiService: ApiService) {
    this.subscriptions.push(ea.subscribe(RegisterResult, (r) => this.handleRegisterResult(r)));

  }

  register(){
    
    this.registering = true;
    
    let request = new RegisterRequest();
    request.email = this.email;
    request.screenName = this.screenName;
    request.password = this.password;
    request.confirmPassword = this.confirmPassword;
    request.tournamentId = this.tournamentId;
    let message = new ClientMessage();
    message.registerRequest = request;
    this.apiService.sendMessage(message);
  }

  handleRegisterResult(result:RegisterResult){
    this.registering=false;
    this.result = result;
  }
 
  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

  
  
}

