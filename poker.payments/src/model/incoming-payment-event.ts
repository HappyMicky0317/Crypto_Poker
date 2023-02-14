import { EthContractTransfer } from './eth-contract-transfer';
import { AddressInfo } from "./AddressInfo";

export class IncomingPaymentEvent {

    instantlock: boolean;
    lastInputAddr: string;
    currency: string;
    sweepFee: string;
    constructor(public address: string, public amount: string, public confirmations: number, public txHash:string) {


    }
}