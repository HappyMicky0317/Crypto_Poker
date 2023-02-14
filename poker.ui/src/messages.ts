
import { Seat } from "./seat";
import { GameEvent } from "./shared/DataContainer";
import { TableViewRow } from "./shared/TableViewRow";
import { TournamentViewRow } from "./shared/tournmanet-view-row";
import { FundingWindowModel } from "./funding-window";

export class TableConfigUpdated {
  constructor(public config:TableViewRow[]) { }
}
export class SitDownAction {
  constructor(public seatIndex:number) { }
}
export class DataMessageEvent {
  constructor(public data) { }
}
export class OpenTableAction {
  constructor(public tableId: string) { }
}
export class ConnectionClosedEvent {
  
}
export class OpenLoginPopupEvent{
  tournamentId: string;
  
  constructor(public openRegisterTab?:boolean) {
  }
}
export class TournamentRegisterClickEvent {
  constructor(public tournament:TournamentViewRow){

  }
}
export class RegisterNowClicked{

}

export class DepositNowEvent {
constructor(private model:FundingWindowModel){

}
}

export class SetBettingControlsEvent{
  constructor(public seat: Seat, public game: GameEvent) { }
}

export class ResetPasswordClicked{

}
