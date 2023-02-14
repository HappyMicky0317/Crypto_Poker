"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyUnit = exports.Currency = void 0;
class Currency {
}
exports.Currency = Currency;
Currency.free = 'usd';
Currency.dash = 'dash';
Currency.bcy = 'bcy';
Currency.eth = 'eth';
Currency.beth = 'beth';
Currency.btc = 'btc';
Currency.tournament = 'tournament';
Currency.freeStartingAmount = 100000;
class CurrencyUnit {
    static getCurrencyUnit(currency) {
        if (currency === Currency.free)
            return CurrencyUnit.free;
        else if (currency === Currency.tournament)
            return 1;
        else
            return 100000000;
    }
}
exports.CurrencyUnit = CurrencyUnit;
CurrencyUnit.free = 100;
CurrencyUnit.dash = 100000000;
CurrencyUnit.bcy = 100000000;
CurrencyUnit.eth = 100000000;
CurrencyUnit.btc = 100000000;
CurrencyUnit.default = 100000000;
//# sourceMappingURL=Currency.js.map