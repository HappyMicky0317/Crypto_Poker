"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockWebSocketHandle = void 0;
const mockWebSocket_1 = require("./mockWebSocket");
const WebSocketHandle_1 = require("../src/model/WebSocketHandle");
const User_1 = require("../src/model/User");
class MockWebSocketHandle extends WebSocketHandle_1.WebSocketHandle {
    constructor(guid) {
        super(new mockWebSocket_1.MockWebSocket());
        this.user = new User_1.User();
        this.user.guid = guid;
        this.user.screenName = 'screenName_' + guid;
    }
    get mockWebSocket() {
        return this.socket;
    }
}
exports.MockWebSocketHandle = MockWebSocketHandle;
//# sourceMappingURL=MockWebSocketHandle.js.map