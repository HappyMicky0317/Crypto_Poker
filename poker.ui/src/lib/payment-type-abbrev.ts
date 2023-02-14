import { PaymentType } from "../shared/PaymentType";

export class PaymentTypeAbbrevValueConverter {
  
  toView(value):string {
    if(value==PaymentType.outgoing){
      return 'Out';
    }else if(value==PaymentType.incoming){
      return 'In';
    }
    return value;
    
  }
}
