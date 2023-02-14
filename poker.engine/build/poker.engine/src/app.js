"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Bootstrapper_1 = require("./Bootstrapper");
const environment_1 = __importDefault(require("./environment"));
const DataRepository_1 = require("./services/documents/DataRepository");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
const config_1 = __importDefault(require("./config"));
const log4jsInit_1 = require("./framework/log4jsInit");
const dotenv_1 = __importDefault(require("dotenv"));
const sg = require("@sendgrid/mail");
const dataRepository = new DataRepository_1.DataRepository(process.env.POKER_DB_NAME || 'PokerGameServer');
const result = dotenv_1.default.config();
require("source-map-support/register");
for (let envVar of [
    { key: "POKER_FROM_EMAIL", value: process.env.POKER_FROM_EMAIL },
    { key: "POKER_SENDGRID_API_KEY", value: process.env.POKER_SENDGRID_API_KEY },
    { key: "POKER_K1", value: process.env.POKER_K1 },
    { key: "POKER_HMAC_KEY", value: process.env.POKER_HMAC_KEY },
]) {
    if (!envVar.value) {
        let errMsg = `${envVar.key} not defined!`;
        if (result.error) {
            errMsg += ` dotEnv error: ${result.error.message}`;
        }
        console.log(errMsg);
        process.exit(1);
    }
}
if (!environment_1.default.debug) {
    if (!process.env.POKER_BASE_ADDRESS) {
        console.log(`POKER_BASE_ADDRESS not defined!`);
        process.exit(1);
    }
    if (!process.env.POKER_CDN) {
        console.warn(`POKER_CDN not defined. using POKER_BASE_ADDRESS`);
        process.env.POKER_CDN = process.env.POKER_BASE_ADDRESS;
    }
}
if (!process.env.POKER_SITE_NAME) {
    console.warn(`POKER_SITE_NAME not defined. using default`);
    process.env.POKER_SITE_NAME = 'poker.site';
}
let configureProdAppenders = (appenders, defaultAppenders) => {
    appenders.telegramAppender = {
        type: 'framework/telegram/telegramAppender'
    };
    defaultAppenders.push('telegramAppender');
};
sg.setApiKey(process.env.POKER_SENDGRID_API_KEY);
(0, log4jsInit_1.configureLogging)(environment_1.default, configureProdAppenders, __dirname, environment_1.default.debug);
logger.info(`app started. version:${environment_1.default.version}. debug:${environment_1.default.debug}`);
config_1.default.baseAddress = environment_1.default.debug ? 'http://3.126.18.118:9000' : process.env.POKER_BASE_ADDRESS;
process.on('uncaughtException', (err) => { logger.error('uncaughtException', err); });
process.on("unhandledRejection", (reason) => {
    logger.error('unhandledRejection', reason);
});
(async () => {
    new Bootstrapper_1.Bootstrapper().run(dataRepository);
})();
//# sourceMappingURL=app.js.map