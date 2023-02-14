import { MailchimpService } from './../../src/services/MailchimpService';
import { BlindConfig } from './../../src/model/tournament';
import { TableState, PlayerTableState } from './../../src/model/TableState';
import { MockWebSocket } from './../mockWebSocket';
import { DataContainer, Account } from './../../../poker.ui/src/shared/DataContainer';
import { Tournament } from '../../src/model/tournament';
import { TestHelpers } from "../test-helpers";
import { IBroadcastService, IPokerTableProvider } from "../../src/services/IBroadcastService";
import { ClientMessage, TournamentRegisterRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { WebSocketHandle } from '../../src/model/WebSocketHandle';
import { TournamentRegisterRequestHandler } from '../../src/handlers/TournamentRegisterRequestHandler';
import { TournamentRegistration } from '../../src/model/TournamentRegistration';
import { User } from '../../src/model/User';
import { TournamentLogic } from '../../src/handlers/TournamentLogic';
import { IDataRepository } from '../../src/services/documents/IDataRepository';
import * as assert from 'assert';
import { TournmanetStatus } from '../../../poker.ui/src/shared/TournmanetStatus';
import { ISubscriber } from '../../src/model/ISubscriber';
import { MockWebSocketHandle } from '../MockWebSocketHandle';
import { Table } from '../../src/table';
import { TournamentResult } from '../../src/model/TournamentResult';
import { TableConfig } from '../../src/model/TableConfig';
import { ISubstitute } from '../shared-test-helpers';
var ObjectID = require('mongodb').ObjectID; 
import substitute from 'jssubstitute';
import { ChangeSeatHistory } from '../../src/model/ChangeSeatHistory';
import { ITimerProvider } from '../../src/model/table/ITimerProvider';
import { TimerProvider } from '../../src/model/table/TimerProvider';
import { IEmailSender } from '../../src/email/IEmailSender';
import environment from '../../src/environment';
import { Payment } from '../../src/model/Payment';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { PaymentStatus } from '../../../poker.ui/src/shared/PaymentStatus';
import { Decimal } from '../../../poker.ui/src/shared/decimal';

describe('TournamentLogic', () => {
    substitute.throwErrors();
    let handler: TournamentLogic;
    let dataRepository: ISubstitute<IDataRepository>;
    let broadcastService:ISubstitute<IBroadcastService>;
    let timerProvider:ISubstitute<ITimerProvider>;
    let tournament3:Tournament;
    let tournament3StartTime:Date;
    let tournaments:Tournament[] = [];    
    let registrations:TournamentRegistration[];    
    let pokerTableProvider:ISubstitute<IPokerTableProvider>;
    let emailSender:ISubstitute<IEmailSender>;
    let mailchimpService:ISubstitute<MailchimpService>;
    let userAccount:Account;

    let getPlayers = (size:number)=>{
        let players:any[] = [ ];
        for (let i = 1; i<=size; i++) {
            players.push( { guid: 'guid'+i})
        }
        return players;
    }

    let addSubscribers = (count?:number) : MockWebSocketHandle[] => {
        count = count || 12;
        let subscribers:MockWebSocketHandle[] = [];
        for(let i=1;i<=count;i++){
            let subscriber = new MockWebSocketHandle('guid'+i);            
            subscribers.push(subscriber)
            handler.addSubscriber(subscriber);
        }
        return subscribers
    }


    beforeEach(()=> {
        userAccount = new Account('dash', 3000000);
        let ptpSub = {
            tables: <Table[]> [],

            addTable(table:Table){
                table.broadcastService = broadcastService;
                this.tables.push(table);
            },
            findTable(id:string){
                return this.tables.find(t=>t.tableId==id);
            },
            removeTables(options: { tournamentId: string; }): void {  },
            getTables():Table[] { return this.tables }  
        };
        
        let eSender = new IEmailSender();
        eSender.sendEmail = (to:string, subject:string, html:string, text?:string, fromEmail?:string, bccs?:string[])=> { 
            return Promise.resolve('')
        };
        emailSender = <any>substitute.for(eSender);
        mailchimpService = <any>substitute.for(new MailchimpService());
        pokerTableProvider = <any>substitute.for(ptpSub);
        
        pokerTableProvider.callsThrough('addTable')    
        pokerTableProvider.callsThrough('findTable')    
        pokerTableProvider.callsThrough('getTables')    

        timerProvider = <any>substitute.for(new TimerProvider(null));
        let tournament1 = new Tournament();
        tournament1._id = "id1";
        tournament1.startTime = new Date(new Date().getTime() + (-60*60*1000)).toISOString();//already started
        tournament1.status = TournmanetStatus.Started;
        let tournament2 = new Tournament();
        tournament2._id = "id2";
        tournament2.startTime = new Date(new Date().getTime() + (60*60*1000)).toISOString();//starts one hour from now
        tournament3 = new Tournament();
        tournament3.name = 'tournament3'
        tournament3._id = "id3";
        tournament3StartTime = new Date(new Date().getTime() + (-60*1000));
        tournament3.startTime = tournament3StartTime.toISOString();//started one min ago
        tournament3.startingChips = 1000;
        tournament3.minPlayers = 4;
        tournament3.playersPerTable = 6;
        tournament3.blindConfig = [ new BlindConfig(10,20,5) ]
        tournament3.timeToActSec = 30;        
        tournament3.awardPrizesAfterMinutes = 1;
        tournament3.prizes = ['0.5', '0.25', '0.10', '0.05', '0.04', '0.03', '0.02', '0.01'];
        tournament3.currency = 'dash';
        tournament3.rebuyForMin = 60;
        tournament3.rebuyAmount = '0.01';

        let repository = new IDataRepository();
        tournaments.push(tournament1, tournament2, tournament3)
        repository.getTournaments = (args:any) => Promise.resolve(tournaments)
        repository.getChatMessages =(tableId?: string) => Promise.resolve([]);
        registrations = [];
        for(let i=1;i<=12;i++){
            registrations.push(<TournamentRegistration>{tournamentId:'id1', userGuid:'guid'+i})
        }
        repository.getTournamentRegistrations = (args: { userGuid?: string; tournamentId?: string; }) => {
            let temp = registrations.filter(r=>!args.userGuid || args.userGuid == r.userGuid);
            return Promise.resolve(temp)
        };
        repository.getUser = (guid:any) => {
            let user = new User();
            user.guid = guid;
            user.email = `${guid}@foo`;
            return Promise.resolve(user);
        }
        repository.saveTableStates = (states:TableState[]) =>{
            for(let state of states){
                if(!state._id){
                    state._id = new ObjectID()
                }                
            }
                
            return Promise.resolve([]);
        }
        repository.getUserAccount = (guid: string, currency: string)=>{
            return Promise.resolve(userAccount);
        }
        repository.updateUserAccount = ()=>{
            return Promise.resolve({ result: { nModified: 1 }});
        }
        repository.getTournamentBuyIns = ()=>{
            return Promise.resolve(new Decimal(0.01));
        }
        
        dataRepository = <any>substitute.for(repository); 
        dataRepository.callsThrough('getTournaments');
        dataRepository.callsThrough('getTournamentRegistrations');
        dataRepository.callsThrough('getUser');
        dataRepository.callsThrough('saveTableStates');
        dataRepository.callsThrough('getChatMessages');       
        dataRepository.callsThrough('getUserAccount');       
        dataRepository.callsThrough('updateUserAccount');       
        dataRepository.callsThrough('getTournamentBuyIns');       
        
        emailSender.callsThrough('sendEmail');

        broadcastService = <any>substitute.for(new IBroadcastService());
        handler = new TournamentLogic(dataRepository, pokerTableProvider, (p:any)=> timerProvider, null, emailSender, mailchimpService);     
        handler.sendOfflinePlayersEmail = true; 
        
    });

    it('tournament_with_less_than_minimum_number_of_players_is_not_started', async () => {
        dataRepository.getTournamentRegistrations = (guid:any) => Promise.resolve([ <TournamentRegistration>{tournamentId:'id1', userGuid:'guid1'} ]);

        await handler.run();

        dataRepository.receivedWith('saveTournmanet', substitute.arg.matchUsing((arg: Tournament) => 
        { return arg != null && arg._id==="id3" && arg.status === TournmanetStatus.Abandoned; }));
        
    });

    it('tournament_is_updated_to_started', async () => {
        
        let subscribers = addSubscribers();

        await handler.run();

        for(let subscriber of subscribers){
            let lastMessage = subscriber.mockWebSocket.getLastMessage();
            assert.equal(lastMessage!=null, true)
            assert.equal(lastMessage.tournamentSubscriptionResult.tournaments[0].status, TournmanetStatus.Started)
            assert.equal(lastMessage.tournamentSubscriptionResult.tournaments[0].id, tournament3._id)
        }

        dataRepository.receivedWith('getTournaments', substitute.arg.matchUsing((arg: any) => 
        { return arg != null && arg.status.$nin[0] === TournmanetStatus.Complete; }));

        dataRepository.receivedWith('saveTournmanet', substitute.arg.matchUsing((arg: Tournament) => 
        { return arg != null && arg._id==="id3" && arg.status === TournmanetStatus.Started; }));
        
    });

    it('init', async () => {
        (<any>dataRepository).getTournamentResults = (guid:any) => Promise.resolve([{ userGuid: "guid4"}]);
        dataRepository.callsThrough('getTournamentResults');

        let states:TableState[] = [];
        states.push( 
            { _id: new ObjectID(), 
                tournamentId:null, 
                config:null, 
                players: [
                    <PlayerTableState>{ guid: "guid2", screenName:"user1", seat: 2, stack: "1000"},
                    <PlayerTableState>{ guid: "guid3", screenName:"user2", seat: 3, stack: "1000"},
                    <PlayerTableState>{ guid: "guid1", screenName:"user3", seat: 1, stack: "1000"},
                    <PlayerTableState>{ guid: "guid4", screenName:"user4", seat: 4, stack: "0"},//will not be added
                    
                ],

                dealerSeat: 2
    });
        dataRepository.getTableStates = (args?:any) : Promise<TableState[]> =>{
            return Promise.resolve(args.tournamentId == tournament3._id ? states : []);                
        }
        tournaments = [ tournament3 ];        
        

        await handler.init();        
        
        assert.equal(1, handler.tournaments.length);
        assert.equal(tournament3, handler.tournaments[0].tournament);
        assert.equal(4, handler.tournaments[0].seated.length);
        assert.equal("guid2", handler.tournaments[0].seated[0]);
        assert.equal("guid3", handler.tournaments[0].seated[1]);
        assert.equal("guid1", handler.tournaments[0].seated[2]);
        assert.equal("guid4", handler.tournaments[0].seated[3]);
        assert.equal(1, handler.tournaments[0].tables.length);
        assert.equal(states[0]._id, handler.tournaments[0].tables[0].tableConfig._id);
        assert.equal(2, handler.tournaments[0].tables[0].dealerSeat);
        const players = handler.tournaments[0].tables[0].getPlayers();
        assert.equal(3, players.length);
        assert.equal("guid1", players[0].guid);
        assert.equal("guid2", players[1].guid);
        assert.equal("guid3", players[2].guid);
        pokerTableProvider.receivedWith('addTable', substitute.arg.matchUsing((arg: Table) => { 
            if(arg == undefined)
                return false;
            
                assert.equal(handler.tournaments[0].id, arg.tournamentId);
            return true;
        }));          
        
    });

    it('startTournament', async () => {
        
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);
        
        await handler.startTournament(tournament3, users, registrations);
        
        assert.equal(handler.tournaments[0].id, tournament3._id);
        let tables = handler.tournaments[0].tables;
        let count = 0;
        for(let table of tables){            
            assert.equal(6, table.getPlayers().length);
            assert.equal(10, table.tableConfig.smallBlind);
            assert.equal(20, table.tableConfig.bigBlind);
            assert.equal(30, table.tableConfig.timeToActSec);
            assert.equal(table.tableConfig.maxPlayers, tournament3.playersPerTable);
            assert.equal(tournament3.blindConfig, table.blindConfig);
            assert.equal(tournament3StartTime.toISOString(), table.blindsStartTime.toISOString());
            assert.equal(2, table.gameStartDelaySec);
            assert.equal(-1, table.dealerSeat);
            assert.equal(`Table ${++count}`, table.tableConfig.name);
            let seat:number = 1;
            for(let player of table.getPlayers()){                
                assert.equal(player.seat, seat);
                assert.equal(player.stack, 1000);
                assert.equal(true, player.isDisconnected);
                seat++;
            }
        }

        for(let subscriber of subscribers){
            let lastMessage = subscriber.mockWebSocket.getLastMessage();
            assert.equal(2, lastMessage.tableConfigs.rows.length)
            assert.equal('Table 1', lastMessage.tableConfigs.rows[0].name)
            assert.equal('Table 2', lastMessage.tableConfigs.rows[1].name)
        }

        let states1 = <TableState[]>dataRepository.argsForCall('saveTableStates', 0)[0];
        let states2 = <TableState[]>dataRepository.argsForCall('saveTableStates', 1)[0];
        assert.equal(1, states1.length);
        assert.equal(1, states2.length);
        for(let state of [states1[0], states2[0]]){
            assert.equal("id3", state.tournamentId);                    
            assert.equal(6, state.players.length);
            assert.equal(true, state.players[0].guid.startsWith('guid'));
            assert.equal(1, state.players[0].seat);
        }
        

        assert.equal(tables[1].getPlayers().length, 6);        

        pokerTableProvider.receivedWith('addTable', substitute.arg.matchUsing((arg: Table) => { 
            if(arg == undefined)
                return false;
            
                assert.equal(handler.tournaments[0].id, arg.tournamentId);
            return true;
        }));              
    });

    it('only current subscribers are seated', async () => {

        addSubscribers(7);                        
        
        await handler.checkTournament(tournament3);
        
        assert.equal(handler.tournaments[0].seated.length, 7);
        assert.equal(handler.tournaments[0].id, tournament3._id);
        let tables = handler.tournaments[0].tables;
        assert.equal(tables.length, 2)
        assert.equal(tables[0].getPlayerCount(), 3)
        assert.equal(tables[1].getPlayerCount(), 4)
        let emailArgs = emailSender.argsForCall('sendEmail', 0);
        assert.equal(emailArgs[0], null)
        assert.equal(emailArgs[1], 'Your Tournament has started')
        assert.equal(emailArgs[2].indexOf('</head>') > -1, true)
        assert.equal(emailArgs[3], null)
        assert.equal(emailArgs[4], null)
        let bccs:string[] = emailArgs[5];
        assert.equal(bccs.length, 5)
        assert.equal(bccs[0], 'guid8@foo');
        assert.equal(bccs[1], 'guid9@foo');
    });

    it('subscribeToTournament', async () =>{
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);        
        await handler.startTournament(tournament3, users, registrations);

        let table = await handler.getTournamentTable(tournament3._id, null, subscribers[0]);

        assert.equal(table.tableId.length, 24)//some mongo id
    });

    it('player who registered but was offline when tournament started is added to a table when online', async () =>{
        addSubscribers(7);        
        tournament3.lateRegistrationMin = 30;
        await handler.checkTournament(tournament3);
        let subscriber = new MockWebSocketHandle('guid8');            
        handler.addSubscriber(subscriber);

        let table = await handler.getTournamentTable(tournament3._id, null, subscriber);

        assert.equal(handler.tournaments[0].id, tournament3._id);
        let tables = handler.tournaments[0].tables;
        assert.equal(tables.length, 2)
        assert.equal(tables[0], table)
        assert.equal(tables[0].getPlayerCount(), 4)
        assert.equal(tables[1].getPlayerCount(), 4)
        assert.equal(handler.tournaments[0].seated.length, 8)
        assert.equal(handler.tournaments[0].seated[7], "guid8")
       
    });

    it('player who registered but was offline when tournament started is not added when online due to late registration', async () =>{
        addSubscribers(7);     
        let startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - 31);
        tournament3.startTime = startTime.toISOString();
        tournament3.lateRegistrationMin = 30;
        await handler.checkTournament(tournament3);
        let subscriber = new MockWebSocketHandle('guid8');            
        handler.addSubscriber(subscriber);

        let table = await handler.getTournamentTable(tournament3._id, null, subscriber);

        assert.equal(handler.tournaments[0].id, tournament3._id);
        let tables = handler.tournaments[0].tables;
        assert.equal(tables.length, 2)
        assert.equal(null, table)
        assert.equal(tables[0].getPlayerCount(), 3)
        assert.equal(tables[1].getPlayerCount(), 4)
        assert.equal(handler.tournaments[0].seated.length, 7)        
       
    });

    it('onPlayersBusted equal finish', async () =>{
        
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);
        await handler.startTournament(tournament3, users, registrations);
        let players = handler.tournaments[0].tables[0].getPlayers();        
        let bustedPlayers = players.splice(0, 2);
        
        await handler.onPlayersBusted(handler.tournaments[0].tables[0].tournamentId, bustedPlayers);

        dataRepository.didNotReceive('saveTournmanet');
        dataRepository.receivedWith('saveTournamentResult', substitute.arg.matchUsing((results: TournamentResult[]) => { 
            if(results == undefined)
                return false;
            assert.equal(2, results.length);            
            assert.equal(results[0].tournamentId, "id3");            
            assert.equal(results[0].placing, 11);            
            assert.equal(results[0].userGuid, bustedPlayers[0].guid);            
            assert.equal(results[1].tournamentId, "id3");            
            assert.equal(results[1].placing, 11);            
            assert.equal(results[1].userGuid, bustedPlayers[1].guid);                        
             
            return true;
        }));

        let subscriber = subscribers.find(s=>s.user.guid==bustedPlayers[0].guid);
        
        let message = subscriber.mockWebSocket.getLastMessage();        
        assert.notEqual(message.tournamentResult, null);
        assert.equal(message.tournamentResult.placing, 11);
        assert.equal(message.tournamentResult.tournamentName, 'tournament3');
    });

    it('2nd last player busts out', async () =>{
        
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);
        await handler.startTournament(tournament3, users, registrations);
        handler.tournaments[0].tables.splice(0, 1);
        let players = handler.tournaments[0].tables[0].getPlayers();        
        let removePlayers = players.splice(0, 5);
        let bustedPlayers = [removePlayers[0]]
        let winner = players[0];
        timerProvider.clearCalls('startTimer');

        await handler.onPlayersBusted(handler.tournaments[0].tables[0].tournamentId, bustedPlayers);

        let results = dataRepository.argsForCall('saveTournamentResult')[0];        
        assert.equal(2, results.length);            
        assert.equal(results[0].tournamentId, "id3");            
        assert.equal(results[0].placing, 2);            
        assert.equal(results[0].userGuid, bustedPlayers[0].guid);            
        assert.equal(results[1].tournamentId, "id3");            
        assert.equal(results[1].placing, 1);            
        assert.equal(results[1].userGuid, winner.guid); 
              
        {
            let subscriber = subscribers.find(s=>s.user.guid==bustedPlayers[0].guid);        
            let message = subscriber.mockWebSocket.getLastMessage();        
            assert.equal(message.tournamentResult.placing, 2);
            assert.equal(message.tournamentResult.tournamentName, 'tournament3');
        }

        {
            let subscriber = subscribers.find(s=>s.user.guid==winner.guid);        
            let message = subscriber.mockWebSocket.getLastMessage();        
            assert.equal(message.tournamentResult.placing, 1);
            assert.equal(message.tournamentResult.tournamentName, 'tournament3');
        }

        dataRepository.receivedWith('saveTournmanet', substitute.arg.matchUsing((arg: Tournament) => 
        { return arg != null && arg._id==="id3" && arg.status === TournmanetStatus.Complete; }));

        let timerArgs = timerProvider.argsForCall('startTimer', 0);
        assert.equal(timerArgs[0].name, 'awardPrizes');
        assert.equal(timerArgs[1], 60000);
        assert.equal(timerArgs[2], null);                
        
    });

    let removeFromTable = (table:Table, count:number)=>{
        for (let i = 0; i < count; i++) {            
            let playerHandle = table.getPlayers()[0];
            let subscriber = table.subscribers.find(s=>s.user.guid==playerHandle.guid);
            table.removePlayer(playerHandle)
            table.removeSubscriber(subscriber)
        }
    }

    it('players are reseated', async ()=>{
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);
        await handler.startTournament(tournament3, users, registrations);
        for(let subscriber of subscribers){
            let table = await handler.getTournamentTable(tournament3._id, null, subscriber);
            await table.addSubscriber(subscriber)
        }
        let table1 = handler.tournaments[0].tables[0];      
        let table2 = handler.tournaments[0].tables[1];  
        removeFromTable(table1, 3);
        removeFromTable(table2, 2); //table 2 has 4 players but 1 busts and should be moved to table 1       
        let table1Players = table1.getPlayers().slice(0);        
        let table2Players = table2.getPlayers().slice(0);  
        let bustedPlayer = table2.getPlayers()[3];
        bustedPlayer.stack = 0;
        table1.setCurrentPlayers(table1.getPlayers());
        table2.setCurrentPlayers(table2.getPlayers());
        dataRepository.clearCalls('saveTableStates')

        await handler.tournaments[0].tables[1].postShowdown();
        
        let players = table1.getPlayers();
        assert.equal(players.length, 6)        
        assert.equal(players.find(p=>p.seat==1).guid, table2Players[0].guid)
        assert.equal(players.find(p=>p.seat==2).guid, table2Players[1].guid)
        assert.equal(players.find(p=>p.seat==3).guid, table2Players[2].guid)
        assert.equal(players.find(p=>p.seat==4).guid, table1Players[0].guid)
        assert.equal(players.find(p=>p.seat==5).guid, table1Players[1].guid)
        assert.equal(players.find(p=>p.seat==6).guid, table1Players[2].guid)
        assert.equal(table2.getPlayers().length, 0)
        assert.equal(table2.subscribers.length, 1)
        assert.equal(table2.subscribers[0].user.guid, bustedPlayer.guid)
        assert.equal(table1.getPlayers().length, 6)
        assert.equal(table1.subscribers.length, 6)        
        for(let player of table1.getPlayers()){
            if(!table1.subscribers.find(s=>s.user.guid == player.guid)){
                assert.fail(`expecting player ${player.guid} at seat ${player.seat} to be a subscriber`)
            }
        }

        let changeSeatHistory = <ChangeSeatHistory>dataRepository.argsForCall('saveChangeSeatHistory', 0)[0];
        assert.equal(changeSeatHistory.tournamentId, tournament3._id)
        assert.equal(changeSeatHistory.table.id, table2.tableConfig._id)
        assert.equal(changeSeatHistory.table.players.length, 3)
        assert.equal(changeSeatHistory.table.players[0].guid, table2Players[0].guid)
        assert.equal(changeSeatHistory.otherTables.length, 1)
        assert.equal(changeSeatHistory.otherTables[0].players.length, 3)
        assert.equal(changeSeatHistory.otherTables[0].players[0].guid, table1Players[0].guid)
        assert.equal(changeSeatHistory.result.joining.length, 0)
        assert.equal(changeSeatHistory.result.leaving.length, 3);

        let tableStateDbCallArgs = dataRepository.argsForCall('saveTableStates', 0)[0];
        let tableState1 = <TableState>tableStateDbCallArgs[0];
        let tableState2 = <TableState>tableStateDbCallArgs[1]
        assert.equal(tableState1._id, table1.tableId)
        assert.equal(tableState1.players.length, 6)

        assert.equal(tableState2._id, table2.tableId)
        assert.equal(tableState2.players.length, 0)
    })

    it('late registration', async ()=>{
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);                
        await handler.startTournament(tournament3, [users[0], users[1]], registrations);
        for(let subscriber of subscribers){
            subscriber.mockWebSocket.clearMessages();
        }

        await handler.lateRegistration(tournament3._id, users[users.length-1].guid);

        let players = handler.tournaments[0].tables[0].getPlayers();
        assert.equal(players.length, 3)
        assert.equal(players[players.length-1].guid, 'guid12')
        let subscriber = subscribers[subscribers.length-1];
        assert.equal(subscriber.mockWebSocket.outgoingMessages.length, 3)
        let message1 = subscriber.mockWebSocket.outgoingMessages[0];//subscribeTableResult        
        assert.equal(message1.tableSeatEvents.seats.length, 3)
        assert.equal(message1.subscribeTableResult.tableConfig.numPlayers, 3)
        
        let message2 = subscriber.mockWebSocket.outgoingMessages[1];//player joining
        assert.equal(message2.tableSeatEvents.seats.length, 1)
        assert.equal(message2.tableSeatEvents.seats[0].guid, 'guid12')

        let message3 = subscriber.mockWebSocket.outgoingMessages[2];//tableConfigs        
        assert.equal(message3.tableConfigs.rows[0].numPlayers, 3)
    })

    it('late registration player already playing is not added to table', async ()=>{
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user).slice(0, 11);                
        await handler.startTournament(tournament3, users, registrations);
             
        
        await handler.lateRegistration(tournament3._id, users[10].guid);

        assert.equal(handler.tournaments[0].tables[0].getPlayers().length, 6)        
        assert.equal(handler.tournaments[0].tables[1].getPlayers().length, 5)        
    });

    it('late registration new table is created', async ()=>{
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user); 
        await handler.startTournament(tournament3, users, registrations);        
        for(let subscriber of subscribers){
            subscriber.mockWebSocket.clearMessages();
        }  

        await handler.lateRegistration(tournament3._id, 'guid13');

        assert.equal(handler.tournaments[0].tables.length, 3)        
        assert.equal(handler.tournaments[0].tables[2].getPlayers().length, 1)        
        assert.equal(handler.tournaments[0].tables[2].getPlayers()[0].guid, 'guid13');
        let subscriber = subscribers[0];        
        assert.equal(subscriber.mockWebSocket.outgoingMessages.length, 1)     
        assert.equal(subscriber.mockWebSocket.outgoingMessages[0].tableConfigs.rows[0].numPlayers, 1);
    });

    it('no rebuy as exceeds rebuyForMin', async ()=>{
        let subscribers = addSubscribers();
        let subscriber = subscribers[0];
        tournament3.startTime = new Date(new Date().getTime() + (-60*61*1000)).toISOString();//started 61 min ago
        let results:TournamentResult[] = [ new TournamentResult(tournament3._id, subscriber.user.guid, subscriber.user.screenName, 7, new Date()) ]
        
        await handler.sendTournamentResults(results, tournament3, 2);

        dataRepository.didNotReceive('getTournamentRegistrations')
        let lastMessage = subscriber.mockWebSocket.getLastMessage();        
        let tournamentResult= lastMessage.tournamentResult;
        assert.equal(tournamentResult.placing, 7);
        assert.equal(tournamentResult.tournamentName, 'tournament3');
        assert.equal(tournamentResult.currency, 'dash');
        assert.equal(tournamentResult.rebuyAmount, null);
        
    });

    it('first rebuy offered on bust', async ()=>{
        let subscribers = addSubscribers();
        let subscriber = subscribers[0];
        let results:TournamentResult[] = [ new TournamentResult(tournament3._id, subscriber.user.guid, subscriber.user.screenName, 7, new Date()) ]
        
        await handler.sendTournamentResults(results, tournament3, 2);

        let lastMessage = subscriber.mockWebSocket.getLastMessage();        
        let tournamentResult= lastMessage.tournamentResult;
        assert.equal(tournamentResult.placing, 7);
        assert.equal(tournamentResult.tournamentName, 'tournament3');
        assert.equal(tournamentResult.currency, 'dash');
        assert.equal(tournamentResult.rebuyAmount, '0.01');
    });

    it('second rebuy offered on bust', async ()=>{
        let subscribers = addSubscribers();
        let subscriber = subscribers[0];
        let results:TournamentResult[] = [ new TournamentResult(tournament3._id, subscriber.user.guid, subscriber.user.screenName, 7, new Date()) ]
        registrations.find(r=>r.userGuid==subscriber.user.guid).rebuyCount=1;

        await handler.sendTournamentResults(results, tournament3, 2);

        let lastMessage = subscriber.mockWebSocket.getLastMessage();        
        let tournamentResult= lastMessage.tournamentResult;
        assert.equal(tournamentResult.rebuyAmount, '0.02'); 
    });

    it('third rebuy offered on bust', async ()=>{
        let subscribers = addSubscribers();
        let subscriber = subscribers[0];
        let results:TournamentResult[] = [ new TournamentResult(tournament3._id, subscriber.user.guid, subscriber.user.screenName, 7, new Date()) ]
        registrations.find(r=>r.userGuid==subscriber.user.guid).rebuyCount=2;

        await handler.sendTournamentResults(results, tournament3, 2);

        let lastMessage = subscriber.mockWebSocket.getLastMessage();        
        let tournamentResult= lastMessage.tournamentResult;
        assert.equal(tournamentResult.rebuyAmount, '0.04'); 
    });

    it('rebuy not allowed due to player count', async ()=>{

        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);                
        await handler.startTournament(tournament3, [users[0]], registrations);
        
        let user = users[users.length-1];        
        userAccount.updateIndex = 0;

        await handler.rebuy(tournament3._id, user);

        dataRepository.didNotReceive('updateUserAccount')
        let players = handler.tournaments[0].tables[0].getPlayers();
        assert.equal(players.length, 1)
    });

    it('rebuy does not proceed due to debit error', async ()=>{

        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);                
        await handler.startTournament(tournament3, [users[0], users[1]], registrations);
        
        let user = users[users.length-1];
        userAccount = new Account('dash', 0);
        userAccount.updateIndex = 0;

        await handler.rebuy(tournament3._id, user);

        dataRepository.didNotReceive('updateUserAccount')
        dataRepository.didNotReceive('getUser')
        let players = handler.tournaments[0].tables[0].getPlayers();
        assert.equal(players.length, 2)
    });

    it('rebuy', async ()=>{
        tournament3.housePrize = '1'
        let subscribers = addSubscribers();
        let users = subscribers.map(s=>s.user);                
        await handler.startTournament(tournament3, [users[0], users[1]], registrations);
        for(let subscriber of subscribers){
            subscriber.mockWebSocket.clearMessages();
        }
        let subscriber = subscribers[subscribers.length - 1];
        let user = users[users.length-1];
        userAccount = new Account('dash', 10000000);
        userAccount.updateIndex = 0;
        registrations.find(r=>r.userGuid==subscriber.user.guid).rebuyCount=1;

        await handler.rebuy(tournament3._id, user);

        let updateUserAccountArgs = dataRepository.argsForCall('updateUserAccount', 0);
        assert.equal(updateUserAccountArgs[0], user.guid)
        assert.equal(updateUserAccountArgs[1], 'dash')
        assert.equal(updateUserAccountArgs[2], -2000000)
        assert.equal(updateUserAccountArgs[3], 0)

        let payment = <Payment>dataRepository.argsForCall('savePayment', 0)[0];
        assert.equal(payment.type, PaymentType.outgoing)
        assert.equal(payment.amount, '2000000')
        assert.equal(payment.currency, 'dash')
        assert.equal(payment.guid, user.guid)
        assert.equal(payment.status, PaymentStatus.complete)
        assert.equal(payment.isTournamentRebuy, true)
        assert.equal(payment.tournamentId, tournament3._id)
        assert.equal(payment.tournamentName, tournament3.name)

        let tournamentRegistration = <TournamentRegistration>dataRepository.argsForCall('saveTournamentRegistration', 0)[0];
        assert.equal(tournamentRegistration.userGuid, user.guid)
        assert.equal(tournamentRegistration.rebuyCount, 2)

        let message1 = subscriber.mockWebSocket.outgoingMessages[0];
        assert.equal(message1.user != null, true)

        let players = handler.tournaments[0].tables[0].getPlayers();
        assert.equal(players.length,  3)
        assert.equal(players[players.length-1].guid, user.guid)
        let lastMessage = subscriber.mockWebSocket.outgoingMessages[subscriber.mockWebSocket.outgoingMessages.length -1];
        assert.equal('id3', lastMessage.tournamentSubscriptionResult.tournaments[0].id)
        assert.equal(1.01, lastMessage.tournamentSubscriptionResult.tournaments[0].totalPrize)
    });

    let assertPlayers = (count:number, tables:any)=>{
        for(let i=1;i<count;i++){
            let guid = 'guid'+i;
            let player = null;
            for(let table of tables){
                player = table.users.find((u:any)=>u.user.guid==guid);
                if(player){
                    break;
                }
            }
            if(player == null){                
                assert.fail(false, true, 'could not find player: ' + guid);
            }
        }
    }

    it('seatPlayers_where_player_count_12', async () => {
       
        let tables = handler.getSeatingArrangement(getPlayers(12), tournament3.playersPerTable);
        
        assert.equal(tables.length, 2);
        
        assert.equal(tables[0].users.length, 6);
        assert.equal(tables[1].users.length, 6);        
        assertPlayers(12, tables);
    });

    it('addSubscriber', async () => {

        let subscriber = TestHelpers.getSubstitute(ISubscriber);
        
        handler.addSubscriber(subscriber);
        handler.addSubscriber(subscriber);

        assert.equal(handler.subscribers.length, 1);
    });

    it('seatPlayers_where_player_count_37', () => {

        let tables = handler.getSeatingArrangement(getPlayers(37), tournament3.playersPerTable);
        
        assert.equal(tables.length, 7);
        assert.equal(tables[0].users.length, 5);
        assert.equal(tables[1].users.length, 5);
        assert.equal(tables[2].users.length, 5);
        assert.equal(tables[3].users.length, 6);
        assert.equal(tables[4].users.length, 6);
        assert.equal(tables[5].users.length, 6);
        assert.equal(tables[6].users.length, 4);
        assertPlayers(37, tables);
        
    });

    it('seatPlayers_where_player_count_7', () => {

        let tables = handler.getSeatingArrangement(getPlayers(7), tournament3.playersPerTable);
        
        assert.equal(tables.length, 2);
        assert.equal(tables[0].users.length, 3);
        assert.equal(tables[1].users.length, 4);
        assertPlayers(7, tables);
        
    });

    it('seatPlayers_where_player_count_8', () => {

        let tables = handler.getSeatingArrangement(getPlayers(8), tournament3.playersPerTable);
        
        assert.equal(tables.length, 2);
        assert.equal(tables[0].users.length, 4);
        assert.equal(tables[1].users.length, 4);
        assertPlayers(8, tables);
        
    });

    it('seatPlayers_where_player_count_9', () => {

        let tables = handler.getSeatingArrangement(getPlayers(9), tournament3.playersPerTable);
        
        assert.equal(tables.length, 2);
        assert.equal(tables[0].users.length, 5);
        assert.equal(tables[1].users.length, 4);
        assertPlayers(9, tables);
        
    });

    it('seatPlayers_where_player_count_10', () => {

        let tables = handler.getSeatingArrangement(getPlayers(10), tournament3.playersPerTable);
        
        assert.equal(tables.length, 2);
        assert.equal(tables[0].users.length, 6);
        assert.equal(tables[1].users.length, 4);
        assertPlayers(10, tables);
    });


    it('seatPlayers_where_player_count_11', () => {

        let tables = handler.getSeatingArrangement(getPlayers(11), 5);
        
        assert.equal(tables.length, 3);
        assert.equal(tables[0].users.length, 3);
        assert.equal(3, tables[0].users[0].seat);
        assert.equal(4, tables[0].users[1].seat);
        assert.equal(5, tables[0].users[2].seat);

        assert.equal(tables[1].users.length, 4);
        assert.equal(2, tables[1].users[0].seat);
        assert.equal(3, tables[1].users[1].seat);
        assert.equal(4, tables[1].users[2].seat);
        assert.equal(5, tables[1].users[3].seat);

        assert.equal(tables[2].users.length, 4);
        assert.equal(1, tables[2].users[0].seat);
        assert.equal(2, tables[2].users[1].seat);
        assert.equal(3, tables[2].users[2].seat);
        assert.equal(4, tables[2].users[3].seat);

        assertPlayers(11, tables);
        
    });


    it('seatPlayers_where_player_count_13', () => {

        let tables = handler.getSeatingArrangement(getPlayers(13), tournament3.playersPerTable);
        
        assert.equal(tables.length, 3);
        assert.equal(tables[0].users.length, 4);
        assert.equal(tables[1].users.length, 5);
        assert.equal(tables[2].users.length, 4);
        assertPlayers(13, tables);
        
    });
    
    it('seatPlayers_where_player_count_19', () => {

        let tables = handler.getSeatingArrangement(getPlayers(19), tournament3.playersPerTable);
        
        assert.equal(tables.length, 4);
        assert.equal(tables[0].users.length, 5);
        assert.equal(tables[1].users.length, 5);
        assert.equal(tables[2].users.length, 5);
        assert.equal(tables[3].users.length, 4);
        assertPlayers(19, tables);
    });

    it('seatPlayers 9 players in 3-player-max config', () => {

        let tables = handler.getSeatingArrangement(getPlayers(9), 3);
        
        assert.equal(tables.length, 3);
        assert.equal(tables[0].users.length, 3);
        assert.equal(tables[1].users.length, 3);
        assert.equal(tables[2].users.length, 3);
        assertPlayers(9, tables);
    });

    it('seatPlayers 9 players in 4-player-max config', () => {

        let tables = handler.getSeatingArrangement(getPlayers(9), 4);
        
        assert.equal(tables.length, 3);
        assert.equal(tables[0].users.length, 3);
        assert.equal(tables[1].users.length, 3);
        assert.equal(tables[2].users.length, 3);
        assertPlayers(9, tables);
    });



});