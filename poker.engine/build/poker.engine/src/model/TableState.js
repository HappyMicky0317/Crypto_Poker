"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerTableState = exports.TableState = void 0;
class TableState {
}
exports.TableState = TableState;
class PlayerTableState {
    constructor(handle) {
        this.guid = handle.guid;
        this.screenName = handle.screenName;
        this.seat = handle.seat;
        this.stack = handle.stack + '';
        this.bet = handle.bet + '';
        this.cumulativeBet = handle.cumulativeBet + '';
    }
}
exports.PlayerTableState = PlayerTableState;
//# sourceMappingURL=TableState.js.map