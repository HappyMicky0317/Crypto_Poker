import { WebServer } from "./webserver/web-server";
import { SecureDataRepository } from "./repository/SecureDataRepository";
import environment from './environment';
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();
import { configureLogging } from '../../poker.engine/src/framework/log4jsInit';
import { TelegramService } from "../../poker.engine/src/framework/telegram/telegram.service"
import { BlockCypherService } from "./services/BlockCypherService";
import { AccountService } from "./services/AccountService";
import { EthBlockService } from "./services/EthBlockService";
import { ParityModule } from "./services/parity-module";
import { PaymentProcessor } from "./processor/PaymentProcessor";
const Web3 = require('web3');
var bitcore = require('@dashevo/dashcore-lib');
var HDPublicKey = bitcore.HDPublicKey;
import dotenv from 'dotenv';
import { CheckWithdrawlsHandler } from "./processor/CheckWithdrawlsHandler";
import { IncomingPaymentEventHandler } from "./processor/IncomingPaymentEventHandler";
import { BlockCypherPaymentEventHandler } from "./webserver/handlers/BlockCypherPaymentEventHandler";
import { PaymentProcessorMessage } from "./processor/PaymentProcessorMessage";
import { ProcessWithdrawlsHandler } from "./processor/ProcessWithdrawlsHandler";
import { ManualApprovalRequestHandler } from "./processor/ManualApprovalRequestHandler";
import { to } from "../../poker.engine/src/shared-helpers";
import 'source-map-support/register'
import { configure } from "../../poker.engine/src/framework/telegram/telegramAppender"; //do not delete. is referenced below by setupLogging
import { CancelPaymentRequestHandler } from "./processor/CancelPaymentRequestHandler";
import { CheckDepositAddressesHandler } from "./processor/CheckDepositAddressesHandler";
import { DepositAddressTrigger } from "../../poker.engine/src/admin/model/outgoing/DepositAddressTrigger";
import { IBlockChainService } from "./services/IBlockChainService";
import { BtcBlockService } from "./services/BtcBlockService";
import { DashCoreBlockService } from "./services/DashCoreBlockService";
import { Http } from "../../poker.engine/src/services/Http";

export class PaymentProcessorBootstrapper {
    blockCypherService!: BlockCypherService;
    accountService!: AccountService;
    processor: PaymentProcessor;
    ethBlockService:EthBlockService;
    
    async run() {        
        const result = dotenv.config()
        for(let envVar of [ 
            { key:"POKER_ADMIN_BASE64", value:process.env.POKER_ADMIN_BASE64  },                              
            { key:"POKER_PARITY_API_IP", value:process.env.POKER_PARITY_API_IP  } ,
            { key:"POKER_K1", value:process.env.POKER_K1  } ,            
            { key:"POKER_TELEGRAM_ADMIN_CHANNEL", value:process.env.POKER_TELEGRAM_ADMIN_CHANNEL  } ,            
            { key:"POKER_TELEGRAM_ADMIN_BOT_TOKEN", value:process.env.POKER_TELEGRAM_ADMIN_BOT_TOKEN  } ,            
            { key:"POKER_UNLOCK_WALLET", value:process.env.POKER_UNLOCK_WALLET  } ,            
            { key:"POKER_BASE_ADDRESS", value:process.env.POKER_BASE_ADDRESS  } ,            
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

        this.setupLogging();
        process.on('uncaughtException', (err: any) => { logger.error('uncaughtException', err); });
        process.on("unhandledRejection", (reason: any) => { logger.error('unhandledRejection', reason); });
        logger.info(`app started. version:${environment.version}. debug:${environment.debug} POKER_MONGODB:${process.env.POKER_MONGODB}`);   
        const http = new Http();
        this.processor = new PaymentProcessor();   
        let dataRepository = new SecureDataRepository(process.env.POKER_PAYMENT_SERVER_DB_NAME || 'PokerPaymentServer');
        this.blockCypherService = new BlockCypherService(dataRepository, null);
        this.ethBlockService = new EthBlockService(dataRepository, Web3, this.processor, new ParityModule());
        let dashCoreBlockService = new DashCoreBlockService(dataRepository); 
        let services:IBlockChainService[] =[
            dashCoreBlockService,
            this.ethBlockService,
            new BtcBlockService(dataRepository, this.blockCypherService),
        ]
        this.accountService = new AccountService(this.blockCypherService, dataRepository, services);        
             
        
        await dataRepository.init();        
        await this.accountService.init();
        let blockCypherPaymentEventHandler = new BlockCypherPaymentEventHandler(dataRepository, this.accountService, this.blockCypherService, this.processor);
        let webServer = new WebServer(dataRepository, this.processor, this.accountService, blockCypherPaymentEventHandler)        
        this.accountService.connectionToGameServer = webServer.connectionToGameServer;
        let telegramService = new TelegramService();
        this.processor.addHandler(new CheckWithdrawlsHandler(dataRepository, http, telegramService));
        this.processor.addHandler(new IncomingPaymentEventHandler(this.accountService, dataRepository));
        this.processor.addHandler(new ProcessWithdrawlsHandler(this.accountService, dataRepository, webServer.connectionToGameServer, http));
        this.processor.addHandler(new ManualApprovalRequestHandler(this.accountService, dataRepository, webServer.connectionToGameServer));
        this.processor.addHandler(new CancelPaymentRequestHandler(dataRepository, webServer.connectionToGameServer));
        this.processor.addHandler(new CheckDepositAddressesHandler(dataRepository, http, this.accountService));

        webServer.init();
        setInterval(this.runChecks.bind(this), 60000);   
          
        //telegramService.sendTelegram(`test`)        
    }

    setupLogging(){
        let configureProdAppenders = (appenders:any, defaultAppenders:any[])=>{   
            appenders.telegramAppender = {
                type: '../../poker.engine/src/framework/telegram/telegramAppender'                                            
              };
              defaultAppenders.push('telegramAppender');         
            };
        configureLogging(environment, configureProdAppenders, __dirname, true);
    }

    runChecks() {

        {
            let message = new PaymentProcessorMessage();
            message.processWithdrawls = {}
            this.processor.sendMessage(message)
        }        

        try {
            if (!process.env.POKER_DISABLE_ETH) {
                this.ethBlockService.runChecks();
            }
        } catch (ex) {
            logger.error(ex);
        }

    }

}

(async () => {
    let app = new PaymentProcessorBootstrapper();
    const [ err ] = await to(app.run());
    if(err){
        logger.error(err);
    }
})();
