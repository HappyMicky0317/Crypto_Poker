export class AddressInfo {        
  _id: any;
  userGuid: string;
  screenName: string;
  currency: string;
  address: string;
  public: string;  
  guid: string;
  hookId: string;
  processed:boolean=false;  
  incomingTxHashes:string[] = [];    
  index:number;
}