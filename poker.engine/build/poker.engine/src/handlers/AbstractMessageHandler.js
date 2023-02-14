"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractMessageHandler = void 0;
class AbstractMessageHandler {
    constructor() {
        let typeName = this.constructor.name.replace('Handler', '');
        this.typeName = typeName.charAt(0).toLowerCase() + typeName.slice(1);
    }
    run(wsHandle, data) {
        let request = data[this.typeName];
        return this.handleMessage(wsHandle, request);
    }
    async handleMessage(wsHandle, request) {
        throw new Error("Method not implemented.");
    }
    init() {
        return Promise.resolve();
    }
}
exports.AbstractMessageHandler = AbstractMessageHandler;
//# sourceMappingURL=AbstractMessageHandler.js.map