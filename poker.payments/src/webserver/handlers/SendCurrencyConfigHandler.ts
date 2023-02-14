import { ISecureDataRepository } from "../../repository/ISecureDataRepository";
import { CurrencyConfig } from "../../../../poker.engine/src/model/CurrencyConfig";
import { CurrencyConfigData } from "../../../../poker.engine/src/admin/model/incoming/CurrencyConfigData";
import * as _ from "lodash";
import { IConnectionToGameServer } from "../../services/ConnectionToGameServer";

export class SendCurrencyConfigHandler {
    constructor(private dateRepository:ISecureDataRepository, private connectionToGameServer:IConnectionToGameServer){

    }

    async run(){
        this.connectionToGameServer.send(await this.getCurrencyConfig());
    }

    async getCurrencyConfig() : Promise<CurrencyConfigData>{
        let dbConfigs = await this.dateRepository.getCurrencyConfigs();
        let result:CurrencyConfigData = new CurrencyConfigData();
        for(let dbConfig of dbConfigs){
            let config = new CurrencyConfig();
            config = <CurrencyConfig>_.pick(dbConfig, _.keys(config));
            result.configs.push(config)
        }
        return result;
    }
}