import { DataContainer } from './../../../poker.ui/src/shared/DataContainer';
import { Tournament } from '../../src/model/tournament';
import { TestHelpers } from "../test-helpers";
import { IBroadcastService } from "../../src/services/IBroadcastService";
import { ClientMessage, TournamentRegisterRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { MockWebSocket } from '../mockWebSocket';
import { WebSocketHandle } from '../../src/model/WebSocketHandle';
import { TournamentRegisterRequestHandler } from '../../src/handlers/TournamentRegisterRequestHandler';
import { TournamentRegistration } from '../../src/model/TournamentRegistration';
import { User } from '../../src/model/User';
import { ISubstitute } from '../shared-test-helpers';
import { TournamentLogic } from '../../src/handlers/TournamentLogic';
var assert = require('assert');
import substitute = require('jssubstitute');
import { TournmanetStatus } from '../../../poker.ui/src/shared/TournmanetStatus';

describe('TournamentSubscriptionRequestHandler', () => {
    let handler: TournamentRegisterRequestHandler;
    let handle:WebSocketHandle;
    let socket:MockWebSocket;
    let dataRepository: any;
    let broadcastService:any;
    let tournamentLogic:ISubstitute<TournamentLogic>;
    let tournamentRegistrations:TournamentRegistration[] = [];
    let tournament:Tournament;

    beforeEach(function () {
        socket = new MockWebSocket();
        handle = new WebSocketHandle(socket);
        handle.user = new User();
        handle.user.guid = 'guid1';
        handle.user.activated = true;

        tournament = new Tournament();
        tournament._id = "tournmanetId";
        substitute.throwErrors();
        dataRepository = TestHelpers.getDataRepository();
        dataRepository.getTournmanetById = (id:string) => { return id=='id1'? Promise.resolve(tournament):null} ;
        dataRepository.getTournamentRegistrations = (args: { userGuid?: string; tournamentId?: string; }) => { return Promise.resolve(tournamentRegistrations)} ;
        dataRepository.getUser = () => Promise.resolve(handle.user);
        broadcastService = TestHelpers.getSubstitute(IBroadcastService);        
        tournamentLogic = <any>substitute.for(new TournamentLogic(null,null,null, null, null, null))
        handler = new TournamentRegisterRequestHandler(dataRepository, broadcastService, tournamentLogic);

        
    });

    it('should_register_for_tournament', async () => {
        dataRepository.getTournamentPlayerCount = (tournamentId:number) => { return Promise.resolve(5)} ;
        let message = new ClientMessage();
        message.tournamentRegisterRequest = new TournamentRegisterRequest('id1');        
        handle.user.activated = true;

        await handler.run(handle, message);
        
        dataRepository.receivedWith('saveTournamentRegistration', substitute.arg.matchUsing((arg: TournamentRegistration) => 
        { return arg instanceof TournamentRegistration && arg.tournamentId === 'id1' && arg.userGuid === 'guid1'; }));
        
        broadcastService.receivedWith('broadcast', substitute.arg.matchUsing((arg: DataContainer) => 
        { return arg instanceof DataContainer && arg.tournamentSubscriptionResult.tournaments.length === 1 && arg.tournamentSubscriptionResult.tournaments[0].id=='id1' && arg.tournamentSubscriptionResult.tournaments[0].playerCount===5; }));
                

        let lastMessage = socket.dequeue();
        assert.equal(1, lastMessage.tournamentSubscriptionResult.tournaments.length);
        assert.equal('id1', lastMessage.tournamentSubscriptionResult.tournaments[0].id);
        assert.equal(true, lastMessage.tournamentSubscriptionResult.tournaments[0].joined);

        
    });

    it('cannot_register_as_user_is_not_registered', async () => {        
        dataRepository.getUser = () => Promise.resolve(null);
        let message = new ClientMessage();
        message.tournamentRegisterRequest = new TournamentRegisterRequest('id1');        
        
        await handler.run(handle, message);

        let lastMessage = socket.getLastMessage();
        assert.equal('You must register to play tournaments', lastMessage.error.message);
        dataRepository.didNotReceive('saveTournamentRegistration');
    });

    it('tournament_does_not_exist', async () => {
        let message = new ClientMessage();
        message.tournamentRegisterRequest = new TournamentRegisterRequest('foo');        
        
        await handler.run(handle, message);

        dataRepository.didNotReceive('saveTournamentRegistration');
        let lastMessage = socket.getLastMessage();
        assert.equal('Tournament not found: foo', lastMessage.error.message);
    });

    it('You are already registered for this tournament', async () => {
        let message = new ClientMessage();
        message.tournamentRegisterRequest = new TournamentRegisterRequest('id1');  
        handle.user.activated = true;   
        tournamentRegistrations.push(<TournamentRegistration>{})   
        
        await handler.run(handle, message);

        dataRepository.didNotReceive('saveTournamentRegistration');
        let lastMessage = socket.getLastMessage();
        assert.equal('You are already registered for this tournament', lastMessage.error.message);
    });

    it('You can no longer register for this tournament', async () => {
        let message = new ClientMessage();
        message.tournamentRegisterRequest = new TournamentRegisterRequest('id1');  
        tournament.status =  TournmanetStatus.Started;
        
        await handler.run(handle, message);

        dataRepository.didNotReceive('saveTournamentRegistration');
        let lastMessage = socket.getLastMessage();
        assert.equal('You can no longer register for this tournament', lastMessage.error.message);
    });


});