import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numberFormat' })
export class NumberFormatPipe implements PipeTransform {

  transform(x: string, currency:string): string {    
    if (this.isNumeric(x)){
      if(currency==='usd'){
        x = '' + parseFloat(x)/100; 
       }        
       return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");  
    }
    return '';
      
  }
  isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}
