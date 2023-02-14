"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Decimal = void 0;
const decimal_js_1 = require("decimal.js");
class Decimal {
    constructor(val) {
        this.value = val instanceof decimal_js_1.Decimal ? val : new decimal_js_1.Decimal(val || 0);
        this.setText();
    }
    minus(val) {
        return new Decimal(this.value.minus(val.value));
    }
    add(val) {
        return new Decimal(this.value.add(val.value));
    }
    mul(val) {
        let valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
        return new Decimal(this.value.mul(valDec));
    }
    floor() {
        return new Decimal(this.value.floor());
    }
    abs() {
        return new Decimal(this.value.abs());
    }
    dividedBy(val) {
        let valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
        return new Decimal(this.value.dividedBy(valDec));
    }
    sub(val) {
        return new Decimal(this.value.sub(val.value));
    }
    greaterThan(val) {
        let valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
        return this.value.greaterThan(valDec);
    }
    greaterThanOrEqualTo(val) {
        return this.value.greaterThanOrEqualTo(val.value);
    }
    equals(val) {
        let valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
        return this.value.equals(valDec);
    }
    lessThan(val) {
        return val.value.greaterThan(this.value);
    }
    toFixed(decimalPlaces) {
        return this.value.toFixed(decimalPlaces);
    }
    setText() {
        this.text = this.value.toString();
    }
    toString() {
        return this.text;
    }
    toNumber() {
        return this.value.toNumber();
    }
    round(decimalPlaces) {
        return new Decimal(this.toFixed(decimalPlaces));
    }
}
exports.Decimal = Decimal;
//# sourceMappingURL=decimal.js.map