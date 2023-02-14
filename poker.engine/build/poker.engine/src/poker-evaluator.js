"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokerEvaluator = void 0;
const TexasHoldemGameState_1 = require("./model/TexasHoldemGameState");
const CommonHelpers_1 = require("../../poker.ui/src/shared/CommonHelpers");
class PokerEvaluator {
    static rankHand(arr) {
        let result = new TexasHoldemGameState_1.HandEvaluatorResult(null);
        let str = this.convert(arr);
        let wci = [];
        var index = 10, i, e;
        let bestHand = '';
        if (str.match(/((?:\s*)(10|[2-9]|[J|Q|K|A])[♠|♣|♥|♦](?:\s*)){5,7}/g) !== null) {
            var cardStr = str.replace(/A/g, "14").replace(/K/g, "13").replace(/Q/g, "12")
                .replace(/J/g, "11").replace(/♠|♣|♥|♦/g, ",");
            let cards = cardStr.replace(/\s/g, '').slice(0, -1).split(",");
            var suits = str.match(/♠|♣|♥|♦/g);
            if (cards !== null && suits !== null) {
                if (cards.length == suits.length) {
                    var o = {}, keyCount = 0, j;
                    for (i = 0; i < cards.length; i++) {
                        e = cards[i] + suits[i];
                        o[e] = 1;
                    }
                    for (j in o) {
                        if (o.hasOwnProperty(j)) {
                            keyCount++;
                        }
                    }
                    if (cards.length >= 5) {
                        if (cards.length == suits.length && cards.length == keyCount) {
                            for (i = 0; i < cards.length; i++) {
                                cards[i] -= 0;
                            }
                            for (i = 0; i < suits.length; i++) {
                                suits[i] = Math.pow(2, (suits[i].charCodeAt(0) % 9824));
                            }
                            var c = this.getCombinations(5, cards.length);
                            var maxRank = 0, winIndex = 10;
                            for (i = 0; i < c.length; i++) {
                                var cs = [cards[c[i][0]], cards[c[i][1]], cards[c[i][2]], cards[c[i][3]], cards[c[i][4]]];
                                var ss = [suits[c[i][0]], suits[c[i][1]], suits[c[i][2]], suits[c[i][3]], suits[c[i][4]]];
                                index = this.calcIndex(cs, ss);
                                if (this.handRanks[index] > maxRank) {
                                    maxRank = this.handRanks[index];
                                    winIndex = index;
                                    wci = c[i].slice();
                                    result.score = this.getPokerScore(cs, maxRank);
                                    result.handRank = maxRank;
                                    result.handRankEnglish = this.hands[index];
                                }
                                else if (this.handRanks[index] == maxRank) {
                                    var score1 = this.getPokerScore(cs, maxRank);
                                    var score2 = this.getPokerScore([cards[wci[0]], cards[wci[1]], cards[wci[2]], cards[wci[3]], cards[wci[4]]], maxRank);
                                    if (score1 > score2) {
                                        wci = c[i].slice();
                                        result.score = score1;
                                        result.handRank = maxRank;
                                        result.handRankEnglish = this.hands[index];
                                    }
                                }
                            }
                            index = winIndex;
                        }
                    }
                    result.bestHandCards = [];
                    for (var x = 0; x < wci.length; x++) {
                        bestHand += arr[wci[x]];
                        result.bestHandCards.push(arr[wci[x]]);
                    }
                }
            }
        }
        result.bestHand = bestHand;
        return result;
    }
    static getPokerScore(cs, handRank) {
        let arr = cs.slice();
        let d = {};
        let i;
        if (handRank === 9 || handRank === 5) {
            if (cs.find(c => c === 2)) {
                for (var j = 0; j < arr.length; j++) {
                    if (arr[j] === 14)
                        arr[j] = 1;
                }
            }
        }
        for (i = 0; i < 5; i++) {
            d[arr[i]] = (d[arr[i]] >= 1) ? d[arr[i]] + 1 : 1;
        }
        arr.sort(function (a, b) {
            return (d[a] < d[b]) ? +1 : (d[a] > d[b]) ? -1 : (b - a);
        });
        var score = arr[0] << 16 | arr[1] << 12 | arr[2] << 8 | arr[3] << 4 | arr[4];
        return score;
    }
    static calcIndex(cs, ss) {
        var v, i, o, s;
        for (i = -1, v = o = 0; i < 5; i++, o = Math.pow(2, cs[i] * 4)) {
            v += o * ((v / o & 15) + 1);
        }
        if ((v %= 15) != 5) {
            return v - 1;
        }
        else {
            s = 1 << cs[0] | 1 << cs[1] | 1 << cs[2] | 1 << cs[3] | 1 << cs[4];
        }
        v -= ((s / (s & -s) == 31) || (s == 0x403c) ? 3 : 1);
        let tmp = (ss[0] == (ss[0] | ss[1] | ss[2] | ss[3] | ss[4])) ? 1 : 0;
        return v - tmp * ((s == 0x7c00) ? -5 : 1);
    }
    static getCombinations(k, n) {
        var result = [], comb = [];
        function next_comb(comb, k, n) {
            let i;
            if (comb.length === 0) {
                for (i = 0; i < k; ++i) {
                    comb[i] = i;
                }
                return true;
            }
            i = k - 1;
            ++comb[i];
            while ((i > 0) && (comb[i] >= n - k + 1 + i)) {
                --i;
                ++comb[i];
            }
            if (comb[0] > n - k) {
                return false;
            }
            for (i = i + 1; i < k; ++i) {
                comb[i] = comb[i - 1] + 1;
            }
            return true;
        }
        while (next_comb(comb, k, n)) {
            result.push(comb.slice());
        }
        return result;
    }
    static convert(arr) {
        var text = "";
        for (var i = 0; i < arr.length; i++) {
            let suit = '';
            var card = arr[i];
            var lastChar = card[card.length - 1];
            text += card.substring(0, card.length - 1);
            suit = (0, CommonHelpers_1.getCardSuit)(lastChar);
            text += suit;
        }
        return text;
    }
}
exports.PokerEvaluator = PokerEvaluator;
PokerEvaluator.hands = ["4 of a Kind", "Straight Flush", "Straight", "Flush", "High Card",
    "1 Pair", "2 Pair", "Royal Flush", "3 of a Kind", "Full House", "-Invalid-"];
PokerEvaluator.handRanks = [8, 9, 5, 6, 1, 2, 3, 10, 4, 7, 0];
//# sourceMappingURL=poker-evaluator.js.map