"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRatesService = void 0;
const ExchangeRate_1 = require("../../../poker.ui/src/shared/ExchangeRate");
var log4js = require('log4js');
var logger = log4js.getLogger();
const shared_helpers_1 = require("../shared-helpers");
const environment_1 = __importDefault(require("../environment"));
const Http_1 = require("./Http");
const http = new Http_1.Http();
class ExchangeRatesService {
    constructor(dataRepository, exchangeRatesChangedHandler) {
        this.dataRepository = dataRepository;
        this.exchangeRatesChangedHandler = exchangeRatesChangedHandler;
        this.currencies = [];
    }
    async startPolling() {
        await this.loadExchangePairs();
        return this.pollExchangeRateApi();
    }
    async loadExchangePairs() {
        let currencyConfig = await this.dataRepository.getCurrencyConfigs();
        this.currencies = currencyConfig.filter(c => !c.doNotPoll).map(t => new ExchangePollPair(t.name, t.exchange));
    }
    async pollExchangeRateApi() {
        let arr = await this.pollCurrencies();
        for (let exchangeRate of arr) {
            await this.dataRepository.saveExchangeRate(exchangeRate);
        }
        this.exchangeRatesChangedHandler.run(arr);
        if (!environment_1.default.debug)
            setTimeout(this.pollExchangeRateApi.bind(this), 60000);
    }
    async pollCurrencies() {
        let arr = [];
        if (this.currencies.length) {
            let currencyQuery = this.currencies.map(c => c.currency.toUpperCase()).join(',');
            let url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${currencyQuery}&tsyms=USD`;
            let [err, data] = await (0, shared_helpers_1.to)(http.get(url));
            if (data) {
                for (let key in data.RAW) {
                    let currencyObj = data.RAW[key].USD;
                    if (!isNaN(parseFloat(currencyObj.PRICE)) && !isNaN(parseFloat(currencyObj.VOLUME24HOUR)) && !isNaN(parseFloat(currencyObj.CHANGE24HOUR))) {
                        let exchangeRate = new ExchangeRate_1.ExchangeRate();
                        exchangeRate.base = key.toLowerCase();
                        exchangeRate.target = 'usd';
                        exchangeRate.price = currencyObj.PRICE;
                        exchangeRate.volume = Math.round(currencyObj.VOLUME24HOUR);
                        exchangeRate.change = currencyObj.CHANGE24HOUR;
                        arr.push(exchangeRate);
                    }
                    else {
                        logger.info(`could not parse poll data ${JSON.stringify(currencyObj)}`);
                    }
                }
            }
            else {
                logger.info('pollCurrency error: ' + err);
            }
        }
        return arr;
    }
    async pollCurrency2(pair) {
        let url;
        if (pair.exchange == "hitbtc") {
            url = `https://api.hitbtc.com/api/1/public/CHPETH/ticker`;
        }
        else {
            url = `https://api.cryptonator.com/api/ticker/${pair.currency}-usd`;
        }
        let exchangeRate;
        let [err, data] = await (0, shared_helpers_1.to)(http.get(url));
        if (data) {
            if (pair.exchange == "hitbtc") {
                if (data.last) {
                    let ethExchangeRate = await this.dataRepository.getExchangeRate('eth');
                    if (ethExchangeRate && ethExchangeRate.price) {
                        exchangeRate = new ExchangeRate_1.ExchangeRate();
                        exchangeRate.base = pair.currency.toLowerCase();
                        exchangeRate.target = "usd";
                        let price = parseFloat(data.last);
                        price = parseFloat((price * ethExchangeRate.price).toFixed(2));
                        exchangeRate.price = price;
                        exchangeRate.volume = parseFloat(data.volume);
                    }
                }
            }
            else {
                if (data.success) {
                    exchangeRate = new ExchangeRate_1.ExchangeRate();
                    exchangeRate.base = data.ticker.base.toLowerCase();
                    exchangeRate.target = data.ticker.target.toLowerCase();
                    exchangeRate.price = parseFloat(parseFloat(data.ticker.price).toFixed(2));
                    exchangeRate.volume = parseFloat(data.ticker.volume);
                    exchangeRate.change = parseFloat(data.ticker.change);
                }
            }
        }
        else {
            logger.info('pollCurrency error: ' + err);
        }
        return exchangeRate;
    }
}
exports.ExchangeRatesService = ExchangeRatesService;
class ExchangePollPair {
    constructor(currency, exchange) {
        this.currency = currency;
        this.exchange = exchange;
    }
}
//# sourceMappingURL=ExchangeRatesService.js.map