"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTablesRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const helpers_1 = require("../helpers");
class ListTablesRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(pokerTableProvider) {
        super();
        this.pokerTableProvider = pokerTableProvider;
    }
    handleMessage(wsHandle, request) {
        let data = new DataContainer_1.DataContainer();
        data.tableConfigs = new DataContainer_1.TableConfigs();
        data.tableConfigs.rows = this.pokerTableProvider.getTables().map(helpers_1.getTableViewRow);
        wsHandle.send(data);
        return Promise.resolve();
    }
}
exports.ListTablesRequestHandler = ListTablesRequestHandler;
//# sourceMappingURL=ListTablesRequestHandler.js.map