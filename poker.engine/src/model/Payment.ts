import { UserSmall } from "./UserSmall";

export class Payment {
  _id?: string;//will be a mongodb id
  type: string;
  amount: string;
  address: string;
  currency: string;
  guid: string;
  screenName: string;
  timestamp: Date;
  fees: string|null;
  txId: string;
  transferFrom: UserSmall;
  transferTo: UserSmall;
  sweepFee?:string;  
  sweepFeeUsed?:boolean;
  remainder?:string;
  status:string;
  confirmations:number;
  updated: Date;
  sentAmount: number;
  error: string;
  tournamentId: string;
  tournamentName: string;
  comment: string;
  isTournamentRebuy: boolean;
    tournamentPlacing: number;

  constructor(obj: Payment = {} as Payment) {
    Object.assign(this, obj);
  }

  
}