import { CurrencyConfig } from "../../../model/CurrencyConfig";
import { PaymentServerToGameServerMessage } from "../PaymentServerToGameServerMessage";

export class CurrencyConfigData implements PaymentServerToGameServerMessage {
    configs:CurrencyConfig[] = [];
}