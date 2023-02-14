import { Tournament } from '../../src/model/tournament';
import { TournamentSubscriptionRequestHandler } from "../../src/handlers/TournamentSubscriptionRequestHandler";
import { IDataRepository } from "../../src/services/documents/IDataRepository";
import { TestHelpers } from "../test-helpers";
import { IBroadcastService } from "../../src/services/IBroadcastService";
import { TournamentSubscriptionRequest, ClientMessage } from "../../../poker.ui/src/shared/ClientMessage";
import { MockWebSocket } from '../mockWebSocket';
import { WebSocketHandle } from '../../src/model/WebSocketHandle';
import { User } from '../../src/model/User';
import { TournamentLogic } from '../../src/handlers/TournamentLogic';
import { TournamentRegistration } from '../../src/model/TournamentRegistration';
import { Decimal } from '../../../poker.ui/src/shared/decimal';

var assert = require('assert');
var substitute = require('jssubstitute');

describe('TournamentSubscriptionRequestHandler', () => {
    let handler: TournamentSubscriptionRequestHandler;
    let tournament:Tournament;
    let tournamentLogic:any;

    let dataRepository: IDataRepository;
    beforeEach(function () {
        let tournament = new Tournament();
        tournament._id = "id1";
        tournament.housePrize = '0.5';
        tournament.prizes = ['0.5', '0.25', '0.10', '0.05', '0.04', '0.03', '0.02', '0.01'];        
        substitute.throwErrors();
        dataRepository = TestHelpers.getDataRepository();
        dataRepository.getTournaments = (args?: any) => Promise.resolve([ tournament ]);
        dataRepository.getTournamentRegistrations = (guid:any) => Promise.resolve([ <TournamentRegistration> {tournamentId:'id1', userGuid:'guid1'} ]);        
        dataRepository.getTournamentPlayerCount = (id:any) => Promise.resolve(20);      
        dataRepository.getTournamentBuyIns = ()=>{  return Promise.resolve(new Decimal(0.2)); }  
        tournamentLogic = substitute.for(new TournamentLogic(null, null, null, null, null, null));
        handler = new TournamentSubscriptionRequestHandler(dataRepository, tournamentLogic);

    });

    it('should_subscribe_to_tournament', async () => {
        let message = new ClientMessage();
        message.tournamentSubscriptionRequest = new TournamentSubscriptionRequest();
        let socket = new MockWebSocket();
        socket.readyState = 1;
        let handle = new WebSocketHandle(socket);
        handle.user = new User();
        handle.user.guid = 'guid1';
        await handler.run(handle, message);

        let data = socket.getLastMessage();
        assert.equal(data.tournamentSubscriptionResult.tournaments.length, 1);
        assert.equal(data.tournamentSubscriptionResult.tournaments[0].id, "id1");
        assert.equal(data.tournamentSubscriptionResult.tournaments[0].totalPrize, "0.7");
        assert.equal(data.tournamentSubscriptionResult.tournaments[0].joined, true);

        tournamentLogic.receivedWith('addSubscriber', substitute.arg.matchUsing((arg: any) => 
        { return arg != null && arg==handle; }));
    });


});