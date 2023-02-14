import { LoginResult, LoginRequest } from './shared/login-request';
import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import * as $ from 'jquery';
import { Util } from "./lib/util";
import { EventAggregator } from "aurelia-event-aggregator";
import { ApiService } from "./lib/api-service";
import { ClientMessage } from './shared/ClientMessage';
import { RegisterNowClicked, OpenLoginPopupEvent, ResetPasswordClicked } from './messages';

@autoinject()
export class LoginPopup {
  subscriptions: { dispose: () => void }[] = [];
  tournamentId:string;
  constructor(private controller: DialogController, ea: EventAggregator) {
    this.subscriptions.push(ea.subscribe(RegisterNowClicked, (r) => this.changeTab('register')));
    this.subscriptions.push(ea.subscribe(ResetPasswordClicked, (r) => this.changeTab('resetPassword')));
  }
  private openRegisterTab:boolean;

  activate(model?:OpenLoginPopupEvent) {
    if(model){
      this.openRegisterTab = model.openRegisterTab;    
      this.tournamentId = model.tournamentId;      
    }    
  }

  attached(){
    if(this.openRegisterTab){
      this.changeTab('register');
    }
  }

  changeTab(tab:string){
    $('.nav-tabs a[href="#' + tab + '"]').tab('show');
  }
  
}
