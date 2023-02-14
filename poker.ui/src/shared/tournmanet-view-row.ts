import { TournmanetStatus } from "./TournmanetStatus";

export class TournamentViewRow{
  id:string;
  name:string;
  currency:string;
  startTime:string;
  totalPrize:string;
  totalPrizeUsd:string;
  playerCount:number;
  joined:boolean;  
  status:TournmanetStatus;
  statusText:string;
  startTimeLocal:string;
  showTables:boolean;
  lateRegistrationMin: number;
  
  registering:boolean;
  canRegister: boolean;
  isLate: boolean;
  buyIn: string;
}
