export class Deck {
    cards: string[] = [];

    constructor() {

        let suits = ['H', 'C', 'S', 'D'];
        for (let suitIndex in suits) {
            for (let i = 1; i <= 13; i++) {
                let cardRank = i+'';
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

    getNextCard(): string {
        if (this.cards.length === 0)
            throw new Error("no cards left");
        var index = this.getRandomInt(0, this.cards.length - 1);
        let card = this.cards[index];
        this.cards.splice(index, 1);
        return card;
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    private getRandomInt(min:number, max:number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
}