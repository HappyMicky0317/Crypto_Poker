"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPaymentsResultHandler = void 0;
const log4js_1 = require("log4js");
const PaymentType_1 = require("../../../../poker.ui/src/shared/PaymentType");
const GameServerProcessorResult_1 = require("../processor/GameServerProcessorResult");
const logger = (0, log4js_1.getLogger)();
class GetPaymentsResultHandler {
    constructor(accountFundedHandler, dataRepository) {
        this.accountFundedHandler = accountFundedHandler;
        this.dataRepository = dataRepository;
        this.typeName = 'getPaymentsResult';
    }
    async run(message) {
        let result = new GameServerProcessorResult_1.GameServerProcessorResult();
        for (let payment of message.getPaymentsResult.payments) {
            try {
                if (payment.type == PaymentType_1.PaymentType.incoming) {
                    await this.accountFundedHandler.handlePayment(payment);
                }
                else if (payment.type == PaymentType_1.PaymentType.outgoing) {
                    await this.dataRepository.savePayment(payment);
                }
            }
            catch (e) {
                logger.error(e);
            }
        }
        return result;
    }
}
exports.GetPaymentsResultHandler = GetPaymentsResultHandler;
//# sourceMappingURL=GetPaymentsResultHandler.js.map