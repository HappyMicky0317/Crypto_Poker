import { TelegramService } from "./telegram.service";
import { escapeHtml } from "../../shared-helpers";

var os = require('os');
export function customAppender() {
    const telegramService = new TelegramService();
    return async function (loggingEvent: any) {
        if (loggingEvent && loggingEvent.level.level >= 30000) {
            var host = os.hostname() + ':: ';
            var text = host + '' + (loggingEvent.data.length > 1 && loggingEvent.data[1].stack ? loggingEvent.data[1].stack : loggingEvent.data);            
            telegramService.sendTelegram(escapeHtml(text))
        }
    };
}

export function configure() {
    return customAppender();
}