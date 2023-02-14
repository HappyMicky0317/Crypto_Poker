import { WebSocketHandle } from "../model/WebSocketHandle";
import { ListTablesRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { DataContainer, TableConfigs } from "../../../poker.ui/src/shared/DataContainer";
import { IPokerTableProvider } from "../services/IBroadcastService";
import { getTableViewRow } from "../helpers";

export class ListTablesRequestHandler extends AbstractMessageHandler<ListTablesRequest>{
    
    constructor(private pokerTableProvider:IPokerTableProvider) {
        super();
        
    }
    handleMessage(wsHandle: WebSocketHandle, request: ListTablesRequest): Promise<any> {

        let data = new DataContainer();
        data.tableConfigs = new TableConfigs();
        data.tableConfigs.rows = this.pokerTableProvider.getTables().map(getTableViewRow);
        wsHandle.send(data);

        return Promise.resolve();
    }
}