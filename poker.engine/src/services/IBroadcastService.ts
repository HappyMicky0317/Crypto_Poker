import { DataContainer } from "../../../poker.ui/src/shared/DataContainer";
import { Table } from "../table";
import { WebSocketHandle } from "../model/WebSocketHandle";

export class IBroadcastService {
  broadcast(data:DataContainer):void { throw new Error("Not implemented"); }  
  broadcastUserStatus(wsHandle: WebSocketHandle, online:boolean): void { throw new Error("Not implemented"); }  
  onScreenNameChanged(wsHandle: WebSocketHandle, oldName:string, newName:string): void { throw new Error("Not implemented"); }  
  send(guid:string, dataFunc:()=>Promise<DataContainer>) : Promise<void> { throw new Error("Not implemented"); }  
}
export class IPokerTableProvider {
  removeTables(options: { tournamentId: string; }): void { throw new Error("Method not implemented."); }
  getTables():Table[] { throw new Error("Not implemented"); }  
  addTable(table:Table):void { throw new Error("Not implemented"); }  
  findTable(id: string): Table { throw new Error("Not implemented"); }  
}