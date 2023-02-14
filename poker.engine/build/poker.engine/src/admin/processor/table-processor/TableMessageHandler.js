"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableMessageHandler = void 0;
const TableProcessor_1 = require("./TableProcessor");
const log4js_1 = require("log4js");
const logger = (0, log4js_1.getLogger)();
class TableMessageHandler {
    constructor(dataRepository, tournamentLogic) {
        this.dataRepository = dataRepository;
        this.tournamentLogic = tournamentLogic;
        this.typeName = 'message';
    }
    async run(tMessage) {
        let result = new TableProcessor_1.TableProcessorResult();
        try {
            await this.dataRepository.saveTableProcessorMessage(this.getDbTableProcessorMessage(tMessage));
            if (tMessage.tableMessage != null) {
                await tMessage.tableMessage.action();
            }
            else if (tMessage.fold != null) {
                tMessage.table.handleFold(tMessage.fold.guid);
            }
            else if (tMessage.joinTableRequest != null) {
                tMessage.table.handleJoinTableRequest(tMessage.joinTableRequest);
            }
            else if (tMessage.bet != null) {
                tMessage.table.handleBet(tMessage.bet.betAmount, tMessage.bet.user.guid);
            }
            else if (tMessage.setTableOptionRequest != null) {
                tMessage.table.handleSetTableOptionRequest(tMessage.setTableOptionRequest.request, tMessage.setTableOptionRequest.user.guid);
            }
            else if (tMessage.checkIdlePlayers != null) {
                result.evictedPlayers = await tMessage.table.checkIdlePlayers();
            }
            else if (tMessage.leaveTable != null) {
                await tMessage.table.leaveTable(tMessage.leaveTable.guid);
            }
            else if (tMessage.lateRegistration != null) {
                result.lateRegistrationTableId = await this.tournamentLogic.lateRegistration(tMessage.lateRegistration.tournamentId, tMessage.lateRegistration.user.guid);
            }
            else if (tMessage.evictingIdleTournamentPlayers != null) {
                await this.tournamentLogic.onPlayersBusted(tMessage.evictingIdleTournamentPlayers.tournamentId, tMessage.evictingIdleTournamentPlayers.playerHandles);
            }
            else if (tMessage.rebuy != null) {
                await this.tournamentLogic.rebuy(tMessage.rebuy.tournamentId, tMessage.rebuy.user);
            }
        }
        catch (e) {
            logger.error(e);
        }
        return result;
    }
    getDbTableProcessorMessage(tMessage) {
        let dbMessage = new TableProcessor_1.DbTableProcessorMessage();
        if (tMessage.table != null) {
            dbMessage.tournamentId = tMessage.table.tournamentId;
            dbMessage.tableId = tMessage.table.tableConfig._id.toString();
        }
        if (tMessage.tableMessage != null) {
            dbMessage.tableMessageAction = tMessage.tableMessage.action.name;
            if (tMessage.tableMessage.tournamentId && !tMessage.table) {
                dbMessage.tournamentId = tMessage.tableMessage.tournamentId;
            }
        }
        if (tMessage.fold) {
            dbMessage.fold = tMessage.fold;
        }
        if (tMessage.joinTableRequest) {
            dbMessage.joinTableRequest = tMessage.joinTableRequest;
        }
        if (tMessage.bet) {
            dbMessage.bet = tMessage.bet;
        }
        if (tMessage.setTableOptionRequest) {
            dbMessage.setTableOptionRequest = tMessage.setTableOptionRequest;
        }
        if (tMessage.checkIdlePlayers) {
            dbMessage.checkIdlePlayers = tMessage.checkIdlePlayers;
        }
        if (tMessage.leaveTable) {
            dbMessage.leaveTable = tMessage.leaveTable;
        }
        if (tMessage.lateRegistration) {
            dbMessage.lateRegistration = tMessage.lateRegistration;
        }
        if (tMessage.rebuy) {
            dbMessage.rebuy = tMessage.rebuy;
        }
        return dbMessage;
    }
}
exports.TableMessageHandler = TableMessageHandler;
//# sourceMappingURL=TableMessageHandler.js.map