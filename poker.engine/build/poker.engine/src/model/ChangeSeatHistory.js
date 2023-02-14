"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeSeatingHistoryItem = exports.ChangeSeatingHistoryResult = exports.ChangeSeatHistoryPlayer = exports.ChangeSeatHistoryTable = exports.ChangeSeatHistory = void 0;
class ChangeSeatHistory {
    constructor(tournamentId, table, otherTables, result) {
        this.tournamentId = tournamentId;
        this.table = table;
        this.otherTables = otherTables;
        this.result = result;
    }
}
exports.ChangeSeatHistory = ChangeSeatHistory;
class ChangeSeatHistoryTable {
    constructor() {
        this.players = [];
    }
}
exports.ChangeSeatHistoryTable = ChangeSeatHistoryTable;
class ChangeSeatHistoryPlayer {
    constructor(guid, screenName, isDisconnected, isSittingOut) {
        this.guid = guid;
        this.screenName = screenName;
        this.isDisconnected = isDisconnected;
        this.isSittingOut = isSittingOut;
    }
}
exports.ChangeSeatHistoryPlayer = ChangeSeatHistoryPlayer;
class ChangeSeatingHistoryResult {
    constructor() {
        this.joining = [];
        this.leaving = [];
    }
}
exports.ChangeSeatingHistoryResult = ChangeSeatingHistoryResult;
class ChangeSeatingHistoryItem {
    constructor(player, seat, table) {
        this.player = player;
        this.seat = seat;
        this.table = table;
    }
}
exports.ChangeSeatingHistoryItem = ChangeSeatingHistoryItem;
//# sourceMappingURL=ChangeSeatHistory.js.map