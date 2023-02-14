import { WebSocketHandle } from "../model/WebSocketHandle";
import { RebuyRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { TournamentInfoRequest } from "../../../poker.ui/src/shared/TournamentInfoRequest";
import { IDataRepository } from "../services/documents/IDataRepository";
import { TournamentLogic } from "./TournamentLogic";
import { TableProcessorMessage } from "../admin/processor/table-processor/TableProcessor";

export class RebuyRequestHandler extends AbstractMessageHandler<RebuyRequest>{
    
    constructor(private dataRepository:IDataRepository, private tournamentLogic:TournamentLogic) {
        super();
        
    }
    
    async handleMessage(wsHandle: WebSocketHandle, request: RebuyRequest): Promise<any> {

        let processor = this.tournamentLogic.getTableProcessor(request.tournamentId);
        let tMessage = new TableProcessorMessage(null);
        tMessage.rebuy = { tournamentId:request.tournamentId, user: wsHandle.user.toSmall() };
        processor.sendMessage(tMessage);
        return Promise.resolve();
    }
}