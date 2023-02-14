"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDepositAddressResultHandler = void 0;
const helpers_1 = require("../../helpers");
const AddressInfo_1 = require("../../model/AddressInfo");
const User_1 = require("../../model/User");
class GetDepositAddressResultHandler {
    constructor(broadcastService, dataRepository) {
        this.broadcastService = broadcastService;
        this.dataRepository = dataRepository;
    }
    async run(result) {
        this.broadcastService.send(result.guid, async () => {
            return (0, helpers_1.getFundAccountResult)(result.currency, result.requiredConfirmations, result.address);
        });
        let addresses = await this.dataRepository.getAddressInfo(result.guid, result.currency, false);
        if (!addresses.length) {
            let user = await this.dataRepository.getUser(result.guid);
            if (!user) {
                user = new User_1.User();
                user.guid = result.guid;
                user.setScreenName();
                await this.dataRepository.saveUser(user);
            }
            let addressInfo = new AddressInfo_1.AddressInfo();
            addressInfo.address = result.address,
                addressInfo.currency = result.currency;
            addressInfo.processed = false;
            addressInfo.screenName = user.screenName;
            addressInfo.userGuid = user.guid;
            await this.dataRepository.saveAddress(addressInfo);
        }
    }
}
exports.GetDepositAddressResultHandler = GetDepositAddressResultHandler;
//# sourceMappingURL=GetDepositAddressResultHandler.js.map