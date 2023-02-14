"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeSeatingItem = exports.ChangeSeatingResult = exports.ChangeSeatingLogic = void 0;
const helpers_1 = require("../helpers");
class ChangeSeatingLogic {
    static getChangeSeatingResult(table, tables) {
        let result = new ChangeSeatingResult();
        if (!tables.length)
            return result;
        let activePlayers = table.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter);
        let inactivePlayers = table.getPlayers().filter(ChangeSeatingLogic.inactivePlayersFilter);
        let thresholdNumOfPlayers = Math.round(table.tableConfig.maxPlayers / 2) + 1;
        let filteredTables = tables;
        let remainingPlayerCount = [table, ...tables].map(t => t.getPlayers().length).reduce((a, b) => a + b, 0);
        if (remainingPlayerCount > table.tableConfig.maxPlayers) {
            filteredTables = tables.filter(t => t.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length);
        }
        let tablesWithEmptySeats = ChangeSeatingLogic.getTablesWithEmptySeats(filteredTables);
        if (activePlayers.length < thresholdNumOfPlayers) {
            let totalFreeSeats = tablesWithEmptySeats.reduce((a, b) => a + b.emptySeats.length, 0);
            if (activePlayers.length > totalFreeSeats) {
                return result;
            }
            for (let player of activePlayers.concat(inactivePlayers)) {
                if (tablesWithEmptySeats.length) {
                    let nextTableEmptySeat = null;
                    for (let nextTable of tablesWithEmptySeats) {
                        let targetTableActivePlayers = nextTable.table.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length;
                        let sourceTableActivePlayers = activePlayers.length - result.leaving.length;
                        if (nextTable.emptySeats.length + targetTableActivePlayers > sourceTableActivePlayers) {
                            nextTableEmptySeat = nextTable;
                            break;
                        }
                    }
                    if (nextTableEmptySeat) {
                        let nextEmptySeat = nextTableEmptySeat.emptySeats.splice(0, 1)[0];
                        result.leaving.push(new ChangeSeatingItem(player, nextEmptySeat, nextTableEmptySeat.table));
                        if (nextTableEmptySeat.emptySeats.length === 0) {
                            (0, helpers_1.removeItem)(tablesWithEmptySeats, nextTableEmptySeat);
                        }
                    }
                }
            }
        }
        else {
            let items = this.checkMovePlayersToOtherTables(activePlayers, thresholdNumOfPlayers, tablesWithEmptySeats);
            result.leaving.push(...items);
        }
        if (result.leaving.length == 0) {
            let emptySeats = table.getEmptySeats();
            if (emptySeats.length) {
                ChangeSeatingLogic.addPlayersToTable(table.tableConfig.maxPlayers, tables, emptySeats, result);
            }
        }
        return result;
    }
    static checkMovePlayersToOtherTables(activePlayers, thresholdNumOfPlayers, tablesWithEmptySeats) {
        let maxNumOfPlayersToTake = activePlayers.length;
        let items = [];
        for (let i = 0; i < maxNumOfPlayersToTake; i++) {
            if (tablesWithEmptySeats.length) {
                tablesWithEmptySeats.sort((a, b) => b.emptySeats.length - a.emptySeats.length);
                let nextTableEmptySeat = null;
                let numPlayers = activePlayers.length - items.length;
                for (let table of tablesWithEmptySeats) {
                    let numPlayersTargetTable = table.table.getPlayers().length + items.filter(i => i.table == table.table).length;
                    if (numPlayers > numPlayersTargetTable + 1 && numPlayers + numPlayersTargetTable > table.table.tableConfig.maxPlayers) {
                        nextTableEmptySeat = table;
                        break;
                    }
                }
                if (nextTableEmptySeat) {
                    let nextEmptySeat = nextTableEmptySeat.emptySeats.splice(0, 1)[0];
                    items.push(new ChangeSeatingItem(activePlayers[i], nextEmptySeat, nextTableEmptySeat.table));
                    if (nextTableEmptySeat.emptySeats.length === 0) {
                        (0, helpers_1.removeItem)(tablesWithEmptySeats, nextTableEmptySeat);
                    }
                }
            }
        }
        return items;
    }
    static addPlayersToTable(maxPlayers, tables, emptySeats, result) {
        let sorted = tables.filter(t => !t.currentPlayers).sort((a, b) => b.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length - a.getPlayers().filter(ChangeSeatingLogic.activePlayersFilter).length);
        for (let otherTable of sorted) {
            let waitingPlayers = otherTable.getPlayers();
            let numPlayers = waitingPlayers.length - result.joining.filter(s => s.table == otherTable).length;
            let numPlayersTargetTable = maxPlayers - emptySeats.length;
            if (numPlayers - 1 > numPlayersTargetTable || numPlayers + numPlayersTargetTable <= maxPlayers) {
                let hasJoined = (handle) => {
                    return result.joining.find(s => s.handle == handle) != null;
                };
                let waitingPlayer = waitingPlayers.find(p => !hasJoined(p));
                if (waitingPlayer && emptySeats.length) {
                    let nextEmptySeat = emptySeats.splice(0, 1)[0];
                    result.joining.push(new ChangeSeatingItem(waitingPlayer, nextEmptySeat, otherTable));
                }
            }
        }
    }
    static getTablesWithEmptySeats(tables) {
        let tablesWithEmptySeats = [];
        for (let otherTable of tables) {
            let emptySeats = otherTable.getEmptySeats();
            if (emptySeats.length) {
                tablesWithEmptySeats.push({ emptySeats: emptySeats, table: otherTable });
            }
        }
        return tablesWithEmptySeats;
    }
}
exports.ChangeSeatingLogic = ChangeSeatingLogic;
ChangeSeatingLogic.activePlayersFilter = (p) => !p.isDisconnected && !p.isSittingOut;
ChangeSeatingLogic.inactivePlayersFilter = (p) => p.isDisconnected || p.isSittingOut;
class ChangeSeatingResult {
    constructor() {
        this.joining = [];
        this.leaving = [];
    }
}
exports.ChangeSeatingResult = ChangeSeatingResult;
class ChangeSeatingItem {
    constructor(handle, seat, table) {
        this.handle = handle;
        this.seat = seat;
        this.table = table;
    }
}
exports.ChangeSeatingItem = ChangeSeatingItem;
//# sourceMappingURL=ChangeSeatingLogic.js.map