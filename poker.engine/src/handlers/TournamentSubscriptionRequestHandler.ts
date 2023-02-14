import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { TournamentSubscriptionRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { IDataRepository } from './../services/documents/IDataRepository';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer, TournamentSubscriptionResult } from '../../../poker.ui/src/shared/DataContainer';
import { IBroadcastService } from '../services/IBroadcastService';
import { TournamentViewRow } from "../../../poker.ui/src/shared/tournmanet-view-row";
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { TournamentLogic } from "./TournamentLogic";
import { getTournamentViewRow } from "../helpers";
import { sleep } from "../shared-helpers";
var _ = require('lodash');
import WebSocket = require('ws');
import { QueryMeta } from "../services/documents/QueryMeta";

export class TournamentSubscriptionRequestHandler extends AbstractMessageHandler<TournamentSubscriptionRequest>{
    constructor(private dataRepository: IDataRepository, private tournamentLogic:TournamentLogic) {
        super();
    }

    async handleMessage(wsHandle: WebSocketHandle, request:TournamentSubscriptionRequest): Promise<any>{
        let result = new TournamentSubscriptionResult();
        let registrations = await this.dataRepository.getTournamentRegistrations( { userGuid: wsHandle.user.guid})
        let meta:QueryMeta = new QueryMeta();
        for(let tournament of await this.dataRepository.getTournaments({}, 10, meta)){
            let view = await getTournamentViewRow(tournament, this.dataRepository);
            view.joined = registrations.find(r=>r.tournamentId==view.id) != null;                        
            result.tournaments.push(view);
        }
        result.tournamentCount = meta.count;
        result.tournaments.sort((a,b)=> {
            if(!a.status && !b.status){
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            }else if(!a.status && b.status){
                return -1;
            }else if(a.status && !b.status){
                return 1;
            }else{
                return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
            }
            return 0;
            
        });
        if(wsHandle.socket.readyState === WebSocket.OPEN)
        {
            //check socket is still open to avoid adding a user who got d/c immediately after the connect sequence
            //things work still but then you have a disconnected subscriber sitting in the TournamentLogic who will only get d/c when something is broadcast
            let data = new DataContainer();
            data.tournamentSubscriptionResult = result;
            wsHandle.send(data);
            this.tournamentLogic.addSubscriber(wsHandle);
        }        
    }
}

