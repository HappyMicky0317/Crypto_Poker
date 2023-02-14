export class TournamentResult {
    
    prize:string;
    
    constructor(public tournamentId:string, public userGuid:string, public screenName:string, public placing: number, public timestamp:Date){

    }
}