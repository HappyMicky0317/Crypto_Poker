import { Table } from './../table';
import { Tournament } from "../model/tournament";
import { TableProcessor } from '../admin/processor/table-processor/TableProcessor';
import { TournamentRegistration } from '../model/TournamentRegistration';
export class TournamentHandle {
    tournament: Tournament;
    processor: TableProcessor;
    tables: Table[] = [];
    registrations: TournamentRegistration[] = [];
    seated: string[] = [];

    get id() {
        return this.tournament._id + '';
    }
}