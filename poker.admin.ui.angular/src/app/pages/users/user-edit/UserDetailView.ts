export class UserDetailView{
    guid:string=undefined;
    screenName:string=undefined;
    email:string=undefined;
    password:string=undefined;
    activated:boolean=undefined;
    notifyUserStatus:boolean=undefined;
    accounts:AccountView[]=undefined;
  }
  export class AccountView {  
    currency: string;
    balance: number;  
  }
  