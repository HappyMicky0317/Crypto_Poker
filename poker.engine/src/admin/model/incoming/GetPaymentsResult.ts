import { Payment } from "../../../model/Payment";
import { PaymentServerToGameServerMessage } from "../PaymentServerToGameServerMessage";

export class GetPaymentsResult implements PaymentServerToGameServerMessage{
    payments:Payment[];
}