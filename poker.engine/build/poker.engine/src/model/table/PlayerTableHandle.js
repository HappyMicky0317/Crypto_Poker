"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerTableHandle = void 0;
const DataContainer_1 = require("../../../../poker.ui/src/shared/DataContainer");
class PlayerTableHandle {
    constructor(guid, screenName, gravatar, seat) {
        this.guid = guid;
        this.screenName = screenName;
        this.gravatar = gravatar;
        this.playing = false;
        this.sitOutNextHand = false;
        this.holecards = [];
        this.bet = 0;
        this.cumulativeBet = 0;
        this.empty = false;
        this.seat = seat;
    }
    toTableSeatEvent() {
        let event = new DataContainer_1.TableSeatEvent();
        event.name = this.screenName;
        event.seat = this.seat;
        event.playing = this.playing;
        event.stack = this.stack;
        event.empty = this.empty;
        event.bet = this.bet;
        event.hasFolded = this.hasFolded;
        event.myturn = this.myturn;
        event.hasRaised = this.hasRaised;
        event.hasCalled = this.hasCalled;
        event.isSittingOut = this.isSittingOut;
        return event;
    }
    setBet(amount) {
        if (!this.bet)
            this.bet = 0;
        this.bet += amount;
        this.cumulativeBet += amount;
        this.stack -= amount;
        if (this.stack < 0) {
            throw new Error(`stack cannot be less than zero ${amount}`);
        }
    }
}
exports.PlayerTableHandle = PlayerTableHandle;
//# sourceMappingURL=PlayerTableHandle.js.map