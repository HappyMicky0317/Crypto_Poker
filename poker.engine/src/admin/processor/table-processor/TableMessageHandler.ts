import { TableProcessorMessage, TableProcessorResult, DbTableProcessorMessage, ITableProcessorMessageHandler } from "./TableProcessor";
import { IDataRepository } from "../../../services/documents/IDataRepository";
import { Logger, getLogger } from "log4js";
import { TournamentLogic } from "../../../handlers/TournamentLogic";
const logger:Logger = getLogger();

export class TableMessageHandler implements ITableProcessorMessageHandler{
    
    typeName: string = 'message';

    constructor(private dataRepository:IDataRepository, private tournamentLogic:TournamentLogic){

    }
    async run(tMessage: TableProcessorMessage): Promise<TableProcessorResult>{
        

        let result = new TableProcessorResult();
        try {
            await this.dataRepository.saveTableProcessorMessage(this.getDbTableProcessorMessage(tMessage));

            if(tMessage.tableMessage!=null){
                await tMessage.tableMessage.action()
            }else if(tMessage.fold != null){
                tMessage.table.handleFold(tMessage.fold.guid);
            }else if(tMessage.joinTableRequest != null){
                tMessage.table.handleJoinTableRequest(tMessage.joinTableRequest);
            }else if(tMessage.bet != null){
                tMessage.table.handleBet(tMessage.bet.betAmount, tMessage.bet.user.guid);
            }else if(tMessage.setTableOptionRequest != null){
                tMessage.table.handleSetTableOptionRequest(tMessage.setTableOptionRequest.request, tMessage.setTableOptionRequest.user.guid);
            }else if(tMessage.checkIdlePlayers != null){
                result.evictedPlayers = await tMessage.table.checkIdlePlayers();
            }else if(tMessage.leaveTable != null){
                await tMessage.table.leaveTable(tMessage.leaveTable.guid);
            }else if(tMessage.lateRegistration != null){
                result.lateRegistrationTableId = await this.tournamentLogic.lateRegistration(tMessage.lateRegistration.tournamentId, tMessage.lateRegistration.user.guid);
            }else if(tMessage.evictingIdleTournamentPlayers != null){
                await this.tournamentLogic.onPlayersBusted(tMessage.evictingIdleTournamentPlayers.tournamentId, tMessage.evictingIdleTournamentPlayers.playerHandles);
            }else if(tMessage.rebuy != null){
                await this.tournamentLogic.rebuy(tMessage.rebuy.tournamentId, tMessage.rebuy.user);
            }
            
        } catch (e) {
            logger.error(e)
        }
        return result;
    }
    
    getDbTableProcessorMessage(tMessage: TableProcessorMessage) : DbTableProcessorMessage{
        let dbMessage = new DbTableProcessorMessage();
        if(tMessage.table!=null){
            dbMessage.tournamentId = tMessage.table.tournamentId;
            dbMessage.tableId = tMessage.table.tableConfig._id.toString();
        }
        
        if(tMessage.tableMessage!=null){
            dbMessage.tableMessageAction = tMessage.tableMessage.action.name;
            if(tMessage.tableMessage.tournamentId && !tMessage.table){
                dbMessage.tournamentId = tMessage.tableMessage.tournamentId;//see evictingIdleTournamentPlayers
            }
        }
        if(tMessage.fold){
            dbMessage.fold = tMessage.fold;
        }
        if(tMessage.joinTableRequest){
            dbMessage.joinTableRequest = tMessage.joinTableRequest;
        }
        if(tMessage.bet){
            dbMessage.bet = tMessage.bet;
        }
        if(tMessage.setTableOptionRequest){
            dbMessage.setTableOptionRequest = tMessage.setTableOptionRequest;
        }
        if(tMessage.checkIdlePlayers){
            dbMessage.checkIdlePlayers = tMessage.checkIdlePlayers;
        }
        if(tMessage.leaveTable){
            dbMessage.leaveTable = tMessage.leaveTable;
        }
        if(tMessage.lateRegistration){
            dbMessage.lateRegistration = tMessage.lateRegistration;
        }
        if(tMessage.rebuy){
            dbMessage.rebuy = tMessage.rebuy;
        }
        
        return dbMessage;
    }
}