import { Logger, getLogger, configure as log4jsCconfigure } from "log4js";
const logger: Logger = getLogger();
const fs = require('fs');

export function configureLogging(environment: { debug: boolean, version: string }, configureProdAppenders: (appenders:any, defaultAppenders:any[])=>void, rootDir:string, logToConsole:boolean): void {
    
    const appenders: any = {
        fileAppender: { type: 'file', filename: 'application.log', default: true }
    }
    const defaultAppenders = ['fileAppender'];
    if(logToConsole){
        appenders.console = { type: 'console' };
        defaultAppenders.push('console');
    }
    if (environment.debug) {
        environment.version = 'dev';        
    } else {
        configureProdAppenders(appenders,defaultAppenders);
        environment.version = fs.readFileSync(`${rootDir}/.version`, 'utf8').trim();
    }
    

    log4jsCconfigure({
        appenders: appenders,
        categories: { default: { appenders: defaultAppenders, level: 'info' } }
    });
    logger.level = 'info';
}