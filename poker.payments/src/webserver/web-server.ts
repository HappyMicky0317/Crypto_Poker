import express from 'express'
var cors = require('cors');
var bodyParser = require('body-parser');
var expressValidator  = require('express-validator');       // https://npmjs.org/package/express-validator
import { DepositAddressesController } from './deposit-addresses.controller';
import { ISecureDataRepository } from '../repository/ISecureDataRepository';
import { SocketConnection } from './SocketConnection';
import { Logger, getLogger } from "log4js";
import { DashTxController } from './dash-tx.controller';
import { CurrencyConfigController } from './currency-config.controller';
import { AccountService, IAccountService } from '../services/AccountService';
import { PaymentProcessor } from '../processor/PaymentProcessor';
import { SendCurrencyConfigHandler } from './handlers/SendCurrencyConfigHandler';
import { EthBlockService } from '../services/EthBlockService';
import { CheckWithdrawlsHandler } from '../processor/CheckWithdrawlsHandler';
import { PaymentProcessorMessage } from '../processor/PaymentProcessorMessage';
import { BlockCypherPaymentEventHandler } from './handlers/BlockCypherPaymentEventHandler';
import { GetPaymentsRequestHandler } from './handlers/GetPaymentsRequestHandler';
import { PaymentsController } from './payments.controller';
import { DashCoreBlockService } from '../services/DashCoreBlockService';
import { RemoteAuthController } from './RemoteAuthController';

const logger: Logger = getLogger();

export class WebServer {
    connectionToGameServer:SocketConnection;
    sendCurrencyConfigHandler:SendCurrencyConfigHandler;        

    constructor(private dataRepository:ISecureDataRepository, private processor:PaymentProcessor, private accountService:IAccountService, private blockCypherPaymentEventHandler:BlockCypherPaymentEventHandler){
        let getPaymentsRequestHandler = new GetPaymentsRequestHandler(dataRepository, null);
        this.connectionToGameServer = new SocketConnection(processor, this.onConnectionToGameServerOpened.bind(this), blockCypherPaymentEventHandler, getPaymentsRequestHandler);
        getPaymentsRequestHandler.connectionToGameServer = this.connectionToGameServer;
        this.sendCurrencyConfigHandler = new SendCurrencyConfigHandler(dataRepository, this.connectionToGameServer);                
    }
    init(){
        const app: express.Application = express();
        app.use(cors({origin: '*'}));
        app.use(bodyParser.json());
        app.use(expressValidator());// Form validation - This line must be immediately after bodyParser
        const port: number = 8113;

        app.use('/deposit-addresses', new DepositAddressesController(this.dataRepository).router);
        app.use('/dashd-tx-callback', new DashTxController(this.dataRepository, this.processor, new DashCoreBlockService(this.dataRepository)).router);
        app.use('/currency-config', new CurrencyConfigController(this.dataRepository, this.sendCurrencyConfigHandler, this.accountService).router);
        app.use('/payments', new PaymentsController(this.dataRepository, this.processor).router);
        app.use('/remoteAuth', new RemoteAuthController(this.dataRepository, this.processor).router);

        app.listen(port, () => {
            logger.info(`Payment Server listening on http://0.0.0.0:${port}/`);
        });

        
        this.connectionToGameServer.init();
    }

    onConnectionToGameServerOpened(){
        this.sendCurrencyConfigHandler.run()                
        this.processor.sendCheckWithdrawls()
        this.processor.sendCheckDepositAddresses()
    }
}