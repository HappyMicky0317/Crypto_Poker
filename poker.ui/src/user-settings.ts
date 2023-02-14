import { autoinject, computedFrom } from "aurelia-framework";

import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from "./lib/util";
import { ApiService } from "./lib/api-service";
import { GetAccountSettingsResult, SetAccountSettingsResult } from "./shared/DataContainer";
import { ClientMessage, CashOutRequest, GetAccountSettingsRequest, SetAccountSettingsRequest } from "./shared/ClientMessage";
import { LogoutResult, LogoutRequest } from "./shared/login-request";
import { OpenLoginPopupEvent } from "./messages";

@autoinject()
export class UserSettings {

  subscriptions: { dispose: () => void }[] = [];
  loading: boolean = true;
  result: GetAccountSettingsResult;
  saveResult: SetAccountSettingsResult;
  saving: boolean;

  constructor(public util: Util, private ea: EventAggregator, private apiService: ApiService) {
    this.subscriptions.push(ea.subscribe(GetAccountSettingsResult, (r) => this.handleAccountSettings(r)));
    this.subscriptions.push(ea.subscribe(SetAccountSettingsResult, (r) => this.handleSetAccountSettings(r)));
  }
  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

  attached() {
    let message = new ClientMessage();
    message.getAccountSettingsRequest = new GetAccountSettingsRequest();
    this.apiService.sendMessage(message);
  }

  handleAccountSettings(result: GetAccountSettingsResult) {
    this.result = result;
    this.loading = false;
  }

  save() {
    this.saving = true;
    let message = new ClientMessage();
    message.setAccountSettingsRequest = new SetAccountSettingsRequest();
    message.setAccountSettingsRequest.screenName = this.result.screenName;
    message.setAccountSettingsRequest.muteSounds = this.result.muteSounds;
    this.apiService.sendMessage(message);
  }

  @computedFrom('saving', 'saveResult')
  get saveButtonText(): string {
    if (this.saving)
      return 'Saving';
    else {
      if (this.saveResult && this.saveResult.success) {
        return 'Saved!';
      }
    }
    return 'Save';
  }

  handleSetAccountSettings(saveResult: SetAccountSettingsResult) {
    this.saveResult = saveResult;
    this.saving = false;
    if(saveResult.success){
      this.util.user.screenName = this.result.screenName;
      this.util.user.muteSounds = this.result.muteSounds;
    }
    console.log('user', this.util.user);
  }

  handleLogoutResult(result: LogoutResult) {
    
    this.saving = false;
  }

  logout(){
    this.saving = true;
    let message = new ClientMessage();
    message.logoutRequest = new LogoutRequest();
    this.apiService.sendMessage(message);
  }

  loginClicked(){
    this.ea.publish(Object.assign(new OpenLoginPopupEvent()));
  }
  registerClicked(){
    this.ea.publish(Object.assign(new OpenLoginPopupEvent(true)));
  }

}
