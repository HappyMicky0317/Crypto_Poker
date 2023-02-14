"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundAccountRequestHandler = void 0;
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const AddressInfo_1 = require("../model/AddressInfo");
const helpers_1 = require("../helpers");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const DepositAddressTrigger_1 = require("../admin/model/outgoing/DepositAddressTrigger");
const shared_helpers_1 = require("../shared-helpers");
var _ = require('lodash');
class FundAccountRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(pokerTableProvider, dataRepository, connectionToPaymentServer, depositAddressService) {
        super();
        this.pokerTableProvider = pokerTableProvider;
        this.dataRepository = dataRepository;
        this.connectionToPaymentServer = connectionToPaymentServer;
        this.depositAddressService = depositAddressService;
    }
    async handleMessage(wsHandle, request) {
        let currency = request.currency;
        if (currency == Currency_1.Currency.free) {
            return this.sendPlayMoney(wsHandle);
        }
        else {
            let user = await this.dataRepository.getUser(wsHandle.user.guid);
            if (!user) {
                user = wsHandle.user;
            }
            if (user.depositIndex === undefined) {
                user.depositIndex = await this.dataRepository.getNextUserIndex();
                await this.dataRepository.saveUser(user);
            }
            let addressInfo = await this.getAddressInfo(request.currency, user);
            let currencyConfig = await this.dataRepository.getCurrencyConfig(currency);
            let data = await (0, helpers_1.getFundAccountResult)(currency, currencyConfig.requiredNumberOfConfirmations, addressInfo.address);
            let payments = await this.dataRepository.getPayments({ guid: wsHandle.user.guid, currency: currency });
            let pendingPayment = payments.find(p => p.status == PaymentStatus_1.PaymentStatus.pending && p.type == PaymentType_1.PaymentType.incoming);
            if (pendingPayment) {
                data.accountFunded = this.getAccountFunded(pendingPayment);
            }
            wsHandle.send(data);
        }
    }
    async getAddressInfo(currency, user) {
        let currencyConfig = await this.dataRepository.getCurrencyConfig(currency);
        if (shared_helpers_1.SharedHelpers.Erc20RegExp.exec(currencyConfig.contractAddress)) {
            currency = Currency_1.Currency.eth;
            currencyConfig = await this.dataRepository.getCurrencyConfig(Currency_1.Currency.eth);
        }
        let addresses = await this.dataRepository.getAddressInfo(user.guid, currency, false);
        if (!addresses.length) {
            let address = await this.depositAddressService.getAddress(currency, currencyConfig.xpub, user.depositIndex);
            let addressInfo = new AddressInfo_1.AddressInfo();
            addressInfo.address = address;
            addressInfo.currency = currency;
            addressInfo.screenName = user.screenName;
            addressInfo.userGuid = user.guid;
            await this.dataRepository.saveAddress(addressInfo);
            addresses.push(addressInfo);
            let request = new DepositAddressTrigger_1.DepositAddressTrigger();
            request.user = user.toSmall();
            request.currency = currency;
            request.address = address;
            request.depositIndex = user.depositIndex;
            this.connectionToPaymentServer.send(request);
        }
        return addresses[0];
    }
    getAccountFunded(payment) {
        let accountFunded = new DataContainer_1.AccountFunded();
        accountFunded.paymentReceived = parseFloat(payment.amount);
        accountFunded.currency = payment.currency;
        accountFunded.confirmations = payment.confirmations;
        return accountFunded;
    }
    async sendPlayMoney(socketHandle) {
        let guid = socketHandle.user.guid;
        let accountFunded = new DataContainer_1.AccountFunded();
        accountFunded.currency = Currency_1.Currency.free;
        accountFunded.paymentReceived = Currency_1.Currency.freeStartingAmount;
        let account = await this.dataRepository.getUserAccount(guid, Currency_1.Currency.free);
        let balance = account == null ? 0 : account.balance;
        if (balance <= 2) {
            await this.dataRepository.updateUserAccount(guid, Currency_1.Currency.free, Currency_1.Currency.freeStartingAmount - balance);
        }
        account = await this.dataRepository.getUserAccount(guid, Currency_1.Currency.free);
        accountFunded.balance = account.balance;
        let data = new DataContainer_1.DataContainer();
        data.accountFunded = accountFunded;
        setTimeout(() => {
            socketHandle.send(data);
        }, 1000);
    }
}
exports.FundAccountRequestHandler = FundAccountRequestHandler;
//# sourceMappingURL=FundAccountRequestHandler.js.map