var assert = require('assert');
import { PokerEvaluator } from "../src/poker-evaluator";
import {TexasHoldemGameState, GamePot } from "../src/model/TexasHoldemGameState";
import { IPlayer } from "../src/model/table/IPlayer";
var _ = require('lodash');
const util = require('util');

describe('PokerEvaluator', function() {
   
  let getPlayer = function (holecards: string[], cumulativeBet?: number, hasFolded?: boolean): IPlayer {
    let player: IPlayer =
    {
        holecards: holecards,
        cumulativeBet: cumulativeBet,
        hasFolded: hasFolded
      }
    return player;
  }
  it('rankHand', function () {
    
    let result = PokerEvaluator.rankHand(['2S', '3S', '4S', '5S', '6S', '7S', '8S']);
    assert.equal(result.bestHand, '4S5S6S7S8S');
    assert.equal(result.handRankEnglish, 'Straight Flush');

    result = PokerEvaluator.rankHand(['2S', '3S', '4S', 'AH', '6S', '10D', '8C']);
    assert.equal(result.bestHand, '4SAH6S10D8C');
    assert.equal(result.handRankEnglish, 'High Card');

    result = PokerEvaluator.rankHand(['2S', '3S', '4S', 'AH', '6S', '10D', '8S']);
    assert.equal(result.bestHand, '2S3S4S6S8S');
    assert.equal(result.handRankEnglish, 'Flush');
  });

  

  it('play board', function () {

    let pot = new GamePot();    
    let state = new TexasHoldemGameState();
    state.boardCards = ['2S', '3S', '4S', '5S', '6S'];    
    pot.amount = 100;
    let player1 = getPlayer(['KD', 'KH']);
    pot.players.push(player1);
    let player2 = getPlayer(['AD', 'AH']);
    pot.players.push(player2);    
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].playerHandEvaluatorResults.length, 2);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[0].score, 414770);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[1].score, 414770);
  });

  it('high card vs pair vs high card', function () {
        
    let pot = new GamePot();
    let state = new TexasHoldemGameState();
    state.boardCards = ['4S', '6S', '8S', '10D', 'KC'];
    pot.amount = 100;
    let player1 = getPlayer(['JC', 'AH']);
    pot.players.push(player1);
    let player2 = getPlayer(['2H', 'KS']);
    pot.players.push(player2);
    let player3 = getPlayer(['3H', 'JC']);
    pot.players.push(player3);
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].playerHandEvaluatorResults.length, 3);
    //console.log('result.potResults[0].playerHandEvaluatorResults', result.potResults[0].playerHandEvaluatorResults);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[0].score, 973736);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[0].handRankEnglish, 'High Card');
    assert.equal(result.potResults[0].playerHandEvaluatorResults[1].score, 907910);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[1].handRankEnglish, '1 Pair');
    assert.equal(result.potResults[0].playerHandEvaluatorResults[2].score, 899718);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[2].handRankEnglish, 'High Card');

    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player2);
    assert.equal(result.potResults[0].allocations[0].amount, 100);
  });

  it('high card vs straight', function () {

    let pot = new GamePot();
    let state = new TexasHoldemGameState();
    state.boardCards = ['2S', '3S', '4S', '5S', '6H'];
    pot.amount = 100;
    let player1 = getPlayer(['JC', 'AH']);
    pot.players.push(player1);
    let player2 = getPlayer(['6S', '7C']);
    pot.players.push(player2);
    state.pots.push(pot);
   
    let result = state.allocateWinners();

    //console.log(result.potResults[0]);
    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player2);
    assert.equal(result.potResults[0].allocations[0].amount, 100);
  });



  it('allocate single pot two players', function() {

      let state = new TexasHoldemGameState();
      state.boardCards = ['4S', '6S', '8S', '10D', '6C'];
      let pot = new GamePot();
      pot.amount = 100;
    let player1 = getPlayer(['JC', 'AH']);
      pot.players.push(player1);
    let player2 = getPlayer(['KD', 'KH']);
      pot.players.push(player2);
      state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player2);
    assert.equal(result.potResults[0].allocations[0].amount, 100);

  });

  it('allocate single pot multi players', function () {

    let state = new TexasHoldemGameState();
    state.boardCards = ['4S', '6S', '8S', '10D', '6C'];
    let pot = new GamePot();
    pot.amount = 75;
    let player1 = getPlayer(['JC', 'AH']);
    pot.players.push(player1);
    let player2 = getPlayer(['KD', 'KH']);
    pot.players.push(player2);
    let player3 = getPlayer(['KS', 'AS']);
    pot.players.push(player3);
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player3);
    assert.equal(result.potResults[0].allocations[0].amount, 75);
  });

  it('split pot two way', function () {

    let state = new TexasHoldemGameState();
    state.boardCards = ['4S', '6S', '8S', '10D', 'JC'];
    let pot = new GamePot();
    pot.amount = 100;
    let player1 = getPlayer(['10C', 'AH']);
    pot.players.push(player1);
    let player2 = getPlayer(['10H', 'AD']);
    pot.players.push(player2);
    
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 2);
    assert.equal(result.potResults[0].allocations[0].player, player1);
    assert.equal(result.potResults[0].allocations[0].amount, 50);        
    assert.equal(result.potResults[0].allocations[1].player, player2);
    assert.equal(result.potResults[0].allocations[1].amount, 50);
  });

  it('split pot three way', function () {

    let state = new TexasHoldemGameState();
    state.boardCards = ['4S', '6S', '8S', '10D', 'JC'];
    let pot = new GamePot();
    pot.amount = 100;
    let player1 = getPlayer(['9C', 'AH']);
    pot.players.push(player1);
    let player2 = getPlayer(['9H', 'AD']);
    pot.players.push(player2);
    let player3 = getPlayer(['9D', 'AC']);
    pot.players.push(player3);
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 3);
    assert.equal(result.potResults[0].allocations[0].player, player1);
    assert.equal(result.potResults[0].allocations[0].amount, 33);
    assert.equal(result.potResults[0].allocations[1].player, player2);
    assert.equal(result.potResults[0].allocations[1].amount, 33);
    assert.equal(result.potResults[0].allocations[2].player, player3);
    assert.equal(result.potResults[0].allocations[2].amount, 33);
  });

  it('random 1', function () {

    let state = new TexasHoldemGameState();
    state.boardCards = ['10H', '7H', '3S', 'JH', '6H'];
    let pot = new GamePot();
    pot.amount = 100;
    let player1 = getPlayer(['2S', '9H']);
    pot.players.push(player1);
    let player2 = getPlayer(['KC', '5S']);
    pot.players.push(player2);
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player1);
    assert.equal(result.potResults[0].allocations[0].amount, 100);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[0].handRankEnglish, 'Flush');
    assert.equal(result.potResults[0].playerHandEvaluatorResults[1].handRankEnglish, 'High Card');    

  });

  it('random 2', function () {

    let state = new TexasHoldemGameState();
    state.boardCards = ['JC', '5C', 'KH', '3S', '5H'];
    let pot = new GamePot();
    pot.amount = 24;
    let player1 = getPlayer(['5S', '8S']);
    pot.players.push(player1);
    let player2 = getPlayer(['JD', 'AH']);
    pot.players.push(player2);
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 1);
    //assert.equal(result.potResults[0].allocations[0].player, player2);
    //assert.equal(result.potResults[0].allocations[0].amount, pot.amount);
    //assert.equal(result.potResults[0].playerHandEvaluatorResults[0].handRankEnglish, 'High Card');
    //assert.equal(result.potResults[0].playerHandEvaluatorResults[1].handRankEnglish, '1 Pair');

  });

  it('random 3', function () {

    let state = new TexasHoldemGameState();
    state.boardCards = ["7H","2D","5H","8H","5C"];
    let pot = new GamePot();
    pot.amount = 60;
    let player1 = getPlayer(["8D", "JC"]);
    pot.players.push(player1);
    let player2 = getPlayer(["7C", "QS"]);
    pot.players.push(player2);
    let player3 = getPlayer(["8C", "4H"]);
    pot.players.push(player3);
    let player4 = getPlayer(["QD", "QH"]);
    pot.players.push(player4);
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player4);
    assert.equal(result.potResults[0].allocations[0].amount, 60);
    assert.equal(result.potResults[0].playerHandEvaluatorResults[0].handRankEnglish, '2 Pair');
    assert.equal(result.potResults[0].playerHandEvaluatorResults[1].handRankEnglish, '2 Pair');

  });

  it('allocate pot for 2 players where 1 player has folded', function () {
    let state = new TexasHoldemGameState();    
    state.boardCards = ["7H", "2D", "5H", "8H", "5C"];
    let pot = new GamePot();
    pot.amount = 60;
    let player1 = getPlayer(["8D", "JC"], 0, false);
    pot.players.push(player1);
    let player2 = getPlayer(["AH", "KH"], 0, true);//winning player folds
    pot.players.push(player2);    
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player1);
    assert.equal(result.potResults[0].allocations[0].amount, 60);
  });

  it('allocate 1 pot 2 players', function () {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 2);
    let player2 = getPlayer(['x'], 2);

    state.allocatePots([player1, player2]);
    
    assert.equal(state.pots.length, 1);
    assert.equal(state.pots[0].amount, 4);
    assert.equal(state.pots[0].players.length, 2);
    assert.equal(state.pots[0].players[0], player1);
    assert.equal(state.pots[0].players[1], player2);    
  });

  it('allocate 1 pot 4 players', function () {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'],100);
    let player2 = getPlayer(['x'],100);
    let player3 = getPlayer(['x'],100);
    let player4 = getPlayer(['x'], 100);

    state.allocatePots([player1, player2, player3, player4]);

    assert.equal(state.pots.length, 1);
    assert.equal(state.pots[0].amount, 400);
    assert.equal(state.pots[0].players.length, 4);
    assert.equal(state.pots[0].players[0], player1);
    assert.equal(state.pots[0].players[1], player2);
    assert.equal(state.pots[0].players[2], player3);
    assert.equal(state.pots[0].players[3], player4);
  });

  it('allocate 3 pots', function () {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 55);
    let player2 = getPlayer(['x'], 130);
    let player3 = getPlayer(['x'], 25);

    state.allocatePots([player1, player2, player3]);

    assert.equal(_.sumBy(state.pots, function(p: GamePot) { return p.amount; }), 210);
    assert.equal(state.pots.length, 3);
    assert.equal(state.pots[0].amount, 75);
    assert.equal(state.pots[0].players.length, 3);
    assert.equal(state.pots[0].players[0], player1);
    assert.equal(state.pots[0].players[1], player2);
    assert.equal(state.pots[0].players[2], player3);

    assert.equal(state.pots[1].amount, 60);
    assert.equal(state.pots[1].players.length, 2);
    assert.equal(state.pots[1].players[0], player1);
    assert.equal(state.pots[1].players[1], player2); 

    assert.equal(state.pots[2].amount, 75);
    assert.equal(state.pots[2].players.length, 1);
    assert.equal(state.pots[2].players[0], player2);    
  });

  it('pot of size 0 is not allocated', function() {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 0);
    let player2 = getPlayer(['x'], 50);
    let player3 = getPlayer(['x'], 50);

    state.allocatePots([player1, player2, player3]);

    assert.equal(state.pots.length, 1);
    assert.equal(state.pots[0].amount, 100);
    assert.equal(state.pots[0].players.length, 2);
    assert.equal(state.pots[0].players[0], player2);
    assert.equal(state.pots[0].players[1], player3);    
  });

  it('bug1', function() {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 0, true);
    let player2 = getPlayer(['x'], 50);
    let player3 = getPlayer(['x'], 125);    

    state.allocatePots([player1, player2, player3]);

    assert.equal(state.pots.length, 2);
    assert.equal(state.pots[0].amount, 100);
    assert.equal(state.pots[0].players.length, 2);
    assert.equal(state.pots[0].players[0], player2);
    assert.equal(state.pots[0].players[1], player3);    

    assert.equal(state.pots[1].amount, 75);
    assert.equal(state.pots[1].players.length, 1);
    assert.equal(state.pots[1].players[0], player3);  

  });

  it('3 pots', function() {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 0, true);
    let player2 = getPlayer(['x'], 40);
    let player3 = getPlayer(['x'], 125);
    let player4 = getPlayer(['x'], 175);

    state.allocatePots([player1, player2, player3, player4]);

    assert.equal(state.pots.length, 3);
    assert.equal(state.pots[0].amount, 120);
    assert.equal(state.pots[0].players.length, 3);
    assert.equal(state.pots[0].players[0], player2);
    assert.equal(state.pots[0].players[1], player3);
    assert.equal(state.pots[0].players[2], player4);

    assert.equal(state.pots[1].amount, 170);
    assert.equal(state.pots[1].players.length, 2);
    assert.equal(state.pots[1].players[0], player3);
    assert.equal(state.pots[1].players[1], player4); 

    assert.equal(state.pots[2].amount, 50);
    assert.equal(state.pots[2].players.length, 1);
    assert.equal(state.pots[2].players[0], player4);

    assert.equal(_.sumBy(state.pots, function(p: GamePot) { return p.amount; }), 340);

  });

  it('folded pot is moved to main pot', function() {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 25, true);
    let player2 = getPlayer(['x'], 50, false);
    let player3 = getPlayer(['x'], 50);    

    state.allocatePots([player1, player2, player3]);

    assert.equal(state.pots.length, 1);
    assert.equal(state.pots[0].amount, 125);
    
  });

  it('players fold after raise', function () {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 5, true);
    let player2 = getPlayer(['x'], 5, true);
    let player3 = getPlayer(['x'], 50);

    state.allocatePots([player1, player2, player3]);

    assert.equal(state.pots.length, 2);
    assert.equal(state.pots[0].amount, 15);
    assert.equal(state.pots[1].amount, 45);

  });

  it('two players fold', function() {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 110154, false);
    let player2 = getPlayer(['x'], 55077, true);
    let player3 = getPlayer(['x'], 110154, true);

    state.allocatePots([player1, player2, player3]);
    
    //console.log(util.inspect(state.pots, false, null));    
    assert.equal(state.pots.length, 1);
    assert.equal(state.pots[0].amount, 275385);
  });

  it('pot is not collapsed as rake is due to be calculated on smaller of the player amounts', function () {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 217, false);
    let player2 = getPlayer(['x'], 17, true);    

    state.allocatePots([player1, player2]);

    assert.equal(state.pots.length, 2);
    assert.equal(state.pots[0].amount, 34);
    assert.equal(state.pots[1].amount, 200);


  });

  it('complex pot', function () {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 5);
    let player2 = getPlayer(['x'], 10, true);
    let player3 = getPlayer(['x'], 17);
    let player4 = getPlayer(['x'], 23);
    let player5 = getPlayer(['x'], 50);

    state.allocatePots([player1, player2, player3, player4, player5]);

    assert.equal(state.pots.length, 4);
    assert.equal(state.pots[0].amount, 25);
    assert.equal(state.pots[1].amount, 21 +20);
    assert.equal(state.pots[2].amount, 12);
    assert.equal(state.pots[3].amount, 27);
    assert.equal(_.sumBy(state.pots, function (p: GamePot) { return p.amount; }), 105);

  });

  it('folded pot is moved to main pot', function() {

    let state = new TexasHoldemGameState();
    let player1 = getPlayer(['x'], 25);
    let player2 = getPlayer(['x'], 50, true);
    let player3 = getPlayer(['x'], 50);
    let player4 = getPlayer(['x'], 10);

    state.allocatePots([player1, player2, player3, player4]);

    assert.equal(state.pots.length, 3);
    assert.equal(state.pots[0].amount, 40);
    assert.equal(state.pots[1].amount, 45);
    assert.equal(state.pots[1].players.length, 2);
    assert.equal(state.pots[1].players[0], player1);
    assert.equal(state.pots[1].players[1], player3);
    assert.equal(state.pots[2].amount, 50);
    assert.equal(state.pots[2].players.length, 1);
    assert.equal(state.pots[2].players[0], player3);
      

  });

  it('rankHand-non-suited-flush', function () {

    let result1 = PokerEvaluator.rankHand(['5H', '6D', '2D', 'KH', '4S', '3S', '5C']);
    let result2 = PokerEvaluator.rankHand(['5H', '6D', '2D', 'KH', '4S', 'AC', '3D']);
    assert.equal(result1.score, 414770);
    assert.equal(result1.handRankEnglish, 'Straight');
    assert.equal(result1.score, result2.score);
  });

  it('rankHand-suited-flush', function () {

    let result1 = PokerEvaluator.rankHand(['5C', '6C', '3C', '2C', '4C', 'AH', 'KH']);
    let result2 = PokerEvaluator.rankHand(['5C', '6C', '3C', '2C', '4C', 'AC', 'KH']);
    assert.equal(result1.score, 414770);
    assert.equal(result1.handRankEnglish, 'Straight Flush');
    assert.equal(result1.score, result2.score);
  });

  it('Deeb vs Negreanau ', function () {
        
    let pot = new GamePot();
    let state = new TexasHoldemGameState();
    state.boardCards = ['3D', '2S', '5D', '3H', '2C'];
    pot.amount = 100;
    let player1 = getPlayer(['4H', '3S']);
    pot.players.push(player1);
    let player2 = getPlayer(['5C', '3C']);
    pot.players.push(player2);    
    state.pots.push(pot);

    let result = state.allocateWinners();

    assert.equal(result.potResults.length, 1);
     assert.equal(result.potResults[0].playerHandEvaluatorResults.length, 2);
     assert.equal(result.potResults[0].playerHandEvaluatorResults[0].handRankEnglish, 'Full House');
     assert.equal(result.potResults[0].playerHandEvaluatorResults[0].bestHand, '3D2S3H2C3S');
     assert.equal(result.potResults[0].playerHandEvaluatorResults[1].handRankEnglish, 'Full House');
     assert.equal(result.potResults[0].playerHandEvaluatorResults[1].bestHand, '3D5D3H5C3C');

    assert.equal(result.potResults[0].allocations.length, 1);
    assert.equal(result.potResults[0].allocations[0].player, player2);
    assert.equal(result.potResults[0].allocations[0].amount, 100);

  });

  
});




