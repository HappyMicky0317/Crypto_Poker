import { inject } from 'aurelia-framework';
import { Util } from "./util";

@inject(Util)
export class CryptoFormatValueConverter {

  constructor(private util: Util) { }
  toView(value, format):string {
    if (!value && value !== 0)
      return '';
    if (!format)
      format = this.util.currentTableConfig.currency;
    return this.util.fromSmallest(value, format) + '';    
  }
}
