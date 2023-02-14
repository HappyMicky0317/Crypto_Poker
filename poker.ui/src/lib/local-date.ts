import * as moment from 'moment';

export class LocalDateValueConverter {

  constructor() { }
  toView(value:string, format:string):string {
    if (value && typeof (value) === 'string'){
      if(!format){
        format = 'D MMM HH:mm';
      }
      return moment(value).format(format);
    }
      return '';
    
  }
}
