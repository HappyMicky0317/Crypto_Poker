"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configure = exports.customAppender = void 0;
const telegram_service_1 = require("./telegram.service");
const shared_helpers_1 = require("../../shared-helpers");
var os = require('os');
function customAppender() {
    const telegramService = new telegram_service_1.TelegramService();
    return async function (loggingEvent) {
        if (loggingEvent && loggingEvent.level.level >= 30000) {
            var host = os.hostname() + ':: ';
            var text = host + '' + (loggingEvent.data.length > 1 && loggingEvent.data[1].stack ? loggingEvent.data[1].stack : loggingEvent.data);
            telegramService.sendTelegram((0, shared_helpers_1.escapeHtml)(text));
        }
    };
}
exports.customAppender = customAppender;
function configure() {
    return customAppender();
}
exports.configure = configure;
//# sourceMappingURL=telegramAppender.js.map