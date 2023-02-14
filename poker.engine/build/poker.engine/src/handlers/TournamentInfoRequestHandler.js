"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentInfoRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const helpers_1 = require("../helpers");
const TournamentInfoRequest_1 = require("../../../poker.ui/src/shared/TournamentInfoRequest");
const TournmanetStatus_1 = require("../../../poker.ui/src/shared/TournmanetStatus");
class TournamentInfoRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, tournamentLogic) {
        super();
        this.dataRepository = dataRepository;
        this.tournamentLogic = tournamentLogic;
    }
    async handleMessage(wsHandle, request) {
        let buyInTotal = await this.dataRepository.getTournamentBuyIns(request.tournamentId);
        let data = new DataContainer_1.DataContainer();
        let result = new TournamentInfoRequest_1.TournamentInfoResult();
        let tournament = await this.dataRepository.getTournmanetById(request.tournamentId);
        result.name = tournament.name;
        result.currency = tournament.currency;
        result.prizes = (0, helpers_1.getCalculatedPrizes)(tournament, buyInTotal);
        result.blindConfig = tournament.blindConfig;
        result.playersPerTable = tournament.playersPerTable;
        result.startingChips = tournament.startingChips;
        result.timeToActSec = tournament.timeToActSec;
        result.lateRegistrationMin = tournament.lateRegistrationMin;
        result.evictAfterIdleMin = tournament.evictAfterIdleMin || 10;
        result.buyIn = tournament.buyIn;
        result.results = [];
        let tResults = await this.dataRepository.getTournamentResults(request.tournamentId);
        tResults.sort((a, b) => a.placing - b.placing);
        if (tournament.status == TournmanetStatus_1.TournmanetStatus.Started || tournament.status == TournmanetStatus_1.TournmanetStatus.Complete) {
            for (let tResult of tResults) {
                result.results.push(new TournamentInfoRequest_1.TournamentResultRowView(tResult.screenName, tResult.placing));
            }
            if (tournament.status == TournmanetStatus_1.TournmanetStatus.Started) {
                let remainingPlayers = [];
                for (let player of this.tournamentLogic.getRemainingPlayers(request.tournamentId)) {
                    let row = new TournamentInfoRequest_1.TournamentResultRowView(player.screenName, null);
                    row.stack = player.stack;
                    remainingPlayers.push(row);
                }
                result.results = remainingPlayers.concat(result.results);
            }
        }
        data.tournamentInfoResult = result;
        wsHandle.send(data);
        return Promise.resolve();
    }
}
exports.TournamentInfoRequestHandler = TournamentInfoRequestHandler;
//# sourceMappingURL=TournamentInfoRequestHandler.js.map