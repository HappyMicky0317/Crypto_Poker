"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlindConfigView = exports.TournmanetView = void 0;
class TournmanetView {
    constructor() {
        this._id = undefined;
        this.name = undefined;
        this.prizes = undefined;
        this.currency = undefined;
        this.startTime = undefined;
        this.startingChips = undefined;
        this.playersPerTable = undefined;
        this.minPlayers = undefined;
        this.maxPlayers = undefined;
        this.blindConfig = undefined;
        this.timeToActSec = undefined;
        this.statusText = undefined;
        this.registrations = [];
        this.lateRegistrationMin = undefined;
        this.awardPrizesAfterMinutes = undefined;
        this.mailchimpSendTimeMin = undefined;
        this.telegramSendTimeMin = undefined;
        this.buyIn = undefined;
        this.housePrize = undefined;
        this.rebuyForMin = undefined;
        this.rebuyAmount = undefined;
    }
}
exports.TournmanetView = TournmanetView;
class BlindConfigView {
    constructor(smallBlind, bigBlind, timeMin) {
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.timeMin = timeMin;
    }
}
exports.BlindConfigView = BlindConfigView;
//# sourceMappingURL=tournament-view.js.map