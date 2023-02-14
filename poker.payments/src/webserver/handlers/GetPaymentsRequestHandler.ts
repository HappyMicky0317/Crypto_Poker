import { GetPaymentsRequest } from "../../../../poker.engine/src/admin/model/outgoing/GetPaymentsRequest";
import { GetPaymentsResult } from "../../../../poker.engine/src/admin/model/incoming/GetPaymentsResult";
import { ISecureDataRepository } from "../../repository/ISecureDataRepository";
import { IConnectionToGameServer } from "../../services/ConnectionToGameServer";
import { PaymentType } from "../../../../poker.ui/src/shared/PaymentType";
import { PaymentStatus } from "../../../../poker.ui/src/shared/PaymentStatus";

export class GetPaymentsRequestHandler {
    constructor(private dataRepository:ISecureDataRepository, public connectionToGameServer:IConnectionToGameServer){}

    async run(request:GetPaymentsRequest){
        let args:any = {status: { $ne: PaymentStatus.flagged }};
        if(request.lastUpdated){
            args.updated = { $gte: request.lastUpdated };
        }
        let payments = await this.dataRepository.getPayments(args)        
        let result = new GetPaymentsResult();
        for(let payment of payments){
            payment.error = null;
        }
        result.payments = payments;
        this.connectionToGameServer.send(result);
    }
}