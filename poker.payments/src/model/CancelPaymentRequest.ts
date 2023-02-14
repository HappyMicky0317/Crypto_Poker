import { Payment } from "../../../poker.engine/src/model/Payment";

export class CancelPaymentRequest {
constructor(public paymentId:string){

}
}

export class CancelPaymentResult {
    payment:Payment;
    error: string;
}