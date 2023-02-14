import { AbstractProcessor, IProcessorMessageHandler } from "../../../framework/AbstractProcessor";
import { Table } from "../../../table";
import { IDataRepository } from "../../../services/documents/IDataRepository";
import { TableMessageHandler } from "./TableMessageHandler";
import { JoinTableRequest } from "../../../model/table/JoinTableRequest";
import { SetTableOptionRequest } from "../../../../../poker.ui/src/shared/ClientMessage";
import { PlayerTableHandle } from "../../../model/table/PlayerTableHandle";
import { UserSmall } from "../../../model/UserSmall";
import { TournamentLogic } from "../../../handlers/TournamentLogic";


export class TableProcessor extends AbstractProcessor<TableProcessorMessage, TableProcessorResult> {

    constructor(dataRepository:IDataRepository, tournamentLogic:TournamentLogic) {
        super(TableProcessorResult)

        this.addHandler(new TableMessageHandler(dataRepository, tournamentLogic));
    }
    
    log(message:TableProcessorMessage) {
        //do not remove; disables log in base class
        //logger.info(`${this.constructor.name} ${message.tableMessage.action.name} ${this.getQueueLog()}`);        
    }
}



export interface ITableProcessorMessageHandler extends IProcessorMessageHandler<TableProcessorMessage, TableProcessorResult> {

}

export class TableProcessorMessage {
    
    message:any = {};//required so messages are handled by TableMessageHandler
    tableMessage:TableMessage;
    fold:UserSmall;
    bet:{betAmount: number, user: UserSmall};
    joinTableRequest: JoinTableRequest
    setTableOptionRequest: { user: UserSmall; request: SetTableOptionRequest; };
    checkIdlePlayers: UserSmall[];
    leaveTable: UserSmall;
    lateRegistration: {user:UserSmall, tournamentId:string};
    rebuy: {user:UserSmall, tournamentId:string};
    evictingIdleTournamentPlayers: { tournamentId:string, playerHandles:PlayerTableHandle[]};
    
    constructor(public table:Table){

    }
}
export class TableProcessorResult {
    error: string
    evictedPlayers: PlayerTableHandle[];
    lateRegistrationTableId: string;
}

export class TableMessage{
  action : () => void;
  tournamentId: string;//used to log the table processor for TableProcessorMessage's that do not define table
}

export class DbTableProcessorMessage {    
    tournamentId: string;
    tableId: string;
    tableMessageAction:string;
    fold:UserSmall;    
    joinTableRequest: JoinTableRequest;
    bet: { betAmount: number; user: UserSmall; };
    setTableOptionRequest: { user: UserSmall; request: SetTableOptionRequest; };
    checkIdlePlayers: UserSmall[];
    leaveTable: UserSmall;
    lateRegistration: { user: UserSmall; tournamentId: string; };
    rebuy: { user: UserSmall; tournamentId: string; };
}