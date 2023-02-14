"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketHandle = void 0;
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
var logger = require('log4js').getLogger();
const protobuf_config_1 = __importDefault(require("../../../poker.ui/src/shared/protobuf-config"));
const helpers_1 = require("../helpers");
const util_1 = require("util");
class WebSocketHandle {
    constructor(socket) {
        this.id = ++WebSocketHandle.handleIndex;
        this.socket = socket;
        this.isAlive = true;
        this.lastPing = new Date();
        this.socket.on('pong', () => {
            this.isAlive = true;
        });
    }
    setUser(user) {
        if (user) {
            this.user = user;
        }
        else {
            throw new Error("cannot set user to null" + JSON.stringify(this.user));
        }
    }
    terminate() {
        this.socket.terminate();
    }
    ping() {
        this.socket.ping('', undefined, true);
    }
    send(data) {
        try {
            if (data instanceof DataContainer_1.DataContainer) {
                data = protobuf_config_1.default.serialize(data, 'DataContainer');
            }
            try {
                this.socket.send(data);
            }
            catch (e) {
                logger.info(`error sending to user:${this.user.screenName}:${this.id} ${(0, util_1.inspect)(e)}`);
                this.onerror();
            }
        }
        catch (e) {
            logger.error(`error serialize :${this.user.screenName}:${this.id} data:${(0, util_1.inspect)(data)}` + e);
        }
    }
    sendError(msg) {
        let data = new DataContainer_1.DataContainer();
        data.error = new DataContainer_1.PokerError();
        data.error.message = msg;
        this.send(data);
    }
    async sendUserData(user, dataRepository, initialData = true) {
        let data = new DataContainer_1.DataContainer();
        data.user = await (0, helpers_1.getUserData)(user, dataRepository, initialData);
        this.send(data);
    }
}
exports.WebSocketHandle = WebSocketHandle;
WebSocketHandle.handleIndex = 0;
//# sourceMappingURL=WebSocketHandle.js.map