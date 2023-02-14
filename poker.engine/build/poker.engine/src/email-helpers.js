"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStandardTemplateEmail = exports.sendStandardTemplateEmail = void 0;
const email_sender_1 = require("./email/email-sender");
var fs = require('fs');
async function sendStandardTemplateEmail(email, subject, details) {
    await (0, email_sender_1.sendEmail)(email, subject, await getStandardTemplateEmail(details));
}
exports.sendStandardTemplateEmail = sendStandardTemplateEmail;
async function getStandardTemplateEmail(details) {
    const templateName = 'standard_template.html';
    const filename = `${__dirname}/email/${templateName}`;
    if (!fs.existsSync(filename)) {
        const source = `${__dirname}/../../../src/email/${templateName}`;
        await copySync(source, filename);
    }
    if (!fs.existsSync(filename)) {
        console.error(`could not find ${filename}`);
    }
    let html = fs.readFileSync(filename, 'utf8');
    html = html.replace('{details}', details);
    html = html.replace(/{poker_site_name}/g, process.env.POKER_SITE_NAME);
    html = html.replace('{year}', new Date().getFullYear());
    html = html.replace('{cdn}', process.env.POKER_CDN);
    return html;
}
exports.getStandardTemplateEmail = getStandardTemplateEmail;
function copySync(source, dest) {
    return new Promise((resolve, reject) => {
        fs.copyFile(source, dest, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
//# sourceMappingURL=email-helpers.js.map