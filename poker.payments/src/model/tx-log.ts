export class TxLog {    
    type: string;
    receipt: any;
    error: string;
    status: string;
    hash: string;
    rawTx: any;
    timestamp: Date;
    currency: string;
    erc20Name: string;
    relatedTxHash: string;
    from: string;
}