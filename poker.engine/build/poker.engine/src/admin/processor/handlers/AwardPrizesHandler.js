"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwardPrizesHandler = void 0;
const Currency_1 = require("../../../../../poker.ui/src/shared/Currency");
const Payment_1 = require("../../../model/Payment");
const decimal_1 = require("../../../../../poker.ui/src/shared/decimal");
const PaymentStatus_1 = require("../../../../../poker.ui/src/shared/PaymentStatus");
const GameServerProcessorResult_1 = require("../GameServerProcessorResult");
const AwardPrizesRequest_1 = require("../model/AwardPrizesRequest");
const PaymentType_1 = require("../../../../../poker.ui/src/shared/PaymentType");
const CheckPaymentsTrigger_1 = require("../../model/outgoing/CheckPaymentsTrigger");
class AwardPrizesHandler {
    constructor(dataRepository, accountFundedHandler, connectionToPaymentServer) {
        this.dataRepository = dataRepository;
        this.accountFundedHandler = accountFundedHandler;
        this.connectionToPaymentServer = connectionToPaymentServer;
        this.typeName = 'awardPrizesRequest';
    }
    async run(message) {
        let pResult = new GameServerProcessorResult_1.GameServerProcessorResult();
        let tournament = await this.dataRepository.getTournmanetById(message.awardPrizesRequest.tournamentId);
        let adminTournamentResultsView = message.awardPrizesRequest.adminTournamentResultsView;
        let result = new AwardPrizesRequest_1.AwardPrizesResult();
        if (!adminTournamentResultsView.view.canAwardPrizes) {
            result.message = 'Cannot award prizes.';
        }
        else {
            let commandResult = await this.dataRepository.updateTournamentHasAwardedPrizes(tournament._id.toString());
            if (commandResult.result.nModified == 1) {
                this.dataRepository.saveTournamentResult(adminTournamentResultsView.results);
                let playersWithPrizes = adminTournamentResultsView.results.filter(r => new decimal_1.Decimal(r.prize).greaterThan(0));
                for (let playerResult of playersWithPrizes) {
                    let amount = new decimal_1.Decimal(playerResult.prize).mul(Currency_1.CurrencyUnit.getCurrencyUnit(tournament.currency)).toString();
                    let payment = new Payment_1.Payment();
                    payment.type = PaymentType_1.PaymentType.incoming;
                    payment.amount = amount;
                    payment.currency = tournament.currency;
                    payment.guid = playerResult.userGuid;
                    payment.screenName = playerResult.screenName;
                    payment.timestamp = new Date();
                    payment.status = PaymentStatus_1.PaymentStatus.complete;
                    payment.updated = new Date();
                    payment.tournamentId = tournament._id.toString();
                    payment.tournamentName = tournament.name;
                    payment.tournamentPlacing = playerResult.placing;
                    await this.accountFundedHandler.handlePayment(payment);
                }
                result.success = true;
                adminTournamentResultsView.view.hasAwardedPrizes = true;
                adminTournamentResultsView.view.canAwardPrizes = false;
                result.view = adminTournamentResultsView.view;
                this.connectionToPaymentServer.send(new CheckPaymentsTrigger_1.CheckPaymentsTrigger());
            }
            else {
                result.message = `Expecting commandResult.result.nModified == 1 instead it is ${commandResult.result.nModified}`;
            }
        }
        pResult.awardPrizesResult = result;
        return pResult;
    }
}
exports.AwardPrizesHandler = AwardPrizesHandler;
//# sourceMappingURL=AwardPrizesHandler.js.map