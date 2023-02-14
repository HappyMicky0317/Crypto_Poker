import { Payment } from "../../../poker.engine/src/model/Payment";

export class ManualApprovalRequest {
constructor(public paymentId:string){

}
}

export class ManualApprovalResult {
    payment:Payment;
    error: string;
}