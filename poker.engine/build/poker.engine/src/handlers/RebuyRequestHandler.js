"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RebuyRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const TableProcessor_1 = require("../admin/processor/table-processor/TableProcessor");
class RebuyRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, tournamentLogic) {
        super();
        this.dataRepository = dataRepository;
        this.tournamentLogic = tournamentLogic;
    }
    async handleMessage(wsHandle, request) {
        let processor = this.tournamentLogic.getTableProcessor(request.tournamentId);
        let tMessage = new TableProcessor_1.TableProcessorMessage(null);
        tMessage.rebuy = { tournamentId: request.tournamentId, user: wsHandle.user.toSmall() };
        processor.sendMessage(tMessage);
        return Promise.resolve();
    }
}
exports.RebuyRequestHandler = RebuyRequestHandler;
//# sourceMappingURL=RebuyRequestHandler.js.map