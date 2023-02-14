import { WebSocketHandle } from "../model/WebSocketHandle";
import { ListTablesRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { DataContainer } from "../../../poker.ui/src/shared/DataContainer";
import { IPokerTableProvider } from "../services/IBroadcastService";
import { getTableViewRow, getCalculatedPrizes } from "../helpers";
import { TournamentInfoRequest, TournamentInfoResult, TournamentResultRowView } from "../../../poker.ui/src/shared/TournamentInfoRequest";
import { IDataRepository } from "../services/documents/IDataRepository";
import { TournamentResult } from "../model/TournamentResult";
import { TournmanetStatus } from "../../../poker.ui/src/shared/TournmanetStatus";
import { TournamentLogic } from "./TournamentLogic";

export class TournamentInfoRequestHandler extends AbstractMessageHandler<TournamentInfoRequest>{
    
    constructor(private dataRepository:IDataRepository, private tournamentLogic:TournamentLogic) {
        super();
        
    }
    
    async handleMessage(wsHandle: WebSocketHandle, request: TournamentInfoRequest): Promise<any> {

        let buyInTotal = await this.dataRepository.getTournamentBuyIns(request.tournamentId);
        let data = new DataContainer();
        let result = new TournamentInfoResult();
        let tournament = await this.dataRepository.getTournmanetById(request.tournamentId)
        result.name = tournament.name;
        result.currency = tournament.currency;
        result.prizes = getCalculatedPrizes(tournament, buyInTotal);
        result.blindConfig = tournament.blindConfig;
        result.playersPerTable = tournament.playersPerTable;
        result.startingChips = tournament.startingChips;
        result.timeToActSec = tournament.timeToActSec;
        result.lateRegistrationMin = tournament.lateRegistrationMin;
        result.evictAfterIdleMin = tournament.evictAfterIdleMin || 10;
        result.buyIn = tournament.buyIn;

        result.results = [];
        let tResults = <TournamentResult[]>await this.dataRepository.getTournamentResults(request.tournamentId);
        tResults.sort((a,b) => a.placing - b.placing);
        if(tournament.status == TournmanetStatus.Started || tournament.status == TournmanetStatus.Complete){
            for(let tResult of tResults){
                result.results.push(new TournamentResultRowView(tResult.screenName, tResult.placing));
            }
            if(tournament.status == TournmanetStatus.Started){
                let remainingPlayers:TournamentResultRowView[] = [];
                for(let player of this.tournamentLogic.getRemainingPlayers(request.tournamentId)){
                    let row = new TournamentResultRowView(player.screenName, null);                    
                    row.stack = player.stack;
                    remainingPlayers.push(row);
                }
                result.results =  remainingPlayers.concat(result.results);
            }
        }
        
        
        data.tournamentInfoResult = result;
        wsHandle.send(data);

        return Promise.resolve();
    }
}