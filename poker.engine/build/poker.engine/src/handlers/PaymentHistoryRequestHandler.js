"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentHistoryRequestHandler = void 0;
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const PaymentType_1 = require("../../../poker.ui/src/shared/PaymentType");
const CommonHelpers_1 = require("../../../poker.ui/src/shared/CommonHelpers");
var _ = require('lodash');
class PaymentHistoryRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository) {
        super();
        this.dataRepository = dataRepository;
    }
    async handleMessage(wsHandle, request) {
        let result = new DataContainer_1.PaymentHistoryResult();
        result.payments = [];
        let currencyConfigs = await this.dataRepository.getCurrencyConfigs();
        for (let payment of await this.dataRepository.getPayments({ guid: wsHandle.user.guid })) {
            let config = currencyConfigs.find(c => c.name == payment.currency);
            let view = new DataContainer_1.PaymentHistoryRowView();
            view.amount = payment.amount;
            view.confirmations = payment.confirmations;
            view.currency = payment.currency;
            view.requiredConfirmations = config.requiredNumberOfConfirmations;
            view.timestamp = payment.timestamp.toISOString();
            view.type = payment.type;
            view.txHash = payment.txId;
            if (payment.tournamentId) {
                let type = '';
                if (payment.type == PaymentType_1.PaymentType.outgoing) {
                    type = payment.isTournamentRebuy ? `Rebuy` : `Buy in`;
                }
                else if (payment.type == PaymentType_1.PaymentType.incoming) {
                    let placing = '';
                    if (payment.tournamentPlacing) {
                        placing = (0, CommonHelpers_1.ordinal_suffix_of)(payment.tournamentPlacing);
                    }
                    type = `${placing} Place`;
                }
                view.comment = `${type} - ${payment.tournamentName}`;
            }
            else {
                view.comment = payment.comment;
                view.status = payment.status;
            }
            result.payments.push(view);
        }
        let data = new DataContainer_1.DataContainer();
        data.paymentHistoryResult = result;
        wsHandle.send(data);
        return Promise.resolve();
    }
}
exports.PaymentHistoryRequestHandler = PaymentHistoryRequestHandler;
//# sourceMappingURL=PaymentHistoryRequestHandler.js.map