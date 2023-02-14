"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPokerTableProvider = exports.IBroadcastService = void 0;
class IBroadcastService {
    broadcast(data) { throw new Error("Not implemented"); }
    broadcastUserStatus(wsHandle, online) { throw new Error("Not implemented"); }
    onScreenNameChanged(wsHandle, oldName, newName) { throw new Error("Not implemented"); }
    send(guid, dataFunc) { throw new Error("Not implemented"); }
}
exports.IBroadcastService = IBroadcastService;
class IPokerTableProvider {
    removeTables(options) { throw new Error("Method not implemented."); }
    getTables() { throw new Error("Not implemented"); }
    addTable(table) { throw new Error("Not implemented"); }
    findTable(id) { throw new Error("Not implemented"); }
}
exports.IPokerTableProvider = IPokerTableProvider;
//# sourceMappingURL=IBroadcastService.js.map