import { IClientServerMessage } from "./ClientMessage";


export class TournamentInfoRequest implements IClientServerMessage {
    constructor(public tournamentId: string) {}

    getFieldName(): string {
        return "tournamentInfoRequest";
    }

}

export class TournamentInfoResult {
    currency:string;
    prizes: string[];
    blindConfig: {smallBlind: number, bigBlind: number, timeMin: number}[];
    results: TournamentResultRowView[];
    playersPerTable: number;
    startingChips: number;    
    timeToActSec: number;    
    lateRegistrationMin: number;    
    evictAfterIdleMin: number;    
    name: string;
    buyIn: string;
}

export class TournamentResultRowView{
    public stack?:number;

    constructor(public screenName:string, public placing:number){

    }
}

