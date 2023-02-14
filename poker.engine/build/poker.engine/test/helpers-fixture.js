"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require('assert');
const decimal_1 = require("./../../poker.ui/src/shared/decimal");
const helpers_1 = require("../src/helpers");
const shared_helpers_1 = require("../src/shared-helpers");
const Currency_1 = require("../../poker.ui/src/shared/Currency");
describe('helpers-fixture', () => {
    it('convertToLocalAmount', async () => {
        let amount = shared_helpers_1.SharedHelpers.convertToLocalAmount(Currency_1.Currency.eth, 58307300000000000000);
        assert.equal(amount, '5830730000');
    });
    it('convertToLocalAmount with remainder', () => {
        let wei = '14999999999999999';
        let amount = shared_helpers_1.SharedHelpers.convertToLocalAmount(Currency_1.Currency.eth, wei);
        assert.equal(amount.toString(), '1499999.9999999999');
        let tmp = new decimal_1.Decimal(amount);
        let remainder = tmp.minus(tmp.floor());
        assert.equal(remainder.toString(), '0.9999999999');
    });
    it('removeItem', () => {
        let f1 = { name: 'one' };
        let f2 = { name: 'two' };
        let array = [f1, f2];
        (0, helpers_1.removeItem)(array, f1);
        (0, helpers_1.removeItem)(array, f1);
        assert.equal(1, array.length);
    });
});
//# sourceMappingURL=helpers-fixture.js.map