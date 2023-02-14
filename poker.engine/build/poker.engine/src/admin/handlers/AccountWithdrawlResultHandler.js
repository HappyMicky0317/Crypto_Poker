"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountWithdrawlResultHandler = void 0;
const DataContainer_1 = require("../../../../poker.ui/src/shared/DataContainer");
class AccountWithdrawlResultHandler {
    constructor(broadcastService, dataRepository) {
        this.broadcastService = broadcastService;
        this.dataRepository = dataRepository;
    }
    async run(result) {
        this.broadcastService.send(result.guid, async () => {
            let data = new DataContainer_1.DataContainer();
            data.accountWithdrawlResult = result;
            return data;
        });
    }
}
exports.AccountWithdrawlResultHandler = AccountWithdrawlResultHandler;
//# sourceMappingURL=AccountWithdrawlResultHandler.js.map