import { TableConfig } from './TableConfig';
import { PlayerTableHandle } from './table/PlayerTableHandle';

export class TableState {
    _id: string;
    tournamentId: string;
    config: TableConfig;
    players: PlayerTableState[];
    dealerSeat: number;
}

export class PlayerTableState {
    public guid: string;
    public screenName: string;
    public seat: number;
    public stack: string;
    public bet: string;
    public cumulativeBet: string;

    constructor(handle: PlayerTableHandle) {
        this.guid = handle.guid
        this.screenName = handle.screenName
        this.seat = handle.seat
        this.stack = handle.stack + ''
        this.bet = handle.bet + ''
        this.cumulativeBet = handle.cumulativeBet + ''
    }
}