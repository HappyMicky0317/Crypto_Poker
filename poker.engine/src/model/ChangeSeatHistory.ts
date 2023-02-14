import { Table } from "../table";
import { UserSmall } from "./UserSmall";

export class ChangeSeatHistory {
    constructor(public tournamentId:string, public table: ChangeSeatHistoryTable, public otherTables: ChangeSeatHistoryTable[], public result:ChangeSeatingHistoryResult){

    }
}
export class ChangeSeatHistoryTable{    
    id:string;
    players:ChangeSeatHistoryPlayer[] = [];
}
export class ChangeSeatHistoryPlayer{
        
    constructor(public guid:string, public screenName:string, public isDisconnected:boolean, public isSittingOut:boolean){

    }
}

export class ChangeSeatingHistoryResult {
    joining: ChangeSeatingHistoryItem[] = [];
    leaving: ChangeSeatingHistoryItem[] = [];
}

export class ChangeSeatingHistoryItem{
    constructor(public player: UserSmall, public seat: number, public table: {id:string}) {
    }
}