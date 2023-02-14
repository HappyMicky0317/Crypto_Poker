import { removeItem } from "../helpers";
import { TableConfig } from "../model/TableConfig";
import { PlayerTableHandle } from "../model/table/PlayerTableHandle";
import * as _ from "lodash";

export class ChangeSeatingLogic {

    //private static readonly ThresholdNumOfPlayers = 4;
    static activePlayersFilter = (p:PlayerTableHandle):boolean => !p.isDisconnected && !p.isSittingOut;        
    static inactivePlayersFilter = (p:PlayerTableHandle):boolean => p.isDisconnected || p.isSittingOut;        

    public static getChangeSeatingResult(table: IChangeSeatingTable, tables: IChangeSeatingTable[]): ChangeSeatingResult {
        let result = new ChangeSeatingResult();
        if(!tables.length)
            return result;
        
        
        let activePlayers = table.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter);
        let inactivePlayers = table.getPlayers().filter(ChangeSeatingLogic.inactivePlayersFilter);
        let thresholdNumOfPlayers = Math.round(table.tableConfig.maxPlayers / 2)+1;
        let filteredTables = tables;        
        let remainingPlayerCount = [ table, ...tables ].map(t=>t.getPlayers().length).reduce((a,b)=>a+b, 0);  
        if(remainingPlayerCount > table.tableConfig.maxPlayers){
            filteredTables = tables.filter(t=>t.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length);//only consider moving to other tables with active players        
        }
        
        let tablesWithEmptySeats = ChangeSeatingLogic.getTablesWithEmptySeats(filteredTables);
        if (activePlayers.length < thresholdNumOfPlayers) {
            //try seat players elsewhere            

            let totalFreeSeats = tablesWithEmptySeats.reduce((a, b) => a + b.emptySeats.length, 0);
            if (activePlayers.length > totalFreeSeats) {
                return result;
            }

            for (let player of activePlayers.concat(inactivePlayers)) {
                if (tablesWithEmptySeats.length) {
                    let nextTableEmptySeat : { emptySeats: number[], table: IChangeSeatingTable } = null;
                    
                    for(let nextTable of tablesWithEmptySeats){                        
                        let targetTableActivePlayers = nextTable.table.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length;
                        let sourceTableActivePlayers = activePlayers.length - result.leaving.length;
                        if(nextTable.emptySeats.length + targetTableActivePlayers > sourceTableActivePlayers){
                            nextTableEmptySeat = nextTable;
                            break;
                        }
                        
                        
                    }
                    if(nextTableEmptySeat){
                        let nextEmptySeat = nextTableEmptySeat.emptySeats.splice(0, 1)[0];
                        result.leaving.push(new ChangeSeatingItem(player, nextEmptySeat, nextTableEmptySeat.table))
                        if (nextTableEmptySeat.emptySeats.length === 0) {
                            removeItem(tablesWithEmptySeats, nextTableEmptySeat);
                        }
                    }                    
                }
            }
        }else{
            //check whether any of the other tables need players
            let items = this.checkMovePlayersToOtherTables(activePlayers, thresholdNumOfPlayers, tablesWithEmptySeats);
            result.leaving.push(...items)
        }

        if (result.leaving.length == 0) {
            //look to bring players to our table
            let emptySeats = table.getEmptySeats();
            if (emptySeats.length) {
                ChangeSeatingLogic.addPlayersToTable(table.tableConfig.maxPlayers, tables, emptySeats, result);                
            }
        }
        
        return result;
    } 

    

    private static checkMovePlayersToOtherTables(activePlayers:PlayerTableHandle[], thresholdNumOfPlayers:number, tablesWithEmptySeats: { emptySeats: number[], table: IChangeSeatingTable }[]) : ChangeSeatingItem[]{
        let maxNumOfPlayersToTake = activePlayers.length;
        let items:ChangeSeatingItem[] = [];
        for (let i = 0; i < maxNumOfPlayersToTake; i++) {
            
            if(tablesWithEmptySeats.length){
                tablesWithEmptySeats.sort((a,b)=>b.emptySeats.length - a.emptySeats.length);
                let nextTableEmptySeat = null;
                let numPlayers = activePlayers.length - items.length;
                for(let table of tablesWithEmptySeats){
                    let numPlayersTargetTable = table.table.getPlayers().length + items.filter(i=>i.table==table.table).length;
                    if(numPlayers > numPlayersTargetTable+1 && numPlayers + numPlayersTargetTable > table.table.tableConfig.maxPlayers){
                        nextTableEmptySeat = table;
                        break;
                    }
                }
                
                if(nextTableEmptySeat){
                    let nextEmptySeat = nextTableEmptySeat.emptySeats.splice(0, 1)[0];
                    items.push(new ChangeSeatingItem(activePlayers[i], nextEmptySeat, nextTableEmptySeat.table))
                    if (nextTableEmptySeat.emptySeats.length === 0) {
                        removeItem(tablesWithEmptySeats, nextTableEmptySeat);
                    }
                }
            }
            
            
            
        }
        
        
        return items;
    }

    private static addPlayersToTable(maxPlayers:number, tables: IChangeSeatingTable[], emptySeats:number[], result:ChangeSeatingResult){
        //favour tables with active players to stop an inactive player being moved before an active player
        let sorted = tables.filter(t=> !t.currentPlayers).sort((a,b)=>b.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length - a.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length);
        for(let otherTable of sorted){
            
            let waitingPlayers = otherTable.getPlayers();
            let numPlayers = waitingPlayers.length - result.joining.filter(s=>s.table==otherTable).length;
            let numPlayersTargetTable = maxPlayers - emptySeats.length;
            if(numPlayers-1 > numPlayersTargetTable || numPlayers + numPlayersTargetTable <= maxPlayers){                    
                
                //get next player who hasnt already left
                let hasJoined = (handle:PlayerTableHandle) :boolean => {
                    return result.joining.find(s=>s.handle==handle) != null;
                }
                let waitingPlayer = waitingPlayers.find(p=>!hasJoined(p));

                if(waitingPlayer && emptySeats.length){
                    let nextEmptySeat = emptySeats.splice(0, 1)[0];
                    result.joining.push(new ChangeSeatingItem(waitingPlayer, nextEmptySeat, otherTable))
                }               
            }                    
        }
    }


    
    

    

    private static getTablesWithEmptySeats(tables: IChangeSeatingTable[]): { emptySeats: number[], table: IChangeSeatingTable }[] {
        let tablesWithEmptySeats: { emptySeats: number[], table: IChangeSeatingTable }[] = [];
        for (let otherTable of tables) {
            let emptySeats = otherTable.getEmptySeats();
                if (emptySeats.length) {
                    tablesWithEmptySeats.push({ emptySeats: emptySeats, table: otherTable  })
                }
        }
        return tablesWithEmptySeats;
    }


}

export class ChangeSeatingResult {
    joining: ChangeSeatingItem[] = [];
    leaving: ChangeSeatingItem[] = [];
}

export class ChangeSeatingItem {
    constructor(public handle: PlayerTableHandle, public seat: number, public table: IChangeSeatingTable) {
    }
}

export interface IChangeSeatingTable {
    getPlayers(): PlayerTableHandle[];
    getEmptySeats(): number[];
    currentPlayers: PlayerTableHandle[];
    tableConfig:TableConfig
}