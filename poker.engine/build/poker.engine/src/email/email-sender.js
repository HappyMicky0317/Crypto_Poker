"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const sg = require("@sendgrid/mail");
let sendgridOptions = {};
sendgridOptions.auth = {};
sendgridOptions.auth.api_key = process.env.POKER_SENDGRID_API_KEY;
function sendEmail(to, subject, html, text, fromEmail, bccs) {
    const msg = {
        bcc: bccs,
        from: fromEmail || process.env.POKER_SITE_NAME + ' <' + process.env.POKER_FROM_EMAIL + '>',
        subject: subject
    };
    if (to) {
        msg.to = to;
    }
    if (html) {
        msg.html = html;
    }
    if (text) {
        msg.text = text;
    }
    return new Promise((resolve, reject) => {
        sg.send(msg, false, (err) => {
            if (err) {
                reject('@sendgrid/mail: ' + err);
            }
            else {
                resolve('');
            }
        }).catch((err) => {
            reject('@sendgrid/mail: ' + err);
        });
    });
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=email-sender.js.map