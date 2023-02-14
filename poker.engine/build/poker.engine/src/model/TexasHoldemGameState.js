"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandEvaluatorResult = exports.PlayerAllocationResult = exports.PotResult = exports.GamePotResult = exports.GamePot = exports.TexasHoldemGameState = void 0;
const poker_evaluator_1 = require("../poker-evaluator");
var _ = require('lodash');
class TexasHoldemGameState {
    constructor() {
        this.pots = [];
    }
    allocateWinners() {
        let result = new GamePotResult();
        for (let pot of this.pots) {
            result.potResults.push(this.getPotResult(pot));
        }
        return result;
    }
    allocatePots(players) {
        let filteredPlayers = players.filter(p => p.cumulativeBet > 0);
        let groups = _.groupBy(filteredPlayers, (p) => p.cumulativeBet);
        let sortedKeys = _.keys(groups).sort((k1, k2) => { return k1 - k2; });
        let pots = [];
        let potIndex = 0;
        for (let amountStr of sortedKeys) {
            let amount = parseFloat(amountStr);
            let pot = new GamePot();
            for (let player of filteredPlayers) {
                if (player.cumulativeBet >= amount) {
                    pot.players.push(player);
                }
            }
            let potAmount = amount - (potIndex > 0 ? sortedKeys[potIndex - 1] : 0);
            pot.amount = potAmount * pot.players.length;
            pots.push(pot);
            potIndex++;
        }
        let playerCounts = pots.map(p => p.players.length);
        let playersWhoCanWinFunc = (p) => !p.hasFolded && p.holecards && p.holecards.length > 0;
        let potsWithNoPlayers = [];
        for (let pot of pots.slice()) {
            pot.players = pot.players.filter(playersWhoCanWinFunc);
            if (pot.players.length == 0) {
                potsWithNoPlayers.push(pot);
                pots.splice(pots.indexOf(pot), 1);
            }
        }
        if (pots.length == 0) {
            let pot = new GamePot();
            pot.amount = 0;
            pot.players = players.filter(playersWhoCanWinFunc);
            pots.push(pot);
        }
        for (let pot of pots.slice()) {
            if (playerCounts[pots.indexOf(pot)] === 1)
                continue;
            let moveToPot = this.getPotWithSamePlayers(pots, pot);
            let tmpIndex = pots.indexOf(moveToPot);
            if (moveToPot != null && playerCounts[tmpIndex] > 1) {
                pots.splice(pots.indexOf(pot), 1);
                moveToPot.amount += pot.amount;
            }
        }
        if (potsWithNoPlayers.length) {
            for (let pot of potsWithNoPlayers) {
                let potsWithPlayers = pots.filter(p => p.players.length > 0);
                if (potsWithPlayers.length) {
                    let lastPotWithPlayers = potsWithPlayers[potsWithPlayers.length - 1];
                    lastPotWithPlayers.amount += pot.amount;
                }
                else {
                }
            }
        }
        this.pots = pots;
    }
    getPotWithSamePlayers(pots, thisPot) {
        for (let pot of pots) {
            if (pot === thisPot)
                continue;
            if (pot.players.length == thisPot.players.length) {
                let allMatch = false;
                for (let player of pot.players) {
                    if (!thisPot.players.find(p => p === player)) {
                        allMatch = false;
                        break;
                    }
                    return pot;
                }
            }
        }
        return null;
    }
    getPotResult(pot) {
        let potResult = new PotResult();
        let i = 0;
        let maxScore = 0;
        let maxRank = 0;
        let winners = [];
        let remainingPlayers = pot.players.filter(p => !p.hasFolded && p.holecards && p.holecards.length);
        if (remainingPlayers.length == 1) {
            winners.push(new HandEvaluatorResult(remainingPlayers[0]));
        }
        else {
            for (let player of remainingPlayers) {
                let hand = this.boardCards.concat(player.holecards);
                let handResult = poker_evaluator_1.PokerEvaluator.rankHand(hand);
                handResult.player = player;
                potResult.playerHandEvaluatorResults.push(handResult);
                if (handResult.handRank > maxRank) {
                    maxRank = handResult.handRank;
                    maxScore = handResult.score;
                }
                else if (handResult.handRank === maxRank) {
                    maxScore = Math.max(maxScore, handResult.score);
                }
                i++;
            }
            winners = potResult.playerHandEvaluatorResults.filter((r) => r.handRank === maxRank && r.score === maxScore);
        }
        if (!winners.length) {
            throw new Error(`no winners: ${JSON.stringify(pot)}`);
        }
        let winAmount = Math.floor(pot.amount / winners.length);
        for (let evalResult of winners) {
            let r = new PlayerAllocationResult();
            r.player = evalResult.player;
            r.amount = winAmount;
            potResult.allocations.push(r);
        }
        return potResult;
    }
}
exports.TexasHoldemGameState = TexasHoldemGameState;
class GamePot {
    constructor() {
        this.players = [];
    }
}
exports.GamePot = GamePot;
class GamePotResult {
    constructor() {
        this.potResults = [];
    }
}
exports.GamePotResult = GamePotResult;
class PotResult {
    constructor() {
        this.allocations = [];
        this.playerHandEvaluatorResults = [];
    }
}
exports.PotResult = PotResult;
class PlayerAllocationResult {
}
exports.PlayerAllocationResult = PlayerAllocationResult;
class HandEvaluatorResult {
    constructor(player) {
        this.bestHandCards = [];
        this.player = player;
    }
}
exports.HandEvaluatorResult = HandEvaluatorResult;
//# sourceMappingURL=TexasHoldemGameState.js.map