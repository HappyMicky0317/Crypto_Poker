import { PaymentServerToGameServerMessage } from "../../../poker.engine/src/admin/model/PaymentServerToGameServerMessage";


export class IConnectionToGameServer {
    send(message:PaymentServerToGameServerMessage): void { throw new Error("Not implemented"); };    
}