import { PaymentServerToGameServerMessage } from "../PaymentServerToGameServerMessage";

export class GetDepositAddressResult implements PaymentServerToGameServerMessage {
    guid:string;
    currency:string;
    requiredConfirmations:number;
    address:string;
    
}