import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mongoIdToDate' })
export class MongoIdToDatePipe implements PipeTransform {

  transform(value: string): string {
    if(value){
      let timestamp = value.toString().substring(0, 8);
      let date = new Date(parseInt(timestamp, 16) * 1000);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    return value;
  }
}
