"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRatesChangedHandler = void 0;
const DataContainer_1 = require("./../../../poker.ui/src/shared/DataContainer");
const Currency_1 = require("./../../../poker.ui/src/shared/Currency");
class ExchangeRatesChangedHandler {
    constructor(broadcastService, pokerTableProvider) {
        this.broadcastService = broadcastService;
        this.pokerTableProvider = pokerTableProvider;
    }
    run(arr) {
        let rates = arr.filter(r => r != null);
        let data = new DataContainer_1.DataContainer();
        data.exchangeRates = new DataContainer_1.ExchangeRateResult();
        data.exchangeRates.rates = rates;
        this.broadcastService.broadcast(data);
        for (let table of this.pokerTableProvider.getTables().filter(t => t.tableConfig.currency !== Currency_1.Currency.free)) {
            let exchangeRate = rates.find(r => r.base === table.tableConfig.currency);
            if (exchangeRate != null) {
                if (!table.currentPlayers) {
                    table.updateExchangeRate(exchangeRate.price);
                    table.sendDataContainer(table.getTableConfigUpdate());
                }
                else {
                    table.pendingExchangeRate = exchangeRate.price;
                }
            }
        }
    }
}
exports.ExchangeRatesChangedHandler = ExchangeRatesChangedHandler;
//# sourceMappingURL=ExchangeRatesChangedHandler.js.map