"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bootstrapper = void 0;
const MailchimpService_1 = require("./services/MailchimpService");
const ExchangeRatesService_1 = require("./services/ExchangeRatesService");
const TournamentLogic_1 = require("./handlers/TournamentLogic");
const protobuf_config_1 = __importDefault(require("../../poker.ui/src/shared/protobuf-config"));
const poker_processor_1 = require("./poker-processor");
const ExchangeRatesChangedHandler_1 = require("./services/ExchangeRatesChangedHandler");
const RequestHandlerInit_1 = require("./RequestHandlerInit");
const ApiEndpoints_1 = require("./ApiEndpoints");
var logger = require('log4js').getLogger();
const environment_1 = __importDefault(require("./environment"));
const AdminSecureSocketService_1 = require("./admin/AdminSecureSocketService");
const GameServerProcessor_1 = require("./admin/processor/GameServerProcessor");
const AccountFundedHandler_1 = require("./admin/handlers/AccountFundedHandler");
const GetPaymentsResultHandler_1 = require("./admin/handlers/GetPaymentsResultHandler");
const AwardPrizesHandler_1 = require("./admin/processor/handlers/AwardPrizesHandler");
const TimerProvider_1 = require("./model/table/TimerProvider");
const ManualFundAccountHandler_1 = require("./admin/processor/handlers/ManualFundAccountHandler");
const EmailSender_1 = require("./email/EmailSender");
const telegram_service_1 = require("./framework/telegram/telegram.service");
const DepositAddressService_1 = require("./services/DepositAddressService");
const DefaultTableConfig_1 = __importDefault(require("./model/table/DefaultTableConfig"));
const DefaultCurrencyConfig_1 = __importDefault(require("./model/table/DefaultCurrencyConfig"));
class Bootstrapper {
    constructor() {
        this.emailSender = new EmailSender_1.EmailSender();
        this.telegramService = new telegram_service_1.TelegramService();
    }
    async run(dataRepository) {
        await dataRepository.init();
        await dataRepository.createNextUserDocument();
        await protobuf_config_1.default.init();
        let tableConfig = await dataRepository.getTablesConfig();
        if (!tableConfig.length) {
            logger.info(`no tables, adding default...`);
            for (let config of DefaultTableConfig_1.default) {
                await dataRepository.saveTableConfig(config);
            }
            for (let config of DefaultCurrencyConfig_1.default) {
                await dataRepository.saveCurrencyConfig(config);
            }
        }
        this.pokerProcessor = new poker_processor_1.PokerProcessor(dataRepository);
        let gameServerProcessor = new GameServerProcessor_1.GameServerProcessor();
        let mailchimpService = new MailchimpService_1.MailchimpService();
        const accountFundedHandler = new AccountFundedHandler_1.AccountFundedHandler(this.pokerProcessor, dataRepository);
        this.gameServerProcessor = gameServerProcessor;
        this.exchangeRatesService = new ExchangeRatesService_1.ExchangeRatesService(dataRepository, new ExchangeRatesChangedHandler_1.ExchangeRatesChangedHandler(this.pokerProcessor, this.pokerProcessor));
        this.depositAddressService = new DepositAddressService_1.DepositAddressService();
        this.tournamentLogic = new TournamentLogic_1.TournamentLogic(dataRepository, this.pokerProcessor, (p) => new TimerProvider_1.TimerProvider(p), gameServerProcessor, this.emailSender, mailchimpService);
        this.tournamentLogic.sendOfflinePlayersEmail = !environment_1.default.debug;
        this.connectionToPaymentServer = new AdminSecureSocketService_1.AdminSecureSocketService(this.pokerProcessor, dataRepository, this.exchangeRatesService, gameServerProcessor);
        gameServerProcessor.addHandler(accountFundedHandler);
        gameServerProcessor.addHandler(new GetPaymentsResultHandler_1.GetPaymentsResultHandler(accountFundedHandler, dataRepository));
        gameServerProcessor.addHandler(new AwardPrizesHandler_1.AwardPrizesHandler(dataRepository, accountFundedHandler, this.connectionToPaymentServer));
        gameServerProcessor.addHandler(new ManualFundAccountHandler_1.ManualFundAccountHandler(dataRepository, accountFundedHandler, this.connectionToPaymentServer));
        new RequestHandlerInit_1.RequestHandlerInit().init(dataRepository, this.pokerProcessor, this.tournamentLogic, this.connectionToPaymentServer, this.depositAddressService);
        await this.exchangeRatesService.startPolling();
        await this.pokerProcessor.init();
        const numTables = this.pokerProcessor.getTables().length;
        logger.info(`loaded ${numTables} tables`);
        await this.tournamentLogic.init();
        this.pokerProcessor.tournamentLogic = this.tournamentLogic;
        this.apiEndpoints = new ApiEndpoints_1.ApiEndpoints(dataRepository, this.pokerProcessor, this.connectionToPaymentServer, this.gameServerProcessor);
        this.pokerProcessor.connectionToPaymentServer = this.connectionToPaymentServer;
        this.apiEndpoints.setup();
        setInterval(this.runChecks.bind(this), 20000);
        this.tournamentLogic.startTimer();
    }
    runChecks() {
        if (!environment_1.default.debug) {
            try {
                this.pokerProcessor.pingClients();
            }
            catch (e) {
                logger.error(e);
            }
        }
        try {
            this.pokerProcessor.checkIdlePlayers();
        }
        catch (ex) {
            logger.error(ex);
        }
    }
}
exports.Bootstrapper = Bootstrapper;
//# sourceMappingURL=Bootstrapper.js.map