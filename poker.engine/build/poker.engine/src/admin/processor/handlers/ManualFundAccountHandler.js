"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualFundAccountHandler = void 0;
const Payment_1 = require("../../../model/Payment");
const PaymentStatus_1 = require("../../../../../poker.ui/src/shared/PaymentStatus");
const GameServerProcessorResult_1 = require("../GameServerProcessorResult");
const PaymentType_1 = require("../../../../../poker.ui/src/shared/PaymentType");
const ManualFundAccountRequest_1 = require("../model/ManualFundAccountRequest");
const CheckPaymentsTrigger_1 = require("../../model/outgoing/CheckPaymentsTrigger");
class ManualFundAccountHandler {
    constructor(dataRepository, accountFundedHandler, connectionToPaymentServer) {
        this.dataRepository = dataRepository;
        this.accountFundedHandler = accountFundedHandler;
        this.connectionToPaymentServer = connectionToPaymentServer;
        this.typeName = 'manualFundAccountRequest';
    }
    async run(message) {
        let request = message.manualFundAccountRequest;
        let user = await this.dataRepository.getUser(request.guid);
        let payment = new Payment_1.Payment();
        payment.type = PaymentType_1.PaymentType.incoming;
        payment.amount = request.amount;
        payment.currency = request.currency;
        payment.guid = request.guid;
        payment.screenName = user.screenName;
        payment.timestamp = new Date();
        payment.status = PaymentStatus_1.PaymentStatus.complete;
        payment.updated = new Date();
        payment.comment = request.comment;
        await this.accountFundedHandler.handlePayment(payment);
        let pResult = new GameServerProcessorResult_1.GameServerProcessorResult();
        pResult.manualFundAccountResult = new ManualFundAccountRequest_1.ManualFundAccountResult(true, "");
        this.connectionToPaymentServer.send(new CheckPaymentsTrigger_1.CheckPaymentsTrigger());
        return pResult;
    }
}
exports.ManualFundAccountHandler = ManualFundAccountHandler;
//# sourceMappingURL=ManualFundAccountHandler.js.map