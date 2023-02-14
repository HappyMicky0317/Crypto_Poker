"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IConnectionToPaymentServer = exports.AdminSecureSocketService = void 0;
const WebSocket = require("ws");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
const helpers_1 = require("../helpers");
const GetDepositAddressResultHandler_1 = require("./handlers/GetDepositAddressResultHandler");
const AccountWithdrawlResultHandler_1 = require("./handlers/AccountWithdrawlResultHandler");
const ping_1 = require("./model/incoming/ping");
const pong_1 = require("./model/outgoing/pong");
const CurrencyConfigData_1 = require("./model/incoming/CurrencyConfigData");
const CurrencyConfigDataHandler_1 = require("./handlers/CurrencyConfigDataHandler");
const GetDepositAddressResult_1 = require("./model/incoming/GetDepositAddressResult");
const AccountFundedResult_1 = require("../model/AccountFundedResult");
const AccountWithdrawlResultInternal_1 = require("../model/AccountWithdrawlResultInternal");
const GetPaymentsRequest_1 = require("./model/outgoing/GetPaymentsRequest");
const GetPaymentsResult_1 = require("./model/incoming/GetPaymentsResult");
const shared_helpers_1 = require("../shared-helpers");
const GameServerProcessorMessage_1 = require("./processor/GameServerProcessorMessage");
const util_1 = require("util");
class AdminSecureSocketService {
    constructor(broadcastService, dataRepository, exchangeRatesService, processor) {
        this.broadcastService = broadcastService;
        this.dataRepository = dataRepository;
        this.exchangeRatesService = exchangeRatesService;
        this.processor = processor;
    }
    async onConnection(socket, httpReq) {
        this.socket = socket;
        logger.info(`admin socket connection from ${(0, helpers_1.getIpAddress)(socket, httpReq)}`);
        await this.sendGetPaymentsSince();
        socket.on('message', async (m) => {
            (0, shared_helpers_1.logToFile)('incoming.log', m);
            try {
                let message = JSON.parse(m);
                logger.info(`game server received: ${message.type}`);
                await this.handleMessage(message.type, message.data);
            }
            catch (e) {
                logger.error(e);
            }
        });
        socket.on('close', () => {
            logger.info("AdminSecureSocketService: close");
        });
        socket.on('error', (e) => {
            logger.info(`AdminSecureSocketService: error ${e}`);
        });
    }
    async sendGetPaymentsSince() {
        let lastPayment = await this.dataRepository.getLastPaymentUpdate();
        let lastUpdated = null;
        if (lastPayment != null) {
            lastUpdated = lastPayment.updated;
        }
        logger.info(`LastIncomingPayment:${lastUpdated}`);
        this.send(new GetPaymentsRequest_1.GetPaymentsRequest(lastUpdated));
    }
    send(message) {
        if (this.socket != null && this.socket.readyState == WebSocket.OPEN) {
            let data = JSON.stringify({ type: message.constructor.name, data: message });
            (0, shared_helpers_1.logToFile)('outgoing.log', data);
            this.socket.send(data);
        }
        else {
            logger.warn(`message '${message.constructor.name}' to payment server not sent as socket is not defined or not open ${(0, util_1.inspect)(message)}`);
        }
    }
    async handleMessage(type, message) {
        if (type === ping_1.Ping.name) {
            this.send(new pong_1.Pong());
        }
        else if (type === CurrencyConfigData_1.CurrencyConfigData.name) {
            await new CurrencyConfigDataHandler_1.CurrencyConfigDataHandler(this.dataRepository, this.exchangeRatesService).run(message);
        }
        else if (type === GetDepositAddressResult_1.GetDepositAddressResult.name) {
            new GetDepositAddressResultHandler_1.GetDepositAddressResultHandler(this.broadcastService, this.dataRepository).run(message);
        }
        else if (type === AccountFundedResult_1.AccountFundedResult.name) {
            let pMessage = new GameServerProcessorMessage_1.GameServerProcessorMessage();
            pMessage.accountFunded = message;
            this.processor.sendMessage(pMessage);
        }
        else if (type === AccountWithdrawlResultInternal_1.AccountWithdrawlResultInternal.name) {
            new AccountWithdrawlResultHandler_1.AccountWithdrawlResultHandler(this.broadcastService, this.dataRepository).run(message);
        }
        else if (type === GetPaymentsResult_1.GetPaymentsResult.name) {
            let pMessage = new GameServerProcessorMessage_1.GameServerProcessorMessage();
            pMessage.getPaymentsResult = message;
            this.processor.sendMessage(pMessage);
        }
    }
}
exports.AdminSecureSocketService = AdminSecureSocketService;
class IConnectionToPaymentServer {
    onConnection(socket, httpReq) { throw new Error("Method not implemented."); }
    send(message) { throw new Error("Not implemented"); }
}
exports.IConnectionToPaymentServer = IConnectionToPaymentServer;
//# sourceMappingURL=AdminSecureSocketService.js.map