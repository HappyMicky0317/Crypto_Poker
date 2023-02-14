import { DataContainer, ExchangeRateResult  } from './../../../poker.ui/src/shared/DataContainer';
import { Currency } from './../../../poker.ui/src/shared/Currency';
import { ExchangeRate } from "../../../poker.ui/src/shared/ExchangeRate";
import { IBroadcastService, IPokerTableProvider } from './IBroadcastService';

export class ExchangeRatesChangedHandler {
    
    constructor(private broadcastService:IBroadcastService, private pokerTableProvider:IPokerTableProvider) {
                
    }

    run(arr: ExchangeRate[]) {
        let rates = arr.filter(r => r != null);
        let data = new DataContainer();
        data.exchangeRates = new ExchangeRateResult();
        data.exchangeRates.rates = rates
        this.broadcastService.broadcast(data);

        for(let table of this.pokerTableProvider.getTables().filter(t=>t.tableConfig.currency !== Currency.free)){
            let exchangeRate = rates.find(r => r.base === table.tableConfig.currency);
            if(exchangeRate != null){
                if(!table.currentPlayers){
                    table.updateExchangeRate(exchangeRate.price);                         
                    table.sendDataContainer(table.getTableConfigUpdate());                
                }else{
                    table.pendingExchangeRate = exchangeRate.price;
                }
            }
        }
    }
}