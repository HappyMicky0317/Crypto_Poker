import { DataContainer, FundAccountResult, AccountFunded, Account } from "../../../../../poker.ui/src/shared/DataContainer";
import { Currency, CurrencyUnit } from "../../../../../poker.ui/src/shared/Currency";
import { IBroadcastService } from "../../../services/IBroadcastService";
import { AccountFundedResult } from "../../../model/AccountFundedResult";
import { IDataRepository } from "../../../services/documents/IDataRepository";
import { User } from "../../../model/User";
import { Payment } from "../../../model/Payment";
import { Decimal } from "../../../../../poker.ui/src/shared/decimal";
import { PaymentStatus } from "../../../../../poker.ui/src/shared/PaymentStatus";
import { transferTableBalance } from "../../../helpers";
import { GameServerProcessorMessage } from "../GameServerProcessorMessage";
import { GameServerProcessorResult } from "../GameServerProcessorResult";
import { AccountFundedHandler } from "../../handlers/AccountFundedHandler";
import { Tournament } from "../../../model/tournament";
import { AwardPrizesResult } from "../model/AwardPrizesRequest";
import { PaymentType } from "../../../../../poker.ui/src/shared/PaymentType";
import { CheckPaymentsTrigger } from "../../model/outgoing/CheckPaymentsTrigger";
import { IConnectionToPaymentServer } from "../../AdminSecureSocketService";

export class AwardPrizesHandler {

    typeName: string = 'awardPrizesRequest'

    constructor(private dataRepository: IDataRepository, private accountFundedHandler: AccountFundedHandler, private connectionToPaymentServer:IConnectionToPaymentServer) {

    }

    async run(message: GameServerProcessorMessage): Promise<GameServerProcessorResult> {
        let pResult = new GameServerProcessorResult();

        let tournament: Tournament = await this.dataRepository.getTournmanetById(message.awardPrizesRequest.tournamentId);
        let adminTournamentResultsView = message.awardPrizesRequest.adminTournamentResultsView;
        let result: AwardPrizesResult = new AwardPrizesResult();
        if (!adminTournamentResultsView.view.canAwardPrizes) {
            result.message = 'Cannot award prizes.'
        } else {
            let commandResult = await this.dataRepository.updateTournamentHasAwardedPrizes(tournament._id.toString());
            if (commandResult.result.nModified == 1) {
                this.dataRepository.saveTournamentResult(adminTournamentResultsView.results);
                let playersWithPrizes = adminTournamentResultsView.results.filter(r=>new Decimal(r.prize).greaterThan(0));
                for (let playerResult of playersWithPrizes) {
                    
                    let amount: string = new Decimal(playerResult.prize).mul(CurrencyUnit.getCurrencyUnit(tournament.currency)).toString();
                                        
                    let payment = new Payment();
                    payment.type = PaymentType.incoming;
                    payment.amount = amount;
                    payment.currency = tournament.currency;
                    payment.guid = playerResult.userGuid;
                    payment.screenName = playerResult.screenName;
                    payment.timestamp = new Date();
                    payment.status = PaymentStatus.complete;
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
                this.connectionToPaymentServer.send(new CheckPaymentsTrigger())
                //this.pokerProcessor.relayUserData(adminTournamentResultsView.results.map(r=>r.userGuid));        
            } else {
                result.message = `Expecting commandResult.result.nModified == 1 instead it is ${commandResult.result.nModified}`
            }
        }
        pResult.awardPrizesResult = result;
        
        return pResult;
    }


}