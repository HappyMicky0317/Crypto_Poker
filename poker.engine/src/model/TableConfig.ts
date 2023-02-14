export class TableConfig {

    
    constructor(name?: string, smallBlindUsd?: number, bigBlindUsd?: number, currency?: string, id?: string) {
        this.name = name;
        this.smallBlindUsd = smallBlindUsd;
        this.bigBlindUsd = bigBlindUsd;
        this.currency = currency;
        this._id = id;
    }
    

    _id: string;
    name: string;
    smallBlind?:number;
    smallBlindUsd:number;
    bigBlind?: number;
    bigBlindUsd: number;
    currency: string;
    exchangeRate?: number;
    timeToActSec: number;
    maxPlayers: number;
    orderIndex:number;
    maxBuyIn:number;
    rake:number;
}
