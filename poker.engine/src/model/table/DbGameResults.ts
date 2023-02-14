import { GameResultPlayer } from "./GameResultPlayer";

import { DbPotResult } from "./DbPotResult";

import { TableAuditEvent } from "./TableAuditEvent";

export class DbGameResults {
    players: GameResultPlayer[] = [];
    boardCards: string[];
    potResults: DbPotResult[] = [];
    tableId:string;
    tournamentId:string;
    currency:string;
    tableName: string;
    exchangeRate: number;
    auditEvents: TableAuditEvent[];
    smallBlind: number;
    bigBlind: number;
  }