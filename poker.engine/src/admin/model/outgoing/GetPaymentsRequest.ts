import { GameServerToPaymentServerMessage } from "../GameServerToPaymentServerMessage";

export class GetPaymentsRequest implements GameServerToPaymentServerMessage {
    constructor(public lastUpdated:Date|null){

    }
}