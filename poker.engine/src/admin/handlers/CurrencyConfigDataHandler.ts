import { DataRepository } from "../../services/documents/DataRepository";
import { IDataRepository } from "../../services/documents/IDataRepository";
import { CurrencyConfigData } from "../model/incoming/CurrencyConfigData";
import { ExchangeRatesService } from "../../services/ExchangeRatesService";

export class CurrencyConfigDataHandler{
    constructor(private dataRepository:IDataRepository, private exchangeRatesService:ExchangeRatesService){

    }

    async run(data:CurrencyConfigData){
        let dbConfigs = await this.dataRepository.getCurrencyConfigs();
        for(let config of data.configs){
            let dbConfig = dbConfigs.find(c=>c.name==config.name);
            if(dbConfig){
                Object.assign(dbConfig, config);
            }else{
                dbConfig = config;
            }
            await this.dataRepository.saveCurrencyConfig(dbConfig);            
        }        
        await this.exchangeRatesService.loadExchangePairs();
    }
}