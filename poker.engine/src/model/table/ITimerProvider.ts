import { Table } from "../../table";

export interface ITimerProvider {
    startTimer(handler: () => void, timeoutMs: number, table:Table): any;
  }