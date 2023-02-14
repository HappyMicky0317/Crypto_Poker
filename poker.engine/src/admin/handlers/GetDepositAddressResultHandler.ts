import { DataContainer, FundAccountResult } from "../../../../poker.ui/src/shared/DataContainer";

import { IBroadcastService } from "../../services/IBroadcastService";
import { GetDepositAddressResult } from "../model/incoming/GetDepositAddressResult";
import { getFundAccountResult } from "../../helpers";
import { IDataRepository } from "../../services/documents/IDataRepository";
import { AddressInfo } from "../../model/AddressInfo";
import { User } from "../../model/User";


export class GetDepositAddressResultHandler {

    constructor(private broadcastService: IBroadcastService, private dataRepository: IDataRepository) {

    }

    async run(result: GetDepositAddressResult) {
        this.broadcastService.send(result.guid, async () => {
            return getFundAccountResult(result.currency, result.requiredConfirmations, result.address)
        })
        let addresses = await this.dataRepository.getAddressInfo(result.guid, result.currency, false);
        if(!addresses.length){
            let user = await this.dataRepository.getUser(result.guid);
            if (!user) {
                user = new User();
                user.guid = result.guid;
                user.setScreenName();
                await this.dataRepository.saveUser(user);
            }
            let addressInfo = new AddressInfo();
            addressInfo.address = result.address,
            addressInfo.currency = result.currency;
            addressInfo.processed = false;            
            addressInfo.screenName = user.screenName;
            addressInfo.userGuid = user.guid;
            await this.dataRepository.saveAddress(addressInfo);
        }
    }
}