"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentSubscriptionRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const helpers_1 = require("../helpers");
var _ = require('lodash');
const WebSocket = require("ws");
const QueryMeta_1 = require("../services/documents/QueryMeta");
class TournamentSubscriptionRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, tournamentLogic) {
        super();
        this.dataRepository = dataRepository;
        this.tournamentLogic = tournamentLogic;
    }
    async handleMessage(wsHandle, request) {
        let result = new DataContainer_1.TournamentSubscriptionResult();
        let registrations = await this.dataRepository.getTournamentRegistrations({ userGuid: wsHandle.user.guid });
        let meta = new QueryMeta_1.QueryMeta();
        for (let tournament of await this.dataRepository.getTournaments({}, 10, meta)) {
            let view = await (0, helpers_1.getTournamentViewRow)(tournament, this.dataRepository);
            view.joined = registrations.find(r => r.tournamentId == view.id) != null;
            result.tournaments.push(view);
        }
        result.tournamentCount = meta.count;
        result.tournaments.sort((a, b) => {
            if (!a.status && !b.status) {
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            }
            else if (!a.status && b.status) {
                return -1;
            }
            else if (a.status && !b.status) {
                return 1;
            }
            else {
                return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
            }
            return 0;
        });
        if (wsHandle.socket.readyState === WebSocket.OPEN) {
            let data = new DataContainer_1.DataContainer();
            data.tournamentSubscriptionResult = result;
            wsHandle.send(data);
            this.tournamentLogic.addSubscriber(wsHandle);
        }
    }
}
exports.TournamentSubscriptionRequestHandler = TournamentSubscriptionRequestHandler;
//# sourceMappingURL=TournamentSubscriptionRequestHandler.js.map