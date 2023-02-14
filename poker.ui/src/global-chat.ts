import { autoinject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { Util } from "./lib/util";
import {ApiService} from "./lib/api-service";
import {ChatMessage, GlobalChatResult, GlobalUsers, UserStatus } from "./shared/DataContainer";
import {ConnectionClosedEvent} from "./messages";
import { ClientMessage, GlobalChatRequest } from "./shared/ClientMessage";


@autoinject()
export class GlobalChat {

  globalChatboxElem: any;
  globalChatInput: string;
  globalChatMessages: any[] = [];
  subscriptions: { dispose: () => void }[] = [];
  showChat: boolean = true;
  showUsers: boolean = true;
  users: IUserStatusView[] = [];
  constructor(private ea: EventAggregator, private apiService: ApiService, private util: Util) {

    this.subscriptions.push(ea.subscribe(GlobalChatResult, result => { this.handleChat(result); }));
    this.subscriptions.push(ea.subscribe(GlobalUsers, result => { this.handleGlobalUsers(result); }));
    this.subscriptions.push(ea.subscribe(ConnectionClosedEvent, msg => {
       this.users=[];
    }));
  }

  toggleOnline() {
    this.showUsers = !this.showUsers;
  }

  handleGlobalUsers(data: GlobalUsers) {
    for (let user of data.users) {
      var existing = this.users.find(u => u.screenName === user.screenName);
      if (existing && !user.online)
        this.users.splice(this.users.indexOf(existing), 1);
      if (!existing && user.online) {
        let view:IUserStatusView = Object.assign({}, user);
        view.showYouLabel = !this.util.user.activated && user.screenName==this.util.user.screenName;
        this.users.push(view);        
        
        if (!data.initialData && this.util.user.notifyUserStatus && user.screenName !== this.util.user.screenName) {
          this.util.notify(`${user.screenName} is online`);
        }
      }
        
    }
    
    this.users.sort((p1: IUserStatusView, p2: IUserStatusView) => { return p1.screenName.localeCompare(p2.screenName) });
  }


  globalChatKeyPress(event) {
    if (event.keyCode === 13) {
      if (this.globalChatInput) {
        this.apiService.send(new GlobalChatRequest(this.globalChatInput));
        this.globalChatInput = '';
        this.apiService.loadSounds();
      }    
    }
  }
  


  globalChatboxElemScrollHeight: number;
  usersOnlineTop:number;
  handleChat(result: GlobalChatResult) {     
    if (result.initialData) {
      this.globalChatMessages = result.messages;
      setTimeout(() => {
        this.globalChatboxElemScrollHeight = this.globalChatboxElem.scrollHeight;
        this.usersOnlineTop = this.globalChatboxElemScrollHeight - 200;
        },
        350);
    } else {
      for (let message of result.messages)
        this.globalChatMessages.push(message);      
      this.globalChatboxElemScrollHeight = this.globalChatboxElem.scrollHeight;
      if (!result.initialData && this.showChat)
        this.util.playSound(this.apiService.audioFiles.message);
      this.usersOnlineTop = this.globalChatboxElemScrollHeight - 200;
    }    
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }

  attached() {
    
  }



}
interface IUserStatusView {
  screenName?:string;
  country?:string;
  countryCode?:string;
  showYouLabel?:boolean;
}
