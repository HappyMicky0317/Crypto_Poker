import { inject } from 'aurelia-framework';


export class CapitalizeFirstValueConverter {

  constructor() { }
  toView(value):string {
    if (value && typeof (value) === 'string'){
      return value.slice(0, 1).toUpperCase() + value.slice(1);
    }
      return '';
    
  }
}
