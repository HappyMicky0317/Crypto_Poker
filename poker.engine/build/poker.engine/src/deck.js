"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deck = void 0;
class Deck {
    constructor() {
        this.cards = [];
        let suits = ['H', 'C', 'S', 'D'];
        for (let suitIndex in suits) {
            for (let i = 1; i <= 13; i++) {
                let cardRank = i + '';
                if (i === 1)
                    cardRank = 'A';
                else if (i === 11)
                    cardRank = 'J';
                else if (i === 12)
                    cardRank = 'Q';
                else if (i === 13)
                    cardRank = 'K';
                let card = cardRank + suits[suitIndex];
                this.cards.push(card);
            }
        }
    }
    getNextCard() {
        if (this.cards.length === 0)
            throw new Error("no cards left");
        var index = this.getRandomInt(0, this.cards.length - 1);
        let card = this.cards[index];
        this.cards.splice(index, 1);
        return card;
    }
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
exports.Deck = Deck;
//# sourceMappingURL=deck.js.map