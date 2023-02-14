"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentResultRowView = exports.TournamentInfoResult = exports.TournamentInfoRequest = void 0;
class TournamentInfoRequest {
    constructor(tournamentId) {
        this.tournamentId = tournamentId;
    }
    getFieldName() {
        return "tournamentInfoRequest";
    }
}
exports.TournamentInfoRequest = TournamentInfoRequest;
class TournamentInfoResult {
}
exports.TournamentInfoResult = TournamentInfoResult;
class TournamentResultRowView {
    constructor(screenName, placing) {
        this.screenName = screenName;
        this.placing = placing;
    }
}
exports.TournamentResultRowView = TournamentResultRowView;
//# sourceMappingURL=TournamentInfoRequest.js.map