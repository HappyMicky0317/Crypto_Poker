export class UserDetailView{
  guid:string=undefined;
  screenName:string=undefined;
  email:string=undefined;
  password:string=undefined;
  activated:boolean=undefined;
  notifyUserStatus:boolean=undefined;
  disabled:boolean=undefined;
  accounts:AccountView[]=[];
  depositIndex:number = undefined;
}
export class AccountView {  
  constructor(public currency: string, public balance: number){

  }
}
