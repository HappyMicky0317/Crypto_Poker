"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerProvider = void 0;
const TableProcessor_1 = require("../../admin/processor/table-processor/TableProcessor");
class TimerProvider {
    constructor(processor) {
        this.processor = processor;
    }
    startTimer(handler, timeoutMs, table) {
        return setTimeout(() => {
            let tMessage = new TableProcessor_1.TableProcessorMessage(table);
            tMessage.tableMessage = new TableProcessor_1.TableMessage();
            tMessage.tableMessage.action = handler;
            this.processor.sendMessage(tMessage);
        }, timeoutMs);
    }
}
exports.TimerProvider = TimerProvider;
//# sourceMappingURL=TimerProvider.js.map