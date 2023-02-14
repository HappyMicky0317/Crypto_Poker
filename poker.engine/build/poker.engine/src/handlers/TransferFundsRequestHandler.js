"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferFundsRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const Currency_1 = require("../../../poker.ui/src/shared/Currency");
const Payment_1 = require("../model/Payment");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../../poker.ui/src/shared/PaymentStatus");
const helpers_1 = require("../helpers");
class TransferFundsRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, broadcastService) {
        super();
        this.dataRepository = dataRepository;
        this.broadcastService = broadcastService;
    }
    async handleMessage(wsHandle, transferFundsRequest) {
        let dc = new DataContainer_1.DataContainer();
        dc.transferFundsResult = new DataContainer_1.TransferFundsResult();
        let user = await this.dataRepository.getUser(wsHandle.user.guid);
        let transferToUser;
        let arr = await this.dataRepository.getUsersByScreenName(transferFundsRequest.screenName);
        if (arr.length > 0) {
            transferToUser = arr[0];
        }
        let accountBalance = 0;
        let account;
        if (user != null) {
            account = await this.dataRepository.getUserAccount(user.guid, Currency_1.Currency.dash);
            if (account != null)
                accountBalance = account.balance;
        }
        let transferAmount = transferFundsRequest.amount;
        if (isNaN(transferAmount))
            dc.transferFundsResult.errorMessage = `'${transferFundsRequest.amount}' is an invalid numeric value.`;
        else if (transferAmount < 1000000)
            dc.transferFundsResult.errorMessage = `Invalid amount. Minimum transfer balance is 0.01`;
        else if (transferAmount > accountBalance)
            dc.transferFundsResult.errorMessage = `Invalid amount. You cannot transfer ${transferFundsRequest.amount / Currency_1.CurrencyUnit.default} as your balance is ${accountBalance / Currency_1.CurrencyUnit.default}. If you are seated you must first leave the table to transfer your table balance to another player.`;
        else if (!transferFundsRequest.screenName)
            dc.transferFundsResult.errorMessage = 'Screen name to transfer to required';
        else if (!transferToUser)
            dc.transferFundsResult.errorMessage = `No user found with screen name: ${transferFundsRequest.screenName}`;
        else {
            dc.transferFundsResult.success = true;
            dc.transferFundsResult.amount = transferFundsRequest.amount;
            dc.transferFundsResult.screenName = transferFundsRequest.screenName;
            dc.transferFundsResult.currency = account.currency;
            let outgoingPayment = this.getPayment(PaymentType_1.PaymentType.outgoing, transferAmount + '', account.currency.toLowerCase(), user.guid, user.screenName, transferToUser.toSmall(), null);
            let incomingPayment = this.getPayment(PaymentType_1.PaymentType.incoming, transferAmount + '', account.currency.toLowerCase(), transferToUser.guid, transferToUser.screenName, null, user.toSmall());
            await this.dataRepository.updateUserAccount(user.guid, account.currency, -transferAmount, account.updateIndex);
            await this.dataRepository.savePayment(outgoingPayment);
            this.dataRepository.updateUserAccount(transferToUser.guid, account.currency, transferAmount);
            this.dataRepository.savePayment(incomingPayment);
        }
        wsHandle.send(dc);
        if (dc.transferFundsResult.success) {
            wsHandle.sendUserData(user, this.dataRepository);
            this.broadcastService.send(transferToUser.guid, async () => {
                let data = new DataContainer_1.DataContainer();
                data.user = await (0, helpers_1.getUserData)(transferToUser, this.dataRepository, true);
                return Promise.resolve(data);
            });
        }
        return Promise.resolve();
    }
    getPayment(type, amount, currency, guid, screenName, transferTo, transferFrom) {
        let payment = new Payment_1.Payment();
        payment.type = type;
        payment.amount = amount;
        payment.currency = currency;
        payment.guid = guid;
        payment.screenName = screenName;
        payment.transferTo = transferTo;
        payment.transferFrom = transferFrom;
        payment.timestamp = new Date();
        payment.status = PaymentStatus_1.PaymentStatus.complete;
        return payment;
    }
}
exports.TransferFundsRequestHandler = TransferFundsRequestHandler;
//# sourceMappingURL=TransferFundsRequestHandler.js.map