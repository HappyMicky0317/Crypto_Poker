"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractProcessor = void 0;
const promise_queue_timeout_1 = __importDefault(require("promise-queue-timeout"));
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const util_1 = require("util");
class AbstractProcessor {
    constructor(tResultType, timeoutMs) {
        this.tResultType = tResultType;
        this.timeoutMs = timeoutMs;
        this.queue = new promise_queue_timeout_1.default(1, Infinity, { timeout: this.timeoutMs || 30000 });
        this.handlers = {};
    }
    addHandler(handler) {
        this.handlers[handler.typeName] = handler;
    }
    log(message) {
        logger.info(`${this.constructor.name} ${Object.keys(message)} ${this.getQueueLog()}`);
    }
    getQueueLog() {
        return `PendingLength: ${this.queue.getPendingLength()} QueueLength: ${this.queue.getQueueLength()}`;
    }
    sendMessage(message) {
        this.log(message);
        return this.queue.add(() => {
            return this.handleMessage(message)
                .catch((e) => {
                let result = new this.tResultType();
                let errStack = '';
                if (e != null && (e.message || e.stack)) {
                    errStack = `${e.message} ${e.stack}`;
                }
                else {
                    errStack = e.toString();
                }
                result.error = `error handling message ${(0, util_1.inspect)(message)}: ${errStack}`;
                logger.error(result.error);
                return result;
            });
        }).catch((err) => {
            let result = new this.tResultType();
            result.error = (0, util_1.inspect)(err) + ' ' + (0, util_1.inspect)(message);
            logger.error(result.error);
            return result;
        });
    }
    async handleMessage(message) {
        for (let key in message) {
            let handler = this.handlers[key];
            if (handler != null) {
                return await handler.run(message);
            }
        }
        return Promise.reject('no message handlers for message');
    }
}
exports.AbstractProcessor = AbstractProcessor;
//# sourceMappingURL=AbstractProcessor.js.map