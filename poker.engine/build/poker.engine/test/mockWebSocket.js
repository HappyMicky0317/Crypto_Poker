"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockWebSocket = void 0;
const protobuf_config_1 = __importDefault(require("./../../poker.ui/src/shared/protobuf-config"));
class MockWebSocket {
    constructor() {
        this._socket = { remoteAddress: "127.0.0.1" };
        this.outgoingMessages = [];
        this.readyState = 0;
    }
    on(event, cb) {
        if (event === 'message') {
            this.incomingMessageFunc = cb;
        }
        else if (event === 'close') {
            this.closeFunc = cb;
        }
        return this;
    }
    terminate() { }
    ;
    ping() { }
    ;
    send(data) {
        if (data instanceof Buffer) {
            let deserialized = protobuf_config_1.default.deserialize(data, 'DataContainer');
            this.outgoingMessages.push(deserialized);
        }
        else {
            this.outgoingMessages.push(JSON.parse(data));
        }
    }
    ;
    triggerMessageFromClient(data) {
        let dataStr = JSON.stringify(data);
        this.incomingMessageFunc(dataStr, { binary: false });
    }
    ;
    triggerClose() {
        this.closeFunc();
    }
    clearMessages() {
        this.outgoingMessages = [];
    }
    getLastMessage() {
        return this.outgoingMessages[this.outgoingMessages.length - 1];
    }
    dequeue() {
        let message = this.getLastMessage();
        this.outgoingMessages.pop();
        return message;
    }
    checkNoErrorMessages() {
        for (let message of this.outgoingMessages) {
            if (message.error != undefined) {
                throw Error("expecting no errors. Instead have error: " + message.error.message);
            }
        }
    }
}
exports.MockWebSocket = MockWebSocket;
//# sourceMappingURL=mockWebSocket.js.map