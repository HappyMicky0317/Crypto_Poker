"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountWithdrawlRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const decimal_1 = require("../../../poker.ui/src/shared/decimal");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const CheckPaymentsTrigger_1 = require("../admin/model/outgoing/CheckPaymentsTrigger");
const Payment_1 = require("../model/Payment");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
class AccountWithdrawlRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(pokerTableProvider, dataRepository, connectionToPaymentServer) {
        super();
        this.pokerTableProvider = pokerTableProvider;
        this.dataRepository = dataRepository;
        this.connectionToPaymentServer = connectionToPaymentServer;
    }
    async handleMessage(wsHandle, request) {
        let result = await this.handleMessageInternal(wsHandle, request);
        this.sendAccountWithdrawlResult(result, wsHandle);
        if (result.success) {
            await this.savePayment(request.currency, request.receivingAddress, request.amount + '', wsHandle.user);
            this.connectionToPaymentServer.send(new CheckPaymentsTrigger_1.CheckPaymentsTrigger());
        }
    }
    async handleMessageInternal(wsHandle, accountWithdrawlRequest) {
        let withdrawlAmount = new decimal_1.Decimal(accountWithdrawlRequest.amount);
        if (!withdrawlAmount.greaterThan(0)) {
            return Promise.resolve(this.getAccountWithdrawlResult('Invalid withdrawl amount'));
        }
        let config = await this.dataRepository.getCurrencyConfig(accountWithdrawlRequest.currency);
        if (isNaN(parseFloat(config.minimumWithdrawl))) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Minimum withdrawl not defined for currency ${accountWithdrawlRequest.currency}`));
        }
        let minimumWithdrawl = new decimal_1.Decimal(config.minimumWithdrawl).mul(Currency_1.CurrencyUnit.default);
        if (withdrawlAmount.lessThan(minimumWithdrawl)) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Amount is less than the minimum withdrawl of ${config.minimumWithdrawl}`));
        }
        if (!accountWithdrawlRequest.receivingAddress || !accountWithdrawlRequest.receivingAddress.trim().length) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Invalid receiving address`));
        }
        let addresses = await this.dataRepository.getAddressInfoByAddress(accountWithdrawlRequest.receivingAddress);
        if (addresses.length) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Cannot withdraw to deposit address`));
        }
        let currentTable;
        let currentPlayer;
        for (let table of this.pokerTableProvider.getTables().filter(t => accountWithdrawlRequest.currency.toLowerCase() == t.tableConfig.currency)) {
            let player = table.findPlayer(wsHandle.user.guid);
            if (player) {
                if (table.currentPlayers && table.currentPlayers.indexOf(player) > -1) {
                    let errorMessage = `You are still playing at table '${table.tableConfig.name}'. Select 'Sit out next hand' then complete the hand.`;
                    return Promise.resolve(this.getAccountWithdrawlResult(errorMessage));
                }
                else {
                    currentTable = table;
                    currentPlayer = player;
                    break;
                }
            }
        }
        if (currentTable != null) {
            await currentTable.sendLeaveTable(wsHandle.user.toSmall());
        }
        let account = await this.dataRepository.getUserAccount(wsHandle.user.guid, accountWithdrawlRequest.currency);
        if (!account) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Account does not exist for currency ${accountWithdrawlRequest.currency}`));
        }
        else if (new decimal_1.Decimal(account.balance).lessThan(withdrawlAmount)) {
            let currencyUnit = Currency_1.CurrencyUnit.getCurrencyUnit(accountWithdrawlRequest.currency);
            return Promise.resolve(this.getAccountWithdrawlResult(`Insufficient balance: Trying to withdraw ${withdrawlAmount.dividedBy(currencyUnit)} however account balance is ${account.balance / currencyUnit}`));
        }
        let updateResult = await this.dataRepository.updateUserAccount(wsHandle.user.guid, accountWithdrawlRequest.currency, -withdrawlAmount.toNumber(), account.updateIndex);
        if (updateResult.result.nModified !== 1) {
            throw new Error(`updateUserAccount: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${wsHandle.user.guid} accountWithdrawlRequest: ${JSON.stringify(accountWithdrawlRequest)}`);
        }
        let result = new DataContainer_1.AccountWithdrawlResult();
        result.balance = new decimal_1.Decimal(account.balance).minus(withdrawlAmount).toString();
        result.sentAmount = withdrawlAmount.toString();
        result.success = true;
        result.currency = account.currency;
        return Promise.resolve(result);
    }
    async savePayment(currency, address, amount, user) {
        let payment = new Payment_1.Payment();
        payment.currency = currency.toLowerCase();
        payment.address = address;
        payment.amount = amount;
        payment.guid = user.guid;
        payment.timestamp = new Date();
        payment.type = PaymentType_1.PaymentType.outgoing;
        payment.status = PaymentStatus_1.PaymentStatus.pending;
        payment.screenName = user.screenName;
        await this.dataRepository.savePayment(payment);
    }
    getAccountWithdrawlResult(errorMessage) {
        let result = new DataContainer_1.AccountWithdrawlResult();
        result.errorMessage = errorMessage;
        return result;
    }
    sendAccountWithdrawlResult(result, wsHandle) {
        let data = new DataContainer_1.DataContainer();
        data.accountWithdrawlResult = result;
        wsHandle.send(data);
    }
}
exports.AccountWithdrawlRequestHandler = AccountWithdrawlRequestHandler;
//# sourceMappingURL=AccountWithdrawlRequestHandler.js.map