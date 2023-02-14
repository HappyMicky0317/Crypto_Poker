import { AccountFundedResult } from "../../model/AccountFundedResult";
import { GetPaymentsResult } from "../model/incoming/GetPaymentsResult";
import { AwardPrizesRequest } from "./model/AwardPrizesRequest";
import { ManualFundAccountRequest } from "./model/ManualFundAccountRequest";


export class GameServerProcessorMessage {
    accountFunded:AccountFundedResult;
    getPaymentsResult:GetPaymentsResult;
    awardPrizesRequest:AwardPrizesRequest;
    manualFundAccountRequest:ManualFundAccountRequest;
}