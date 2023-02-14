"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const log4js_1 = require("log4js");
const Http_1 = require("../../services/Http");
const shared_helpers_1 = require("../../shared-helpers");
var logger = (0, log4js_1.getLogger)();
const http = new Http_1.Http();
class TelegramService {
    async sendTelegram(text, chatId) {
        chatId = chatId || process.env.POKER_TELEGRAM_ADMIN_CHANNEL;
        let body = {
            "chat_id": chatId,
            "text": text,
            "disable_web_page_preview": true,
            "parse_mode": "HTML"
        };
        let token = process.env.POKER_TELEGRAM_ADMIN_BOT_TOKEN;
        let url = `https://api.telegram.org/bot${token}/sendMessage`;
        let sent = true;
        let result = await http.post(url, { body: body })
            .catch((e) => {
            console.error(e);
            (0, shared_helpers_1.logToFile)('application.log', `TelegramService! ${e}`);
            sent = false;
        });
        return sent;
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=telegram.service.js.map