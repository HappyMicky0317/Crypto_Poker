"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbTableProcessorMessage = exports.TableMessage = exports.TableProcessorResult = exports.TableProcessorMessage = exports.TableProcessor = void 0;
const AbstractProcessor_1 = require("../../../framework/AbstractProcessor");
const TableMessageHandler_1 = require("./TableMessageHandler");
class TableProcessor extends AbstractProcessor_1.AbstractProcessor {
    constructor(dataRepository, tournamentLogic) {
        super(TableProcessorResult);
        this.addHandler(new TableMessageHandler_1.TableMessageHandler(dataRepository, tournamentLogic));
    }
    log(message) {
    }
}
exports.TableProcessor = TableProcessor;
class TableProcessorMessage {
    constructor(table) {
        this.table = table;
        this.message = {};
    }
}
exports.TableProcessorMessage = TableProcessorMessage;
class TableProcessorResult {
}
exports.TableProcessorResult = TableProcessorResult;
class TableMessage {
}
exports.TableMessage = TableMessage;
class DbTableProcessorMessage {
}
exports.DbTableProcessorMessage = DbTableProcessorMessage;
//# sourceMappingURL=TableProcessor.js.map