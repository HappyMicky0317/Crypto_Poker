import { SubscribeToTableRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { IPokerTableProvider } from "../services/IBroadcastService";
import { TournamentLogic } from "./TournamentLogic";
import { Table } from "../table";
import { Currency } from "../../../poker.ui/src/shared/Currency";

export class SubscribeToTableRequestHandler extends AbstractMessageHandler<SubscribeToTableRequest> {
    constructor(private pokerTableProvider:IPokerTableProvider, private tournamentLogic:TournamentLogic) {
        super();
        
    }
    
    async handleMessage(wsHandle: WebSocketHandle, request:SubscribeToTableRequest): Promise<void>{
        
      let tables = this.pokerTableProvider.getTables();
      let table:Table;
      if(request.tournamentId){
        table = await this.tournamentLogic.getTournamentTable(request.tournamentId, request.tableId, wsHandle);        
      }else{
        table =  tables.find(t => t.tableId === request.tableId);
      }

      if(table == null){
        table = tables.find(t=>t.tableConfig.currency==Currency.free);//some issue with table not found... subscribe them to a table so the 'loading table' message goes away
      }

      if(table != null){
        for (let t of tables) {
          if (t !== table)
            t.removeSubscriber(wsHandle);
        }
        table.addSubscriber(wsHandle);
      }  
    }
}