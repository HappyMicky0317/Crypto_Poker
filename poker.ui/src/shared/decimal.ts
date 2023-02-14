import { Decimal as DecimalJS } from 'decimal.js';

export class Decimal {

    constructor(val: string | number | DecimalJS) {
        this.value = val instanceof DecimalJS ? val : new DecimalJS(val||0);
        this.setText();
    }
    value: DecimalJS; 
    text: string;

    minus(val: Decimal): Decimal {
        return new Decimal(this.value.minus(val.value));
    }
    add(val: Decimal): Decimal {
        return new Decimal(this.value.add(val.value));
    }
    mul(val: Decimal | number): Decimal {
        let valDec: DecimalJS = val instanceof Decimal ? val.value : new DecimalJS(val);
        return new Decimal(this.value.mul(valDec));
    }
    floor(): Decimal{
      return new Decimal(this.value.floor());
    }

    abs(): Decimal {
        return new Decimal(this.value.abs());
    }

    dividedBy(val: Decimal | number): Decimal {        
        let valDec: DecimalJS = val instanceof Decimal ? val.value : new DecimalJS(val);
        return new Decimal(this.value.dividedBy(valDec));
    }
    sub(val: Decimal): Decimal {
        return new Decimal(this.value.sub(val.value));
    }

    greaterThan(val: Decimal | number): boolean {
        let valDec: DecimalJS = val instanceof Decimal ? val.value : new DecimalJS(val);
        return this.value.greaterThan(valDec);
    }
    greaterThanOrEqualTo(val: Decimal): boolean {        
        return this.value.greaterThanOrEqualTo(val.value);
    }
    equals(val: Decimal | number): boolean {
        let valDec: DecimalJS = val instanceof Decimal ? val.value : new DecimalJS(val);
        return this.value.equals(valDec);
    }
    lessThan(val: Decimal): boolean {
        return val.value.greaterThan(this.value);
    }

    toFixed(decimalPlaces: number): string {
        return this.value.toFixed(decimalPlaces);
    }

    setText() {
        this.text = this.value.toString();
    }
    toString() {
        return this.text;
    }
    toNumber(): number {
        return this.value.toNumber();
    }    
    round(decimalPlaces:number) : Decimal{
      return new Decimal(this.toFixed(decimalPlaces));
    }
}
