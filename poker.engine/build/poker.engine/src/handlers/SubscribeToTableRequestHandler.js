"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscribeToTableRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
class SubscribeToTableRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(pokerTableProvider, tournamentLogic) {
        super();
        this.pokerTableProvider = pokerTableProvider;
        this.tournamentLogic = tournamentLogic;
    }
    async handleMessage(wsHandle, request) {
        let tables = this.pokerTableProvider.getTables();
        let table;
        if (request.tournamentId) {
            table = await this.tournamentLogic.getTournamentTable(request.tournamentId, request.tableId, wsHandle);
        }
        else {
            table = tables.find(t => t.tableId === request.tableId);
        }
        if (table == null) {
            table = tables.find(t => t.tableConfig.currency == Currency_1.Currency.free);
        }
        if (table != null) {
            for (let t of tables) {
                if (t !== table)
                    t.removeSubscriber(wsHandle);
            }
            table.addSubscriber(wsHandle);
        }
    }
}
exports.SubscribeToTableRequestHandler = SubscribeToTableRequestHandler;
//# sourceMappingURL=SubscribeToTableRequestHandler.js.map