"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentRegisterRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const TournamentRegistration_1 = require("../model/TournamentRegistration");
const TournmanetStatus_1 = require("../../../poker.ui/src/shared/TournmanetStatus");
const TableProcessor_1 = require("../admin/processor/table-processor/TableProcessor");
const helpers_1 = require("../helpers");
const TournamentPaymentMeta_1 = require("../model/TournamentPaymentMeta");
class TournamentRegisterRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, broadcastService, tournamentLogic) {
        super();
        this.dataRepository = dataRepository;
        this.broadcastService = broadcastService;
        this.tournamentLogic = tournamentLogic;
    }
    async handleMessage(wsHandle, request) {
        let data = new DataContainer_1.DataContainer();
        let broadcastMessage;
        let result = await this.validate(request, wsHandle.user.guid);
        if (result.error) {
            data.error = new DataContainer_1.PokerError(result.error);
        }
        else {
            let { user, tournament } = result;
            let debitError = '';
            if (tournament.buyIn) {
                debitError = await (0, helpers_1.debitAccount)(user.toSmall(), tournament.currency, tournament.buyIn, this.dataRepository, null, new TournamentPaymentMeta_1.TournamentPaymentMeta(tournament._id.toString(), false, tournament.name));
                data.user = await (0, helpers_1.getUserData)(user, this.dataRepository, false);
            }
            if (!debitError) {
                let registration = new TournamentRegistration_1.TournamentRegistration(request.tournamentId, wsHandle.user.guid, wsHandle.user.screenName);
                await this.dataRepository.saveTournamentRegistration(registration);
                data.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
                data.tournamentSubscriptionResult.tournaments.push({ id: request.tournamentId, joined: true });
                if (tournament.status == TournmanetStatus_1.TournmanetStatus.Started) {
                    await this.sendLateRegistration(tournament, user.toSmall());
                }
                let playerCount = await this.dataRepository.getTournamentPlayerCount(registration.tournamentId);
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                broadcastMessage = new DataContainer_1.DataContainer();
                broadcastMessage.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
                let rowView = { id: request.tournamentId, playerCount: playerCount };
                if (tournament.buyIn) {
                    rowView.totalPrize = (0, helpers_1.getTotalPrize)(tournament, buyInTotal).toString();
                }
                broadcastMessage.tournamentSubscriptionResult.tournaments.push(rowView);
            }
            else {
                data.error = new DataContainer_1.PokerError(debitError);
            }
        }
        wsHandle.send(data);
        if (broadcastMessage) {
            this.broadcastService.broadcast(broadcastMessage);
        }
    }
    async validate(request, userGuid) {
        let result = {};
        result.tournament = await this.dataRepository.getTournmanetById(request.tournamentId);
        if (result.tournament == null) {
            result.error = `Tournament not found: ${request.tournamentId}`;
            return result;
        }
        if (!this.canRegister(result.tournament)) {
            result.error = `You can no longer register for this tournament`;
            return result;
        }
        result.user = await this.dataRepository.getUser(userGuid);
        if (!result.user) {
            result.error = 'You must register to play tournaments';
            return result;
        }
        if (!result.user.activated) {
            result.error = 'Account not activated! Please check your email to confirm registration';
            return result;
        }
        let existingRegistration = await this.dataRepository.getTournamentRegistrations({ userGuid: userGuid, tournamentId: request.tournamentId });
        if (existingRegistration.length) {
            result.error = 'You are already registered for this tournament';
            return result;
        }
        return result;
    }
    sendLateRegistration(tournament, user) {
        let tournamentId = tournament._id.toString();
        let processor = this.tournamentLogic.getTableProcessor(tournamentId);
        let tMessage = new TableProcessor_1.TableProcessorMessage(null);
        tMessage.lateRegistration = { tournamentId: tournamentId, user: user };
        return processor.sendMessage(tMessage);
    }
    canRegister(tournament) {
        if (!tournament.status) {
            return true;
        }
        else if ((0, helpers_1.isWithinLateRegistration)(tournament)) {
            return true;
        }
        return false;
    }
}
exports.TournamentRegisterRequestHandler = TournamentRegisterRequestHandler;
//# sourceMappingURL=TournamentRegisterRequestHandler.js.map