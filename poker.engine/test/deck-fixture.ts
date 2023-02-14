import { Deck } from "../src/deck";

var assert = require('assert');

describe('#deck()', function () {

    
    var deck: Deck;
    beforeEach(function () {
        deck = new Deck();
        
    });


    it('getNumCards', function () {

        assert.equal(deck.cards[0], 'AH');
        assert.equal(deck.cards[1], '2H');
        assert.equal(deck.cards[2], '3H');
        assert.equal(deck.cards[3], '4H');
        assert.equal(deck.cards[4], '5H');
        assert.equal(deck.cards[5], '6H');
        assert.equal(deck.cards[6], '7H');
        assert.equal(deck.cards[7], '8H');
        assert.equal(deck.cards[8], '9H');
        assert.equal(deck.cards[9], '10H');
        assert.equal(deck.cards[10], 'JH');
        assert.equal(deck.cards[11], 'QH');
        assert.equal(deck.cards[12], 'KH');

        assert.equal(deck.cards[13], 'AC');
        assert.equal(deck.cards[14], '2C');
        assert.equal(deck.cards[15], '3C');
        assert.equal(deck.cards[16], '4C');
        assert.equal(deck.cards[17], '5C');
        assert.equal(deck.cards[18], '6C');
        assert.equal(deck.cards[19], '7C');
        assert.equal(deck.cards[20], '8C');
        assert.equal(deck.cards[21], '9C');
        assert.equal(deck.cards[22], '10C');
        assert.equal(deck.cards[23], 'JC');
        assert.equal(deck.cards[24], 'QC');
        assert.equal(deck.cards[25], 'KC');

        assert.equal(deck.cards[26], 'AS');
        assert.equal(deck.cards[27], '2S');
        assert.equal(deck.cards[28], '3S');
        assert.equal(deck.cards[29], '4S');
        assert.equal(deck.cards[30], '5S');
        assert.equal(deck.cards[31], '6S');
        assert.equal(deck.cards[32], '7S');
        assert.equal(deck.cards[33], '8S');
        assert.equal(deck.cards[34], '9S');
        assert.equal(deck.cards[35], '10S');
        assert.equal(deck.cards[36], 'JS');
        assert.equal(deck.cards[37], 'QS');
        assert.equal(deck.cards[38], 'KS');

        assert.equal(deck.cards[39], 'AD');
        assert.equal(deck.cards[40], '2D');
        assert.equal(deck.cards[41], '3D');
        assert.equal(deck.cards[42], '4D');
        assert.equal(deck.cards[43], '5D');
        assert.equal(deck.cards[44], '6D');
        assert.equal(deck.cards[45], '7D');
        assert.equal(deck.cards[46], '8D');
        assert.equal(deck.cards[47], '9D');
        assert.equal(deck.cards[48], '10D');
        assert.equal(deck.cards[49], 'JD');
        assert.equal(deck.cards[50], 'QD');
        assert.equal(deck.cards[51], 'KD');

        assert.equal(deck.cards.length, 52);
        
    });

    it('deal card reduces number of cards in deck', function() {

        let card1 = deck.getNextCard();

        let freshDesk = new Deck();
        var indexOfCard = freshDesk.cards.indexOf(card1);
        assert.equal(true, indexOfCard >= 0 && indexOfCard < 52, 'card index must be equal or greater than zero and less than 52. indexOfCard: ' + indexOfCard + ' card1: ' + card1);
        assert.equal(deck.cards.length, 51);

        let card2 = deck.getNextCard();
        indexOfCard = freshDesk.cards.indexOf(card2);
        assert.equal(true, indexOfCard >= 0 && indexOfCard < 52, 'card index must be equal or greater than zero and less than 52. indexOfCard: ' + indexOfCard + ' card1: ' + card1 + ' card2: ' + card2);
        assert.equal(deck.cards.length, 50);
    });

    it('deal all cards', function () {

        let cardSummary = '';
        for (let i = 0; i < 52; i++) {
            let card = deck.getNextCard();
            cardSummary += ' ' + card;
        }
        //console.log(cardSummary);
        assert.equal(deck.cards.length, 0);

    });

    it('deal more cards than deck', function () {

        for (let i = 0; i < 53; i++) {
            
            if (i < 52) {
                let card = deck.getNextCard();
                assert(card, `card at ${i} should have been defined`);
            } else {
                
                let error = "";
                try {
                    deck.getNextCard();
                } catch (err) {
                    error = err.message;
                }
                assert.equal(error, 'no cards left');
            }
            
        }        

    });

    

})