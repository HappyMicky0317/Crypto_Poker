"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailSender = void 0;
const email_sender_1 = require("./email-sender");
class EmailSender {
    sendEmail(to, subject, html, text, fromEmail, bccs) {
        return (0, email_sender_1.sendEmail)(to, subject, html, text, fromEmail, bccs);
    }
}
exports.EmailSender = EmailSender;
//# sourceMappingURL=EmailSender.js.map