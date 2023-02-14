"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServerProcessor = void 0;
const AbstractProcessor_1 = require("../../framework/AbstractProcessor");
const GameServerProcessorResult_1 = require("./GameServerProcessorResult");
class GameServerProcessor extends AbstractProcessor_1.AbstractProcessor {
    constructor() {
        super(GameServerProcessorResult_1.GameServerProcessorResult);
    }
}
exports.GameServerProcessor = GameServerProcessor;
//# sourceMappingURL=GameServerProcessor.js.map