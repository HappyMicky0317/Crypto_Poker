import { Payment } from "./Payment";
import { PaymentServerToGameServerMessage } from "../admin/model/PaymentServerToGameServerMessage";

export class AccountFundedResult implements PaymentServerToGameServerMessage {    
    payment:Payment|undefined;

}