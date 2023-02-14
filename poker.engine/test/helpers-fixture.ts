var assert = require('assert');
import { Helpers } from '../src/helpers';
import { Decimal } from './../../poker.ui/src/shared/decimal';
import { removeItem } from "../src/helpers";
import { SharedHelpers } from '../src/shared-helpers';
import { Currency } from '../../poker.ui/src/shared/Currency';

describe('helpers-fixture', () => {
    
 it('convertToLocalAmount', async () => {
    let amount = SharedHelpers.convertToLocalAmount(Currency.eth, 58307300000000000000);
    assert.equal(amount, '5830730000');                         
  });

  it('convertToLocalAmount with remainder', () => {
    let wei = '14999999999999999';
    let amount = SharedHelpers.convertToLocalAmount(Currency.eth, wei);
    assert.equal(amount.toString(), '1499999.9999999999');
    let tmp = new Decimal(amount);
    let remainder = tmp.minus(tmp.floor());
    assert.equal(remainder.toString(), '0.9999999999');    
  })

  it('removeItem', () => {
    let f1 = { name: 'one'};
    let f2 = { name: 'two'};
    let array = [ f1, f2];
    
    removeItem(array, f1);
    removeItem(array, f1);
    assert.equal(1, array.length);    
  });

});