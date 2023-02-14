import { AdminTournamentResultsView } from "../../../../../poker.admin.ui.angular/src/app/shared/AdminTournamentResultsView";
import { TournamentResult } from "../../../model/TournamentResult";

export class AwardPrizesRequest {
    constructor(public tournamentId: string, public adminTournamentResultsView:{view:AdminTournamentResultsView, results:TournamentResult[]}) {

    }
}

export class AwardPrizesResult {
    success?:boolean;
    message?:string;
    view?:AdminTournamentResultsView; 
}