import { Bootstrapper } from './Bootstrapper';
import environment from './environment';
import { DataRepository } from "./services/documents/DataRepository";

import { Logger, getLogger } from "log4js";
var logger:Logger = getLogger();
import config from './config';
import { configureLogging } from './framework/log4jsInit';
import dotenv from 'dotenv';
import sg = require('@sendgrid/mail')
const dataRepository = new DataRepository(process.env.POKER_DB_NAME || 'PokerGameServer');
const result = dotenv.config();
import 'source-map-support/register'

for(let envVar of [ 
  { key:"POKER_FROM_EMAIL", value:process.env.POKER_FROM_EMAIL  } ,
  { key:"POKER_SENDGRID_API_KEY", value:process.env.POKER_SENDGRID_API_KEY  } ,  
  { key:"POKER_K1", value:process.env.POKER_K1  } ,  
  { key:"POKER_HMAC_KEY", value:process.env.POKER_HMAC_KEY  } ,  
  
]){
  if(!envVar.value){
    let errMsg = `${envVar.key} not defined!`;
    if(result.error){
      errMsg += ` dotEnv error: ${result.error.message}`
    }
    console.log(errMsg)
    process.exit(1);
  }
}
if(!environment.debug){
  if(!process.env.POKER_BASE_ADDRESS){
    console.log(`POKER_BASE_ADDRESS not defined!`);
    process.exit(1);
  }
  if(!process.env.POKER_CDN){
    console.warn(`POKER_CDN not defined. using POKER_BASE_ADDRESS`);
    process.env.POKER_CDN = process.env.POKER_BASE_ADDRESS;
  }
}
if(!process.env.POKER_SITE_NAME){
  console.warn(`POKER_SITE_NAME not defined. using default`);
  process.env.POKER_SITE_NAME = 'poker.site';
}


let configureProdAppenders = (appenders:any, defaultAppenders:any[])=>{
  
  appenders.telegramAppender = {
    type: 'framework/telegram/telegramAppender'                
  };
  defaultAppenders.push('telegramAppender');         
}
sg.setApiKey(process.env.POKER_SENDGRID_API_KEY);

configureLogging(environment, configureProdAppenders, __dirname, environment.debug);


logger.info(`app started. version:${environment.version}. debug:${environment.debug}`);
config.baseAddress = environment.debug ? 'http://3.126.18.118:9000' : process.env.POKER_BASE_ADDRESS;

process.on('uncaughtException', (err: any) => { logger.error('uncaughtException', err); });
process.on("unhandledRejection", (reason: any) => { 
  logger.error('unhandledRejection', reason); 
});

(async ()=>{
  new Bootstrapper().run(dataRepository);  
}
)()



