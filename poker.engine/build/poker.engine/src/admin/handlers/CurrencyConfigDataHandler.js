"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyConfigDataHandler = void 0;
class CurrencyConfigDataHandler {
    constructor(dataRepository, exchangeRatesService) {
        this.dataRepository = dataRepository;
        this.exchangeRatesService = exchangeRatesService;
    }
    async run(data) {
        let dbConfigs = await this.dataRepository.getCurrencyConfigs();
        for (let config of data.configs) {
            let dbConfig = dbConfigs.find(c => c.name == config.name);
            if (dbConfig) {
                Object.assign(dbConfig, config);
            }
            else {
                dbConfig = config;
            }
            await this.dataRepository.saveCurrencyConfig(dbConfig);
        }
        await this.exchangeRatesService.loadExchangePairs();
    }
}
exports.CurrencyConfigDataHandler = CurrencyConfigDataHandler;
//# sourceMappingURL=CurrencyConfigDataHandler.js.map