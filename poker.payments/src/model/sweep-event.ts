export class SweepEvent {
    erc20TokenName: string;
    weiAmount: string;

    address: string;
    incomingPaymentHash: string;

    checkSweep: boolean;
    pendingIncomingSweepTx: boolean;
    pendingIncomingSweepTxHash: string;
    pendingOutgoingSweepTx: boolean;
    pendingOutgoingSweepTxHashes: string[] = [];

}