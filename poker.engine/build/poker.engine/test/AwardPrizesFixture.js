"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const helpers_1 = require("../src/helpers");
const TournamentResult_1 = require("../src/model/TournamentResult");
const decimal_1 = require("../../poker.ui/src/shared/decimal");
const tournament_1 = require("../src/model/tournament");
describe('AwardPrizesFixture', () => {
    let prizes;
    beforeEach(() => {
        prizes = ['0.5', '0.25', '0.10', '0.05', '0.04', '0.03', '0.02', '0.01'];
    });
    let getTournament = (prizes, housePrize, buyIn) => {
        let tournament = new tournament_1.Tournament();
        tournament.prizes = prizes;
        tournament.housePrize = housePrize;
        tournament._id = 'abcd';
        return tournament;
    };
    it('awardPrizes empty', async () => {
        (0, helpers_1.awardPrizes)(getTournament(prizes, '1', null), [], new decimal_1.Decimal(0));
    });
    it('awardPrizes percentages does not equal 1', async () => {
        prizes = ['0.5', '0.25'];
        let err;
        try {
            (0, helpers_1.awardPrizes)(getTournament(prizes, '1', null), [], new decimal_1.Decimal(0));
        }
        catch (error) {
            err = error;
        }
        assert.equal(err.message, 'percentage array must add up to 1. percentageTotal:0.75 abcd');
    });
    it('awardPrizes basic', async () => {
        let results = [
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 4, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 5, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 6, null),
            new TournamentResult_1.TournamentResult(null, "user7", null, 7, null),
            new TournamentResult_1.TournamentResult(null, "user9", null, 9, null),
            new TournamentResult_1.TournamentResult(null, "user10", null, 10, null),
            new TournamentResult_1.TournamentResult(null, "user8", null, 8, null),
        ];
        (0, helpers_1.awardPrizes)(getTournament(prizes, '1', null), results, new decimal_1.Decimal(0));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.5");
        assert.equal(results[1].prize, "0.25");
        assert.equal(results[2].prize, "0.1");
        assert.equal(results[3].prize, "0.05");
        assert.equal(results[4].prize, "0.04");
        assert.equal(results[5].prize, "0.03");
        assert.equal(results[6].prize, "0.02");
        assert.equal(results[7].prize, "0.01");
        assert.equal(results[8].prize, undefined);
        assert.equal(results[9].prize, undefined);
    });
    it('award small prize', async () => {
        let results = [
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 4, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 5, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 6, null),
            new TournamentResult_1.TournamentResult(null, "user7", null, 7, null),
            new TournamentResult_1.TournamentResult(null, "user9", null, 9, null),
            new TournamentResult_1.TournamentResult(null, "user10", null, 10, null),
            new TournamentResult_1.TournamentResult(null, "user8", null, 8, null),
        ];
        (0, helpers_1.awardPrizes)(getTournament(prizes, '0.5', null), results, new decimal_1.Decimal(0));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.25");
        assert.equal(results[1].prize, "0.125");
        assert.equal(results[2].prize, "0.05");
        assert.equal(results[3].prize, "0.025");
        assert.equal(results[4].prize, "0.02");
        assert.equal(results[5].prize, "0.015");
        assert.equal(results[6].prize, "0.01");
        assert.equal(results[7].prize, "0.005");
        assert.equal(results[8].prize, undefined);
        assert.equal(results[9].prize, undefined);
    });
    it('buy in prize only', async () => {
        let results = [
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 4, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 5, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 6, null),
            new TournamentResult_1.TournamentResult(null, "user7", null, 7, null),
            new TournamentResult_1.TournamentResult(null, "user9", null, 9, null),
            new TournamentResult_1.TournamentResult(null, "user10", null, 10, null),
            new TournamentResult_1.TournamentResult(null, "user8", null, 8, null),
        ];
        prizes = ['0.625', '0.25', '0.125'];
        (0, helpers_1.awardPrizes)(getTournament(prizes, undefined, '0.125'), results, new decimal_1.Decimal(1.25));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.7812");
        assert.equal(results[1].prize, "0.3125");
        assert.equal(results[2].prize, "0.1562");
        for (let i = 3; i < results.length; i++) {
            assert.equal(results[i].prize, undefined);
        }
    });
    it('prizes comprise house and buy in', async () => {
        let results = [
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 4, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 5, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 6, null),
            new TournamentResult_1.TournamentResult(null, "user7", null, 7, null),
            new TournamentResult_1.TournamentResult(null, "user9", null, 9, null),
            new TournamentResult_1.TournamentResult(null, "user10", null, 10, null),
            new TournamentResult_1.TournamentResult(null, "user8", null, 8, null),
        ];
        (0, helpers_1.awardPrizes)(getTournament(prizes, '1', '0.01'), results, new decimal_1.Decimal(0.1));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.55");
        assert.equal(results[1].prize, "0.275");
        assert.equal(results[2].prize, "0.11");
        assert.equal(results[3].prize, "0.055");
        assert.equal(results[4].prize, "0.044");
        assert.equal(results[5].prize, "0.033");
        assert.equal(results[6].prize, "0.022");
        assert.equal(results[7].prize, "0.011");
        for (let i = 8; i < results.length; i++) {
            assert.equal(results[i].prize, undefined);
        }
        let total = results.map(r => new decimal_1.Decimal(r.prize)).reduce((a, b) => a.add(b), new decimal_1.Decimal(0));
        assert.equal(total.toNumber(), 1.1);
    });
    it('third prize is split', async () => {
        let prizes = [
            "0.5",
            "0.45",
            "0.05",
        ];
        let results = [
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 5, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 5, null),
        ];
        (0, helpers_1.awardPrizes)(getTournament(prizes, '1', null), results, new decimal_1.Decimal(0));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.5");
        assert.equal(results[1].prize, "0.45");
        assert.equal(results[2].prize, "0.025");
        assert.equal(results[3].prize, "0.025");
        assert.equal(results[4].prize, undefined);
        assert.equal(results[5].prize, undefined);
    });
    it('third prize is split 2', async () => {
        let prizes = [
            "0.5",
            "0.4",
            "0.1",
        ];
        let results = [
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 3, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 6, null),
        ];
        (0, helpers_1.awardPrizes)(getTournament(prizes, '1', null), results, new decimal_1.Decimal(0));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.5");
        assert.equal(results[1].prize, "0.4");
        assert.equal(results[2].prize, "0.0333");
        assert.equal(results[3].prize, "0.0333");
        assert.equal(results[4].prize, "0.0333");
        assert.equal(results[5].prize, undefined);
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
        let results = [
            new TournamentResult_1.TournamentResult(null, "user1", null, 1, null),
            new TournamentResult_1.TournamentResult(null, "user2", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user3", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user4", null, 2, null),
            new TournamentResult_1.TournamentResult(null, "user5", null, 5, null),
            new TournamentResult_1.TournamentResult(null, "user6", null, 5, null),
        ];
        (0, helpers_1.awardPrizes)(getTournament(prizes, '1', null), results, new decimal_1.Decimal(0));
        results.sort((a, b) => a.placing - b.placing);
        assert.equal(results[0].prize, "0.581");
        assert.equal(results[1].prize, "0.1333");
        assert.equal(results[2].prize, "0.1333");
        assert.equal(results[3].prize, "0.1333");
        assert.equal(results[4].prize, "0.0075");
        assert.equal(results[5].prize, "0.0075");
    });
});
//# sourceMappingURL=AwardPrizesFixture.js.map