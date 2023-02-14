import { AddressInfo } from "../../../model/AddressInfo";
import { UserSmall } from "../../../model/UserSmall";

export class DepositAddressTrigger {
    user:UserSmall;
    currency: string;
    address: string;
    depositIndex:number;    
}