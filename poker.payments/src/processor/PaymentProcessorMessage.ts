import { Payment } from './../../../poker.engine/src/model/Payment';
import { GetDepositAddressRequest } from "../../../poker.engine/src/admin/model/outgoing/GetDepositAddressRequest";
import { DepositAddressTrigger } from "../../../poker.engine/src/admin/model/outgoing/DepositAddressTrigger";
import { IncomingPaymentEvent } from "../model/incoming-payment-event";
import { ManualApprovalRequest, ManualApprovalResult } from '../model/ManualApprovalRequest';
import { IncomingPaymentResult } from '../model/IncomingPaymentResult';
import { CancelPaymentRequest, CancelPaymentResult } from '../model/CancelPaymentRequest';

export class PaymentProcessorMessage{
    getDepositAddress: GetDepositAddressRequest;
    checkWithdrawls: {};
    incomingPaymentEvent: IncomingPaymentEvent;
    processWithdrawls: {};
    manualApprovalRequest: ManualApprovalRequest;
    cancelPaymentRequest: CancelPaymentRequest;
    checkDepositAddresses: DepositAddressTrigger;
}
export class PaymentProcessorResult{
    error: string|undefined = undefined;
    getDepositAddressResult:any;
    incomingPaymentResult:IncomingPaymentResult;
    manualApprovalResult:ManualApprovalResult;
    cancelPaymentResult:CancelPaymentResult;
}