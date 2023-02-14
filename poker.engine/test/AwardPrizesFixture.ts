import * as assert from 'assert';
import { awardPrizes } from '../src/helpers';
import { TournamentResult } from '../src/model/TournamentResult';
import { Decimal } from '../../poker.ui/src/shared/decimal';
import { Tournament } from '../src/model/tournament';


describe('AwardPrizesFixture', () => {

    let prizes:string[];
    beforeEach(()=>{
        prizes = ['0.5', '0.25', '0.10', '0.05', '0.04', '0.03', '0.02', '0.01'];
    });

    let getTournament = (prizes:string[], housePrize:string, buyIn:string)=>{
        let tournament = new Tournament();
        tournament.prizes = prizes;
        tournament.housePrize = housePrize;
        //tournament.buyIn = buyIn;
        tournament._id = 'abcd'
        return tournament;
    }
    

    it('awardPrizes empty', async () => {

        awardPrizes(getTournament(prizes, '1', null), [], new Decimal(0));

    });

    it('awardPrizes percentages does not equal 1', async () => {

        prizes = ['0.5', '0.25'];
        let err:Error;
        try {
            awardPrizes(getTournament(prizes, '1', null), [], new Decimal(0));
        } catch (error) {
            err = error;
        }
        assert.equal(err.message, 'percentage array must add up to 1. percentageTotal:0.75 abcd')

    });

    it('awardPrizes basic', async () => {
        
        let results: TournamentResult[] = [
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user3", null, 3, null),
            new TournamentResult(null, "user4", null, 4, null),
            new TournamentResult(null, "user5", null, 5, null),
            new TournamentResult(null, "user6", null, 6, null),
            new TournamentResult(null, "user7", null, 7, null),
            new TournamentResult(null, "user9", null, 9, null),
            new TournamentResult(null, "user10", null, 10, null),
            new TournamentResult(null, "user8", null, 8, null),
        ];
        

        awardPrizes(getTournament(prizes, '1', null),results, new Decimal(0));
        
        results.sort((a,b) => a.placing - b.placing);        
        
        assert.equal(results[0].prize, "0.5")
        assert.equal(results[1].prize, "0.25")
        assert.equal(results[2].prize, "0.1")
        assert.equal(results[3].prize, "0.05")
        assert.equal(results[4].prize, "0.04")
        assert.equal(results[5].prize, "0.03")
        assert.equal(results[6].prize, "0.02")
        assert.equal(results[7].prize, "0.01")        
        assert.equal(results[8].prize, undefined)
        assert.equal(results[9].prize, undefined)

    });

    it('award small prize', async () => {
        
        let results: TournamentResult[] = [
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user3", null, 3, null),
            new TournamentResult(null, "user4", null, 4, null),
            new TournamentResult(null, "user5", null, 5, null),
            new TournamentResult(null, "user6", null, 6, null),
            new TournamentResult(null, "user7", null, 7, null),
            new TournamentResult(null, "user9", null, 9, null),
            new TournamentResult(null, "user10", null, 10, null),
            new TournamentResult(null, "user8", null, 8, null),
        ];
        

        awardPrizes(getTournament(prizes, '0.5', null), results, new Decimal(0));
        
        results.sort((a,b) => a.placing - b.placing);        
        
        assert.equal(results[0].prize, "0.25")
        assert.equal(results[1].prize, "0.125")
        assert.equal(results[2].prize, "0.05")
        assert.equal(results[3].prize, "0.025")
        assert.equal(results[4].prize, "0.02")
        assert.equal(results[5].prize, "0.015")
        assert.equal(results[6].prize, "0.01")
        assert.equal(results[7].prize, "0.005")        
        assert.equal(results[8].prize, undefined)
        assert.equal(results[9].prize, undefined)

    });

    it('buy in prize only', async () => {
        
        let results: TournamentResult[] = [
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user3", null, 3, null),
            new TournamentResult(null, "user4", null, 4, null),
            new TournamentResult(null, "user5", null, 5, null),
            new TournamentResult(null, "user6", null, 6, null),
            new TournamentResult(null, "user7", null, 7, null),
            new TournamentResult(null, "user9", null, 9, null),
            new TournamentResult(null, "user10", null, 10, null),
            new TournamentResult(null, "user8", null, 8, null),
        ];
        
        prizes = [ '0.625', '0.25', '0.125'];
        awardPrizes(getTournament(prizes, undefined, '0.125'), results, new Decimal(1.25));        
        results.sort((a,b) => a.placing - b.placing);        
        
        assert.equal(results[0].prize, "0.7812")
        assert.equal(results[1].prize, "0.3125")
        assert.equal(results[2].prize, "0.1562")
        for (let i = 3; i < results.length; i++) {
            assert.equal(results[i].prize, undefined)            
        }
    });

    it('prizes comprise house and buy in', async () => {
        
        let results: TournamentResult[] = [
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user3", null, 3, null),
            new TournamentResult(null, "user4", null, 4, null),
            new TournamentResult(null, "user5", null, 5, null),
            new TournamentResult(null, "user6", null, 6, null),
            new TournamentResult(null, "user7", null, 7, null),
            new TournamentResult(null, "user9", null, 9, null),
            new TournamentResult(null, "user10", null, 10, null),
            new TournamentResult(null, "user8", null, 8, null),
        ];
        
        
        awardPrizes(getTournament(prizes, '1', '0.01'), results, new Decimal(0.1));        
        results.sort((a,b) => a.placing - b.placing);        
        
        //prizes = ['0.5', '0.25', '0.10', '0.05', '0.04', '0.03', '0.02', '0.01'];
        assert.equal(results[0].prize, "0.55")
        assert.equal(results[1].prize, "0.275")
        assert.equal(results[2].prize, "0.11")
        assert.equal(results[3].prize, "0.055")
        assert.equal(results[4].prize, "0.044")
        assert.equal(results[5].prize, "0.033")
        assert.equal(results[6].prize, "0.022")
        assert.equal(results[7].prize, "0.011")        
        for (let i = 8; i < results.length; i++) {
            assert.equal(results[i].prize, undefined)            
        }
        let total = results.map(r=>new Decimal(r.prize)).reduce((a,b)=> a.add(b), new Decimal(0));
        assert.equal(total.toNumber(), 1.1);
    });

    it('third prize is split', async () => {
                
        let prizes = [
            "0.5",
            "0.45",
            "0.05",
        ];
        let results: TournamentResult[] = [
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user3", null, 3, null),
            new TournamentResult(null, "user4", null, 3, null),
            new TournamentResult(null, "user5", null, 5, null),
            new TournamentResult(null, "user6", null, 5, null),
            
        ];
        

        awardPrizes(getTournament(prizes, '1', null), results, new Decimal(0));

        results.sort((a,b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.5")
        assert.equal(results[1].prize, "0.45")
        assert.equal(results[2].prize, "0.025")
        assert.equal(results[3].prize, "0.025")
        assert.equal(results[4].prize, undefined)
        assert.equal(results[5].prize, undefined)
    });

    it('third prize is split 2', async () => {
        
        let prizes = [
            "0.5",
            "0.4",
            "0.1",
        ];
        let results: TournamentResult[] = [
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user3", null, 3, null),
            new TournamentResult(null, "user4", null, 3, null),
            new TournamentResult(null, "user5", null, 3, null),
            new TournamentResult(null, "user6", null, 6, null),
            
        ];
        

        awardPrizes(getTournament(prizes,'1', null), results, new Decimal(0));

        results.sort((a,b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.5")
        assert.equal(results[1].prize, "0.4")
        assert.equal(results[2].prize, "0.0333")
        assert.equal(results[3].prize, "0.0333")
        assert.equal(results[4].prize, "0.0333")
        assert.equal(results[5].prize, undefined)
    });

    it('prize is pooled from multiple prize entries', async () => {
        
        let prizes = [
            "0.581",
            "0.25",
            "0.1",
            "0.05",
            "0.01",
            "0.005",
            "0.003",
            "0.001",
        ];
        let results: TournamentResult[] = [
            new TournamentResult(null, "user1", null, 1, null),
            new TournamentResult(null, "user2", null, 2, null),
            new TournamentResult(null, "user3", null, 2, null),
            new TournamentResult(null, "user4", null, 2, null),
            new TournamentResult(null, "user5", null, 5, null),
            new TournamentResult(null, "user6", null, 5, null),
            
        ];
        

        awardPrizes(getTournament(prizes, '1', null), results, new Decimal(0));

        results.sort((a,b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.581")
        assert.equal(results[1].prize, "0.1333")
        assert.equal(results[2].prize, "0.1333")
        assert.equal(results[3].prize, "0.1333")
        assert.equal(results[4].prize, "0.0075")
        assert.equal(results[5].prize, "0.0075")
    });



});