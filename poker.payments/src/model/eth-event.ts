export class EthEvent {
    blockNumber:number;
    transactionHash:string;
    returnValues:EthEventReturnValues;
}

export class EthEventReturnValues {
    from:string;
    to:string;
    value:number;
}