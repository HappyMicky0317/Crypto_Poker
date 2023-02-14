"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLogging = void 0;
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const fs = require('fs');
function configureLogging(environment, configureProdAppenders, rootDir, logToConsole) {
    const appenders = {
        fileAppender: { type: 'file', filename: 'application.log', default: true }
    };
    const defaultAppenders = ['fileAppender'];
    if (logToConsole) {
        appenders.console = { type: 'console' };
        defaultAppenders.push('console');
    }
    if (environment.debug) {
        environment.version = 'dev';
    }
    else {
        configureProdAppenders(appenders, defaultAppenders);
        environment.version = fs.readFileSync(`${rootDir}/.version`, 'utf8').trim();
    }
    (0, log4js_1.configure)({
        appenders: appenders,
        categories: { default: { appenders: defaultAppenders, level: 'info' } }
    });
    logger.level = 'info';
}
exports.configureLogging = configureLogging;
//# sourceMappingURL=log4jsInit.js.map