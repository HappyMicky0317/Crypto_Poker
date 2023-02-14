import { IBroadcastService } from "../../services/IBroadcastService";
import { DataContainer } from "../../../../poker.ui/src/shared/DataContainer";

import { IDataRepository } from "../../services/documents/IDataRepository";
import { AccountWithdrawlResultInternal } from "../../model/AccountWithdrawlResultInternal";

export class AccountWithdrawlResultHandler {
    constructor(private broadcastService: IBroadcastService, private dataRepository: IDataRepository) {

    }

    async run(result: AccountWithdrawlResultInternal) {
        this.broadcastService.send(result.guid, async () => {
            let data = new DataContainer();
            data.accountWithdrawlResult = result;
            //let payment = await this.dataRepository.getPaymentByTxId(result.)
            return data;
        })
    }
}