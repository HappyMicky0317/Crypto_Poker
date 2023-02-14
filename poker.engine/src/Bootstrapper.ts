import { MailchimpService } from './services/MailchimpService';
import { DataRepository } from './services/documents/DataRepository';
import { ExchangeRatesService } from "./services/ExchangeRatesService";
import { AdminServer } from "./admin/AdminServer";
import { TournamentLogic } from "./handlers/TournamentLogic";
import protobufConfig from "../../poker.ui/src/shared/protobuf-config";
import { PokerProcessor } from "./poker-processor";
import { ExchangeRatesChangedHandler } from "./services/ExchangeRatesChangedHandler";
import { RequestHandlerInit } from "./RequestHandlerInit";
import { User } from "./model/User";
import { ApiEndpoints } from "./ApiEndpoints";

var logger = require('log4js').getLogger();
import environment from './environment';
import { AdminSecureSocketService } from './admin/AdminSecureSocketService';
import { GameServerProcessor } from './admin/processor/GameServerProcessor';
import { AccountFundedHandler } from './admin/handlers/AccountFundedHandler';
import { GetPaymentsResultHandler } from './admin/handlers/GetPaymentsResultHandler';
import { AwardPrizesHandler } from './admin/processor/handlers/AwardPrizesHandler';
import { TableProcessor } from './admin/processor/table-processor/TableProcessor';
import { TimerProvider } from './model/table/TimerProvider';
import { ManualFundAccountHandler } from './admin/processor/handlers/ManualFundAccountHandler';
import { IEmailSender } from './email/IEmailSender';
import { EmailSender } from './email/EmailSender';
import { ITelegramService } from './framework/telegram/ITelegramService';
import { TelegramService } from './framework/telegram/telegram.service';
import { IDataRepository } from './services/documents/IDataRepository';
import { RegisterRequestHandler } from './handlers/RegisterRequestHandler';
import { DepositAddressService } from './services/DepositAddressService';
import defaultTableConfigs from './model/table/DefaultTableConfig'
import defaultCurrencyConfigs from './model/table/DefaultCurrencyConfig'

export class Bootstrapper {
    exchangeRatesService: ExchangeRatesService;
    adminServer: AdminServer;
    tournamentLogic: TournamentLogic;
    
    pokerProcessor: PokerProcessor;
    apiEndpoints:ApiEndpoints;
    connectionToPaymentServer:AdminSecureSocketService;
    gameServerProcessor:GameServerProcessor;
    emailSender:IEmailSender = new EmailSender();
    telegramService:ITelegramService = new TelegramService();
    depositAddressService:DepositAddressService;

    async run(dataRepository:DataRepository): Promise<void> {
        
        await dataRepository.init();
        await dataRepository.createNextUserDocument();
        await protobufConfig.init();        

        let tableConfig = await dataRepository.getTablesConfig();  
        if(!tableConfig.length){
            logger.info(`no tables, adding default...`);
            for(let config of defaultTableConfigs){
                await dataRepository.saveTableConfig(config)
            }  
            for(let config of defaultCurrencyConfigs){
                await dataRepository.saveCurrencyConfig(config)
            }      
        }
        this.pokerProcessor = new PokerProcessor(dataRepository);
        let gameServerProcessor = new GameServerProcessor();                
        let mailchimpService = new MailchimpService();                
        const accountFundedHandler = new AccountFundedHandler(this.pokerProcessor, dataRepository);                
        this.gameServerProcessor = gameServerProcessor;
        this.exchangeRatesService = new ExchangeRatesService(dataRepository, new ExchangeRatesChangedHandler(this.pokerProcessor, this.pokerProcessor));
        this.depositAddressService = new DepositAddressService();
        this.tournamentLogic = new TournamentLogic(dataRepository, this.pokerProcessor, (p:TableProcessor)=> new TimerProvider(p), gameServerProcessor, this.emailSender, mailchimpService);                
        this.tournamentLogic.sendOfflinePlayersEmail = !environment.debug; 
        this.connectionToPaymentServer  = new AdminSecureSocketService(this.pokerProcessor, dataRepository, this.exchangeRatesService, gameServerProcessor);
        gameServerProcessor.addHandler(accountFundedHandler)
        gameServerProcessor.addHandler(new GetPaymentsResultHandler(accountFundedHandler, dataRepository))
        gameServerProcessor.addHandler(new AwardPrizesHandler(dataRepository, accountFundedHandler, this.connectionToPaymentServer))
        gameServerProcessor.addHandler(new ManualFundAccountHandler(dataRepository, accountFundedHandler, this.connectionToPaymentServer))
        new RequestHandlerInit().init(dataRepository, this.pokerProcessor, this.tournamentLogic, this.connectionToPaymentServer, this.depositAddressService);
        await this.exchangeRatesService.startPolling()
        await this.pokerProcessor.init();
        const numTables = this.pokerProcessor.getTables().length;        
        logger.info(`loaded ${numTables} tables`);
        await this.tournamentLogic.init();
        this.pokerProcessor.tournamentLogic = this.tournamentLogic;
        
        this.apiEndpoints = new ApiEndpoints(dataRepository, this.pokerProcessor, this.connectionToPaymentServer, this.gameServerProcessor);
        this.pokerProcessor.connectionToPaymentServer = this.connectionToPaymentServer;
        this.apiEndpoints.setup();
        
        
        setInterval(this.runChecks.bind(this), 20000);
        this.tournamentLogic.startTimer();
    }

    // async fixGravatar(dataRepository:IDataRepository){
    //     for(let u1 of await dataRepository.getUsers('', 100000)){    
    //         if((<any>u1).email){
    //           let user = await dataRepository.getUser(u1.guid);
    //           let gravatar = await new RegisterRequestHandler(dataRepository).getGravatar(user.email)
    //           if(user.gravatar != gravatar){
    //             console.log(`db.getCollection('users').update({screenName:"${user.screenName}"}, {$set: {gravatar:null}} );`);
    //             await dataRepository.saveUser(user);
    //           }else{
    //               //console.log(`gravatar matches for user ${user.screenName}`);
    //           }
    //         }
            
    //       }
    // }

    runChecks() {


        if (!environment.debug) {
            try {
                this.pokerProcessor.pingClients();
            } catch (e) {
                logger.error(e);
            }
        }

        try {
            this.pokerProcessor.checkIdlePlayers();
        } catch (ex) {
            logger.error(ex);
        }
     
    }
}