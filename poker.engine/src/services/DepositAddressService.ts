import { IDepositAddressService } from "./IDepositAddressService";
import { Currency } from "../../../poker.ui/src/shared/Currency";
import * as DashDepositAddressService from "./DashDepositAddressService";
import * as BtcDepositAddressService from "./BtcDepositAddressService";
import * as EthDepositAddressService from "./EthDepositAddressService";

// 

export class DepositAddressService implements IDepositAddressService{
    
    constructor(){

    }
    
    async getAddress(currency: string, xpub:string, index: number): Promise<string> {

        if(currency==Currency.dash){
            return DashDepositAddressService.genAddr(xpub, index);
        }else if(currency==Currency.eth){
            return EthDepositAddressService.genAddr(xpub, index);
        }else if(currency==Currency.btc){
            return BtcDepositAddressService.genAddr(xpub, index);
        }
        throw new Error(`currency not supported: ${currency}`);
    }

    

}