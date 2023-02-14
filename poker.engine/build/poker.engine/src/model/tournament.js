"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindConfig = exports.Tournament = void 0;
class Tournament {
    constructor() {
        this.hasAwardedPrizes = false;
    }
}
exports.Tournament = Tournament;
class BlindConfig {
    constructor(smallBlind, bigBlind, timeMin) {
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.timeMin = timeMin;
    }
}
exports.BlindConfig = BlindConfig;
//# sourceMappingURL=tournament.js.map