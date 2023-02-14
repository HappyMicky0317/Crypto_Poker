import { EthEvent } from "./eth-event";
import { Tx } from "./tx";

export class EthContractTransfer {
    
    constructor(public tx:Tx, public event:EthEvent) {                
    }
    
}