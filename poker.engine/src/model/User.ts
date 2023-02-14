import { Account } from "../../../poker.ui/src/shared/DataContainer";
import { UserSmall } from "./UserSmall";

export class User {
  _id: any;
  password: string;
  guid: string;
  screenName: string;
  email: string;
  gravatar: string;
  notifyUserStatus: boolean;
  activationToken: string;
  activated: boolean;  
  disabled: boolean;  
  resetPasswordToken: string;  
  resetPasswordExpires: number;  
  updateIndex: number;  
  muteSounds: boolean;  
  depositIndex: number;  

  setScreenName() {
    if (!this.screenName) {
      this.screenName = "anon" + this.guid.substr(0, 4);
    }
  }
  // getAccount(currency: string): Account {
  //   return this.accounts.find(a => a.currency.toLowerCase() === currency.toLowerCase());
  // }
  toSmall(){
    return new UserSmall(this.guid, this.screenName)
  }
}
