"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentResultView = exports.AdminTournamentResultsView = void 0;
class AdminTournamentResultsView {
    constructor() {
        this.results = [];
    }
}
exports.AdminTournamentResultsView = AdminTournamentResultsView;
class TournamentResultView {
    constructor(screenName, placing, prize) {
        this.screenName = screenName;
        this.placing = placing;
        this.prize = prize;
    }
}
exports.TournamentResultView = TournamentResultView;
//# sourceMappingURL=AdminTournamentResultsView.js.map