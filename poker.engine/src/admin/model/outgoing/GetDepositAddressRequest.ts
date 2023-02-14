import { UserSmall } from "../../../model/UserSmall";
import { GameServerToPaymentServerMessage } from "../GameServerToPaymentServerMessage";

export class GetDepositAddressRequest implements GameServerToPaymentServerMessage {
  currency: string;
  user: UserSmall;
    
}