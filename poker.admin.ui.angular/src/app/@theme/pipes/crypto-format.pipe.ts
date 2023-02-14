import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cryptoFormat' })
export class CryptoFormatPipe implements PipeTransform {

  transform(input: string): string {
    if(input){
      let tmp = parseFloat(input);
      if(!isNaN(tmp)){
        return (tmp / 100000000).toString();
      }
    }
    return input;
  }
}
