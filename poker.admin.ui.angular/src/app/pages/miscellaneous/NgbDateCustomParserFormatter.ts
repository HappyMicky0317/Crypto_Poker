import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { Injectable } from '@angular/core';
import { isNumber, toInteger, padNumber } from '@ng-bootstrap/ng-bootstrap/esm5/util/util';

//adapted from https://github.com/ng-bootstrap/ng-bootstrap/issues/2072
@Injectable()
export class NgbDateCustomParserFormatter extends NgbDateParserFormatter {
  month_names_short :string[] =  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  parse(value: string): NgbDateStruct {
    let result:NgbDateStruct = null;
    if (value) {
      const dateParts = value.trim().split('-');
      if(dateParts.length){
        result = { day: null, month:null, year: null }
      }
      if (dateParts.length >= 1 && isNumber(dateParts[0])) {
        result.day = toInteger(dateParts[0]);
      } 
      let month = -1;
      if(dateParts.length >= 1){
        month = this.month_names_short.indexOf(dateParts[1]);
        if(month > -1){
          month = month+1;
        }
        result.month;
      }
      if(dateParts.length === 3){
        result.year = toInteger(dateParts[2]);
      }            
    }
    return result;
  }

  format(date: NgbDateStruct): string {
    return date ?
        `${isNumber(date.day) ? padNumber(date.day) : ''}-${isNumber(date.month) ? this.month_names_short[date.month-1] : ''}-${date.year}` :
        '';
  }
  
  
}