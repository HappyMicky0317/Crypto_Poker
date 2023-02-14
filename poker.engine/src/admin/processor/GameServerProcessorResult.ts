import { AwardPrizesResult } from "./model/AwardPrizesRequest";
import { ManualFundAccountResult } from "./model/ManualFundAccountRequest";

export class GameServerProcessorResult {
    error:string;
    awardPrizesResult:AwardPrizesResult;
    manualFundAccountResult:ManualFundAccountResult;
}