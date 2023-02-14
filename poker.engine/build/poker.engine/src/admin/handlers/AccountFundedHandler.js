"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountFundedHandler = void 0;
const DataContainer_1 = require("../../../../poker.ui/src/shared/DataContainer");
const User_1 = require("../../model/User");
const decimal_1 = require("../../../../poker.ui/src/shared/decimal");
const PaymentStatus_1 = require("../../../../poker.ui/src/shared/PaymentStatus");
const helpers_1 = require("../../helpers");
const GameServerProcessorResult_1 = require("../processor/GameServerProcessorResult");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
class AccountFundedHandler {
    constructor(broadcastService, dataRepository) {
        this.broadcastService = broadcastService;
        this.dataRepository = dataRepository;
        this.typeName = 'accountFunded';
    }
    async run(message) {
        let result = new GameServerProcessorResult_1.GameServerProcessorResult();
        await this.handlePayment(message.accountFunded.payment);
        return result;
    }
    async handlePayment(payment) {
        let account = await this.savePayment(payment);
        this.broadcastService.send(payment.guid, async () => {
            let data = new DataContainer_1.DataContainer();
            let accountFunded = new DataContainer_1.AccountFunded();
            if (account != null) {
                accountFunded.balance = account.balance;
            }
            accountFunded.paymentReceived = parseFloat(payment.amount);
            accountFunded.currency = payment.currency;
            accountFunded.confirmations = payment.confirmations;
            data.accountFunded = accountFunded;
            return data;
        });
    }
    async savePayment(payment) {
        let dbPayment;
        if (payment.txId) {
            dbPayment = await this.dataRepository.getPaymentByTxId(payment.currency, payment.txId);
        }
        else if (payment.tournamentId) {
            dbPayment = await this.dataRepository.getPaymentIncomingByTournamentId(payment.tournamentId, payment.guid);
        }
        if (dbPayment == null) {
            let dbPayment = await this.dataRepository.getPaymentById(payment._id);
            if (dbPayment) {
                logger.error(`payment ${payment._id} was found by id but not matched by either TxId or TournamentId`);
                return;
            }
        }
        let shouldUpdateBalance = payment.status == PaymentStatus_1.PaymentStatus.complete && (dbPayment == null || dbPayment.status === PaymentStatus_1.PaymentStatus.pending);
        if (dbPayment == null) {
            dbPayment = payment;
        }
        else {
            dbPayment.confirmations = payment.confirmations;
            dbPayment.status = payment.status;
        }
        await this.dataRepository.savePayment(dbPayment);
        if (shouldUpdateBalance) {
            return this.updatePlayerBalance(payment.guid, payment.currency, payment.amount, payment._id.toString());
        }
        return null;
    }
    async updatePlayerBalance(guid, currency, amount, paymentId) {
        let user = await this.dataRepository.getUser(guid);
        if (!user) {
            user = new User_1.User();
            user.guid = guid;
            user.setScreenName();
            await this.dataRepository.saveUser(user);
        }
        await (0, helpers_1.transferTableBalance)(guid, new decimal_1.Decimal(amount).toNumber(), currency, this.dataRepository, `incoming payment id:${paymentId} for user ${user.screenName} ${user.guid}`);
        let account = await this.dataRepository.getUserAccount(guid, currency);
        return account;
    }
}
exports.AccountFundedHandler = AccountFundedHandler;
//# sourceMappingURL=AccountFundedHandler.js.map