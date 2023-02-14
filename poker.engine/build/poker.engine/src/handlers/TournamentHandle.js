"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentHandle = void 0;
class TournamentHandle {
    constructor() {
        this.tables = [];
        this.registrations = [];
        this.seated = [];
    }
    get id() {
        return this.tournament._id + '';
    }
}
exports.TournamentHandle = TournamentHandle;
//# sourceMappingURL=TournamentHandle.js.map