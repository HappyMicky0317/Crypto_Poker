"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordinal_suffix_of = exports.numberWithCommas = exports.isNumeric = exports.getCardSuit = exports.CommonHelpers = void 0;
const Currency_1 = require("./Currency");
class CommonHelpers {
    static allowAutoFold(guid, currentPlayers) {
        let result = { allowAutoFold: false, allowAutoCheck: false, autoFoldButtonText: '' };
        let playerNextToAct = currentPlayers.find(s => s.myturn);
        let currentPlayer = currentPlayers.find(p => p.guid === guid);
        if (playerNextToAct && currentPlayer && currentPlayer.playing && !currentPlayer.myturn && !currentPlayer.hasFolded) {
            let betAmounts = currentPlayers.map(s => s.bet);
            let maxBet = Math.max.apply(null, betAmounts);
            result.allowAutoFold = true;
            let hasCalledOrRaised = currentPlayer.hasCalled || currentPlayer.hasRaised;
            if (currentPlayer.bet == maxBet && !hasCalledOrRaised) {
                result.allowAutoCheck = true;
            }
            if (hasCalledOrRaised && currentPlayer.bet == maxBet)
                result.autoFoldButtonText = 'Fold any Raise';
            else
                result.autoFoldButtonText = maxBet > 0 && currentPlayer.bet < maxBet ? 'Fold' : 'Check/Fold';
        }
        return result;
    }
    static getTxHashLink(txHash, currency) {
        if (currency == Currency_1.Currency.dash) {
            return `https://chainz.cryptoid.info/dash/tx.dws?${txHash}.htm`;
        }
        else if (currency == Currency_1.Currency.eth || currency == 'ukg' || currency == 'chp') {
            return `https://etherscan.io/tx/${txHash}`;
        }
        else if (currency == Currency_1.Currency.btc) {
            return `https://www.blockchain.com/btc/tx/${txHash}`;
        }
        return txHash;
    }
}
exports.CommonHelpers = CommonHelpers;
function to(promise) {
    return promise.then(data => {
        return [null, data];
    })
        .catch(err => [err]);
}
exports.default = to;
function getCardSuit(card) {
    let suit = '';
    if (card === 'S')
        suit = '♠';
    else if (card === 'C')
        suit = '♣';
    else if (card === 'H')
        suit = '♥';
    else if (card === 'D')
        suit = '♦';
    else
        throw new Error('invalid lastChar:' + card);
    return suit;
}
exports.getCardSuit = getCardSuit;
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
exports.isNumeric = isNumeric;
function numberWithCommas(x) {
    if (isNumeric(x))
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return '';
}
exports.numberWithCommas = numberWithCommas;
function ordinal_suffix_of(i) {
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}
exports.ordinal_suffix_of = ordinal_suffix_of;
//# sourceMappingURL=CommonHelpers.js.map