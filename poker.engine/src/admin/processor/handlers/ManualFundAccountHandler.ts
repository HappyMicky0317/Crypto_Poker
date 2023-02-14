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
import { ManualFundAccountResult } from "../model/ManualFundAccountRequest";
import { CheckPaymentsTrigger } from "../../model/outgoing/CheckPaymentsTrigger";
import { IConnectionToPaymentServer } from "../../AdminSecureSocketService";

export class ManualFundAccountHandler {

    typeName: string = 'manualFundAccountRequest'

    constructor(private dataRepository: IDataRepository, private accountFundedHandler: AccountFundedHandler, private connectionToPaymentServer:IConnectionToPaymentServer) {

    }

    async run(message: GameServerProcessorMessage): Promise<GameServerProcessorResult> {
        
        let request = message.manualFundAccountRequest;
        let user = await this.dataRepository.getUser(request.guid);
        
        let payment = new Payment();
        payment.type = PaymentType.incoming;
        payment.amount = request.amount;
        payment.currency = request.currency;
        payment.guid = request.guid;
        payment.screenName = user.screenName;
        payment.timestamp = new Date();
        payment.status = PaymentStatus.complete;
        payment.updated = new Date();
        payment.comment = request.comment;
        
        await this.accountFundedHandler.handlePayment(payment);

        let pResult = new GameServerProcessorResult();
        pResult.manualFundAccountResult = new ManualFundAccountResult(true, "");
        this.connectionToPaymentServer.send(new CheckPaymentsTrigger())
        return pResult;
    }


}