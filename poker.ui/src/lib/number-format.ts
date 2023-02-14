import { inject } from 'aurelia-framework';
import { Util } from "./util";

@inject(Util)
export class NumberFormatValueConverter {

  constructor(private util: Util) { }
  toView(value, format) {
    let tableConfig = typeof format === 'object' ? format : null;
    if (format === 'usd')
      return this.util.formatNumber(value);    
    else
      return this.util.toDisplayAmount(value, tableConfig);
  }
}
