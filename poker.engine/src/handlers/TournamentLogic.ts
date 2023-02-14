import { TelegramService } from './../framework/telegram/telegram.service';
import { TableState } from './../model/TableState';
import { DataContainer, TournamentSubscriptionResult, TableConfigs } from './../../../poker.ui/src/shared/DataContainer';
import { Currency, CurrencyUnit } from './../../../poker.ui/src/shared/Currency';
import { Table } from './../table';
import { IDataRepository } from "../services/documents/IDataRepository";
import { IPokerTableProvider } from "../services/IBroadcastService";
import { Tournament } from "../model/tournament";
import { Logger, getLogger} from "log4js";
import { User } from "../model/User";
import { TournmanetStatus } from '../../../poker.ui/src/shared/TournmanetStatus';
import { ISubscriber } from '../model/ISubscriber';
import { removeItem,  setupTable as helpersSetupTable, getBlindConfig, getRandomItem, getRandomItemAndIndex, getTableViewRow, getAdminTournamentResultsView, isWithinLateRegistration, getTotalPrize, getCalculatedPrizes, isWithinPeriod, debitAccount, getUserData } from '../helpers';
import { broadcast } from "../protobuf-helpers";
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { TableConfig } from '../model/TableConfig';
import { TournamentResult } from '../model/TournamentResult';
import { TournamentViewRow } from '../../../poker.ui/src/shared/tournmanet-view-row';
import { ChangeSeatingLogic, ChangeSeatingItem, ChangeSeatingResult } from '../tournament/ChangeSeatingLogic';
import { ChangeSeatHistory, ChangeSeatHistoryTable, ChangeSeatHistoryPlayer, ChangeSeatingHistoryResult, ChangeSeatingHistoryItem } from '../model/ChangeSeatHistory';
import { UserSmall } from '../model/UserSmall';
import { TableProcessor, TableProcessorMessage } from '../admin/processor/table-processor/TableProcessor';
import { JoinTableRequest } from '../model/table/JoinTableRequest';
import { ITimerProvider } from '../model/table/ITimerProvider';
import { PostShowdownEvent } from '../model/table/PostShowdownEvent';
import { PlayerTableHandle } from '../model/table/PlayerTableHandle';
import { TournamentResultView } from '../../../poker.ui/src/shared/TournamentResultView';
import * as _ from "lodash";
import { GameServerProcessorMessage } from '../admin/processor/GameServerProcessorMessage';
import { AwardPrizesRequest } from '../admin/processor/model/AwardPrizesRequest';
import { GameServerProcessor } from '../admin/processor/GameServerProcessor';
import { TournamentHandle } from './TournamentHandle';
import { TournamentRegistration } from '../model/TournamentRegistration';
import { to, sleep } from '../shared-helpers';
import { sendStandardTemplateEmail, getStandardTemplateEmail } from '../email-helpers';
import { sendEmail } from '../email/email-sender';
import { IEmailSender } from '../email/IEmailSender';
import environment from '../environment';
import { MailchimpService } from '../services/MailchimpService';
import { TournamentPaymentMeta } from '../model/TournamentPaymentMeta';
const logger: Logger = getLogger();

export class TournamentLogic {
    
    static FirstTimeGameDelayStart:number = 10;
    constructor(private dataRepository: IDataRepository, private pokerTableProvider:IPokerTableProvider, 
        private timerProviderFactory:(p:TableProcessor)=>ITimerProvider, private processor:GameServerProcessor, 
        private emailSender:IEmailSender, private mailchimpService:MailchimpService) {
    }

    subscribers:ISubscriber[] = [];
    tournaments:TournamentHandle[] = [];
    runningChecks:boolean;
    sendOfflinePlayersEmail:boolean;

    async init(){
        let tournaments = await this.dataRepository.getTournaments({ status: TournmanetStatus.Started });
        
        for(let tournament of tournaments){
            try {
                await this.restartTournament(tournament);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    async restartTournament(tournament:Tournament) : Promise<void> {
        let tournamentId = tournament._id.toString();
        let registrations = await this.dataRepository.getTournamentRegistrations({ tournamentId:tournamentId  });
        let tournamentHandle = this.getTournamentHandle(tournament, registrations);
        let tableStates = await this.dataRepository.getTableStates( { tournamentId:tournamentId });        
        let count = 0;
        for(let state of tableStates){
            let table = await helpersSetupTable(this.getTableConfig(tournament, state._id.toString()), this.dataRepository, tournamentHandle.processor, this.timerProviderFactory);            
            table.tableConfig.name = `Table ${++count}`;
            for(let playerState of state.players){                
                let stack = new Decimal(playerState.stack).add(new Decimal(playerState.cumulativeBet));
                if(stack.greaterThan(0)){
                    let user = await this.dataRepository.getUser(playerState.guid);
                    table.addPlayerHandle(new JoinTableRequest(playerState.seat, user.guid, user.screenName, user.gravatar, stack.toNumber()));
                    tournamentHandle.seated.push(user.guid)
                }                
            }
            this.setupTable(table, state, tournament);
            tournamentHandle.tables.push(table)            
        }
        let tournamentResults = await this.dataRepository.getTournamentResults(tournamentId);
        tournamentHandle.seated.push(...tournamentResults.map(r=>r.userGuid));
        this.tournaments.push(tournamentHandle);
        this.triggerStartOnTables(tournamentHandle);
    }

    running:boolean= false;

    startTimer(){
        setInterval(async ()=>{ 
            await this.run();
                   
        }, 5000); 
    }

    

    async run() {
        if (this.running) {
            logger.info(`TournamentLogic not re-run as still running`)
            return;
        }
        try {
            this.running = true;

            let tournaments = await this.dataRepository.getTournaments({ status: { $nin: [TournmanetStatus.Complete, TournmanetStatus.Abandoned, TournmanetStatus.Started] } });
            for (let tournament of tournaments) {
                try {
                    await this.checkTournament(tournament);
                } catch (e) {
                    logger.error(e);
                }
            }

        } finally {
            this.running = false;            
        }

    }

    addSubscriber(subscriber: ISubscriber): void {
        if(!this.subscribers.find(s=>s == subscriber)){
            this.subscribers.push(subscriber);
        }        
    }

    removeSubscriber(subscriber: ISubscriber): void {
        removeItem(this.subscribers, subscriber);     
    }

    async checkTournament(tournament: Tournament): Promise<void> {


        let startTime = new Date(tournament.startTime);
        let diff = (startTime.getTime() - new Date().getTime()) / 1000;
        if (diff < 0) {
            let registrations = await this.dataRepository.getTournamentRegistrations({ tournamentId: tournament._id.toString() });
            let onlinePlayers:User[] = [];
            let offlinePlayers:User[] = [];
            for(let registration of registrations){
                let user = await this.dataRepository.getUser(registration.userGuid);
                if(this.subscribers.find(s=>s.user.guid==registration.userGuid) != null){
                    onlinePlayers.push(user);
                }else{
                    offlinePlayers.push(user);
                }
            }
            if (onlinePlayers.length < tournament.minPlayers) {
                tournament.status = TournmanetStatus.Abandoned;
                await this.dataRepository.saveTournmanet(tournament);
                logger.info(`tournament ${tournament.name} ${tournament._id} abandoned`);
            } else {
                logger.info(`tournament ${tournament.name} ${tournament._id} starting`);
                
                tournament.status = TournmanetStatus.Started;
                await this.dataRepository.saveTournmanet(tournament);
                await this.startTournament(tournament, onlinePlayers, registrations);
                let buyInTotal:Decimal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                this.broadcastStatus(tournament);

                if(this.sendOfflinePlayersEmail && offlinePlayers.length){
                    let totalPrizes = getTotalPrize(tournament, buyInTotal);                    
                    let body = await getStandardTemplateEmail(`<p>This is to remind you that the tournament '${tournament.name}' you registered for has started.</p>
                    <p>Total Prizes for this tournament are ${totalPrizes} ${tournament.currency.toUpperCase()}
                    `)
                    let bccs = offlinePlayers.map(p=>p.email);
                    //to address is reqd, use the standard from address
                    to(this.emailSender.sendEmail(process.env.POKER_FROM_EMAIL, `Your Tournament has started`, body, null, null, bccs));
                }
            }
        }else if(!tournament.sentMailchimp && tournament.mailchimpSendTimeMin){
            let minutesUntilStart = Math.round(diff/60);            
            if(minutesUntilStart <= tournament.mailchimpSendTimeMin){                
                logger.info(`sending mailchimp for tournament ${tournament.name}`)                
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                tournament.sentMailchimp = true;
                await this.dataRepository.saveTournmanet(tournament);
                this.sendMailchimp(tournament, buyInTotal);
            }
        }else if(!tournament.sentTelegram && tournament.telegramSendTimeMin){
            let minutesUntilStart = Math.round(diff/60);            
            if(minutesUntilStart <= tournament.telegramSendTimeMin){
                logger.info(`sending telegram for tournament ${tournament.name}`)
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                tournament.sentTelegram = true;
                await this.dataRepository.saveTournmanet(tournament);
                this.sendTelegram(tournament, buyInTotal);
            }
        }
    }

    sendMailchimp(tournament: Tournament, buyinTotal:Decimal) {
        if(!process.env.POKER_MAILCHIMP_TEMPLATE_ID || !process.env.POKER_MAILCHIMP_LIST_ID || !process.env.POKER_MAILCHIMP_API_KEY){
            return;
        }
        let startingIn = this.getStartingIn(tournament.startTime);
        if(startingIn < 1){
            return;
        }

        let [content,subject] = this.getContent(tournament, startingIn, buyinTotal);
        content = `<p>Just a quick reminder - ` + content + `</p>`;
        
        this.mailchimpService.sendTemplateToSubscribers(subject, content, parseInt(process.env.POKER_MAILCHIMP_TEMPLATE_ID));
    }

    getStartingIn(startTime:string) : number {
        //number of minutes until tournament starts
        return Math.round((new Date(startTime).getTime() - new Date().getTime())/1000/60);
    }

    getContent(tournament: Tournament, startingIn:number, buyinTotal:Decimal){
        
        let prizes = getCalculatedPrizes(tournament, buyinTotal);
        let firstPrize = parseFloat(prizes[0]);
        let totalPrize = prizes.map(p => new Decimal(p)).reduce((a, b) => a.add(b), new Decimal(0)).toNumber();
        let currency = tournament.currency.toUpperCase();
        
        let startingText = 'minutes'
        if (startingIn >= 60) {
            startingIn = this.roundHalf(startingIn / 60);
            startingText = 'hour' + (startingIn > 1 ? 's' : '');
        }

        let content = `We have a tournament with a Total prize pool of <b>${totalPrize} ${currency}</b>` 
        +` and first prize of ${firstPrize} ${currency.toUpperCase()} <b>starting in ${startingIn} ${startingText}</b>`;
        let subject = `Poker Tournament starting in ${startingIn} ${startingText} - ${totalPrize} ${currency} up for grabs`;

        return [content, subject];
    }

    sendTelegram(tournament: Tournament, buyinTotal:Decimal){
        if(!process.env.POKER_TELEGRAM_PUBLIC_CHANNEL || !process.env.POKER_TELEGRAM_ADMIN_BOT_TOKEN){
            return;
        }
        let startingIn = this.getStartingIn(tournament.startTime);
        if(startingIn < 1){
            return;
        }

        let [content,subject] = this.getContent(tournament, startingIn, buyinTotal);
        
        new TelegramService().sendTelegram(content, process.env.POKER_TELEGRAM_PUBLIC_CHANNEL);
    }


    roundHalf(num: number): number {
        return Math.round(num * 2) / 2;
    }

    broadcastStatus(tournament:Tournament){
        let data = new DataContainer();
        data.tournamentSubscriptionResult = new TournamentSubscriptionResult();
        let row = new TournamentViewRow();
        row.id = tournament._id.toString();
        row.status = tournament.status;
        data.tournamentSubscriptionResult.tournaments.push(row);
        broadcast(this.subscribers, data)
    }


    async startTournament(tournament: Tournament, users:User[], registrations: TournamentRegistration[]) : Promise<void> {
        
        let tournamentHandle = this.getTournamentHandle(tournament, registrations);     
        let seatingArrangements = this.getSeatingArrangement(users, tournament.playersPerTable)
        tournamentHandle.seated = users.map(u=>u.guid);

        for(let sa of seatingArrangements){            
            await this.addTable(sa, tournamentHandle)
        }
        
        this.tournaments.push(tournamentHandle);

        
        
        let data = new DataContainer();
        data.tableConfigs = new TableConfigs();
        data.tableConfigs.rows = tournamentHandle.tables.map(getTableViewRow);
        broadcast(this.subscribers, data)
        
        this.triggerStartOnTables(tournamentHandle);
    }

    private async addTable(sa:SeatingArrangement, tournamentHandle:TournamentHandle) : Promise<Table> {
        let tournament = tournamentHandle.tournament;
        let table = await helpersSetupTable(this.getTableConfig(tournament, null), this.dataRepository, tournamentHandle.processor, this.timerProviderFactory);
        table.tournamentId = tournament._id+'';
        table.tableConfig.name = `Table ${tournamentHandle.tables.length+1}`;
        for(let userSeating of sa.users){                
            let user = <User>userSeating.user;
            table.addPlayerHandle(new JoinTableRequest(userSeating.seat, user.guid, user.screenName, user.gravatar, tournament.startingChips));                
        }
        
        tournamentHandle.tables.push(table);
        
        let state = table.getTableState();
        await this.dataRepository.saveTableStates([state]);
        this.setupTable(table, state, tournament);
        return table;
    }

    getTournamentHandle(tournament:Tournament, registrations: TournamentRegistration[]) : TournamentHandle{
        let tournamentHandle = new TournamentHandle();
        tournamentHandle.tournament = tournament;
        tournamentHandle.processor = new TableProcessor(this.dataRepository, this);
        tournamentHandle.registrations = registrations;
        return tournamentHandle
    }

    private triggerStartOnTables(handle:TournamentHandle){
        for(let table of handle.tables){
            table.gameStartDelaySec = TournamentLogic.FirstTimeGameDelayStart;
            table.handleGameStartingEvent();
            table.gameStartDelaySec = 2;//set back to normal after being 10 when tournament first starts
        }
                
    }
    async onPostShowdown(event:PostShowdownEvent) : Promise<void> {
        if(event.bustedPlayers.length){
            await this.onPlayersBusted(event.table.tournamentId, event.bustedPlayers)
        }
        let tournament = this.tournaments.find(t=>t.id==event.table.tournamentId);
        let otherTables = tournament.tables.filter(t=>t != event.table && t.getPlayers().length > 0)
        let result = ChangeSeatingLogic.getChangeSeatingResult(event.table, otherTables);
        
        let history = this.getChangeSeatHistory(tournament, event.table, otherTables, result);
        
        for(let change of result.leaving){
            let moveToTable = <Table>change.table;
            await this.movePlayersFrom(event.table, moveToTable, change)   
            moveToTable.checkGameStartingEvent();     
        }
        for(let change of result.joining){
            await this.movePlayersFrom(<Table>change.table, event.table, change)        
        }
        let changesTables = _.uniq(result.leaving.concat(result.joining).map(x=><Table>x.table).concat([ event.table ]));
        await this.dataRepository.saveTableStates(changesTables.map(t=>t.getTableState()));
        await this.dataRepository.saveChangeSeatHistory(history)
    }


    getChangeSeatHistory(tournament:TournamentHandle, table:Table, otherTables:Table[], result : ChangeSeatingResult) : ChangeSeatHistory{
        let dbResult = new ChangeSeatingHistoryResult();
        let convertItem = (item:ChangeSeatingItem):ChangeSeatingHistoryItem=>{
            return new ChangeSeatingHistoryItem(new UserSmall(item.handle.guid, item.handle.screenName), item.seat, { id: item.table.tableConfig._id.toString() });
        }
        dbResult.joining = result.joining.map(convertItem)
        dbResult.leaving = result.leaving.map(convertItem)

        let history = new ChangeSeatHistory(tournament.id, 
            this.getChangeSeatHistoryTable(table), 
            otherTables.map(t=>this.getChangeSeatHistoryTable(t)),
            dbResult
            )
        return history;
    }

    getChangeSeatHistoryTable(table:Table) : ChangeSeatHistoryTable{
        var historyTable = new ChangeSeatHistoryTable();
        historyTable.id = table.tableConfig._id.toString();
        historyTable.players = table.getPlayers().map(p=>new ChangeSeatHistoryPlayer(p.guid, p.screenName, p.isDisconnected, p.isSittingOut))
        return historyTable;    
    }

    async movePlayersFrom(fromTable:Table, toTable:Table, change:ChangeSeatingItem) : Promise<void> {
        await fromTable.leaveTableInternal(change.handle);
        let subscriber = fromTable.getSubscriber(change.handle.guid);
        if(subscriber!=null){
            fromTable.removeSubscriber(subscriber)      
            toTable.addSubscriber(subscriber);      
        }
        
        let handle = toTable.addPlayerHandle(new JoinTableRequest(change.seat, change.handle.guid, change.handle.screenName,change.handle.gravatar,change.handle.stack));
        handle.sitOutNextHand = change.handle.sitOutNextHand;
        handle.isSittingOut = change.handle.isSittingOut;
        handle.isAutoSitout = change.handle.isAutoSitout;
        handle.sittingOutSince = change.handle.sittingOutSince;
        handle.isDisconnected = change.handle.isDisconnected;;
        handle.disconnectedSince = change.handle.disconnectedSince;
        toTable.broadcastJoinTable(handle);
        broadcast(this.subscribers, toTable.getTableConfigUpdate())        
    }

    getTableProcessor(tournamentId:string) : TableProcessor{
        return this.tournaments.find(t=>t.id == tournamentId).processor;
    }

    async rebuy(tournamentId:string, userSmall:UserSmall) : Promise<void>{
        let tournamentHandle = this.tournaments.find(t=>t.id == tournamentId);
        let registrations = await this.dataRepository.getTournamentRegistrations( { userGuid: userSmall.guid, tournamentId:tournamentId });
        let registration = registrations[0];
        if(!registration){
            return;
        }
        let remainingPlayerCount = this.getRemainingPlayerCount(tournamentHandle);
        let rebuyAllowed = this.rebuyAllowed(tournamentHandle.tournament, remainingPlayerCount);
        if(!rebuyAllowed){
            return;
        }
        
        let tournament = tournamentHandle.tournament;
        
        let rebuyCount = registration.rebuyCount || 0;
        let rebuyAmount = new Decimal(tournament.rebuyAmount).mul(Math.pow(2, rebuyCount)).toString();
        let debitError = await debitAccount(userSmall, tournament.currency, rebuyAmount, this.dataRepository, null, new TournamentPaymentMeta(tournamentId, true, tournament.name));
        if(debitError){
            let message = `rebuy failed for ${JSON.stringify(userSmall)}: ${debitError}`;
            logger.info(message);
            return;
        }
        registration.rebuyCount = rebuyCount + 1;
        await this.dataRepository.saveTournamentRegistration(registration);
        await this.dataRepository.deleteTournamentResult(tournamentId, userSmall.guid);

        let subscriber = this.subscribers.find(s=>s.user.guid == userSmall.guid)
        if(subscriber != null){
            let data:DataContainer = new DataContainer();
            let user = await this.dataRepository.getUser(userSmall.guid);
            data.user = await getUserData(user, this.dataRepository, false);
            
            subscriber.send(data);
        }
        
        this.lateRegistration(tournamentId, userSmall.guid);

        let broadcastMessage:DataContainer= new DataContainer();
        broadcastMessage.tournamentSubscriptionResult = new TournamentSubscriptionResult();          
        let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournamentId);
        let rowView = <TournamentViewRow>{ 
            id : tournamentId, 
            totalPrize : getTotalPrize(tournament, buyInTotal).toString() 
        };
        broadcastMessage.tournamentSubscriptionResult.tournaments.push(rowView);
        broadcast(this.subscribers, broadcastMessage)
    }


    async lateRegistration(tournamentId:string, guid:string) : Promise<string> {

        let tHandle = this.tournaments.find(t=>t.id == tournamentId);
        if(tHandle.tables.find(t=>t.findPlayer(guid) != null)){
            return;
        }

        let table:Table = null;
        let seat:number;
        for(let t of tHandle.tables){
            let emptySeats = t.getEmptySeats();
            if(emptySeats.length){
                table = t;
                seat = emptySeats[0];
                break;
            }
        }
        let user = await this.dataRepository.getUser(guid);
        let handle:PlayerTableHandle;
        if(table == null){
            let sa:SeatingArrangement = new SeatingArrangement();
            sa.users.push({user:user, seat: 2})
            table = await this.addTable(sa, tHandle)
        }
        else{
            handle = table.addPlayerHandle(new JoinTableRequest(seat, user.guid, user.screenName, user.gravatar, tHandle.tournament.startingChips));            
        }
        tHandle.seated.push(user.guid)

        let subscriber = this.subscribers.find(s=>s.user.guid==guid);
        if(subscriber!=null){
            table.addSubscriber(subscriber);
        }   
        if(handle){
            table.broadcastJoinTable(handle);
        }       
        table.checkGameStartingEvent();
        
        let data = new DataContainer();
        data.tableConfigs = new TableConfigs();
        data.tableConfigs.rows = [ getTableViewRow(table) ];        
        broadcast(this.subscribers, data)
        return table.tableId;
        
    }

    async onPlayersBusted(tournamentId:string, playerHandles:PlayerTableHandle[]){
        let tournamentHandle:TournamentHandle = this.tournaments.find(t=>t.id == tournamentId)
        //get count of remaining players
        let remainingPlayerCount = this.getRemainingPlayerCount(tournamentHandle);
        let placing = remainingPlayerCount + 1; 
        let timestamp = new Date();
        let results = playerHandles.map(h=>new TournamentResult(tournamentHandle.id, h.guid, h.screenName, placing, timestamp))
        
        if(placing == 2){
            let table = tournamentHandle.tables.filter(t=>t.getPlayerCount()>0)[0];
            let winner = table.getPlayers()[0];
            table.leaveTableInternal(winner);
            results.push(new TournamentResult(tournamentHandle.id, winner.guid, winner.screenName, 1, timestamp))                        
            tournamentHandle.tournament.status = TournmanetStatus.Complete;
            await this.dataRepository.saveTournmanet(tournamentHandle.tournament)
            this.broadcastStatus(tournamentHandle.tournament);
            let that = this;
            if(tournamentHandle.tournament.awardPrizesAfterMinutes > 0){                
                this.timerProviderFactory(tournamentHandle.processor).startTimer(async function awardPrizes(){
                    await that.sendAwardPrizes(tournamentHandle.tournament)

                }, tournamentHandle.tournament.awardPrizesAfterMinutes * 1000 * 60, null);
            }

            this.timerProviderFactory(tournamentHandle.processor).startTimer(async function removeTables(){
                that.pokerTableProvider.removeTables({ tournamentId: tournamentHandle.id});

            }, 2 * 1000 * 60, null);//remove tables after 2 minutes
            
        }
        
        await this.dataRepository.saveTournamentResult(results);
        
        await this.sendTournamentResults(results, tournamentHandle.tournament, remainingPlayerCount);
        
    }

    getRemainingPlayerCount(tournamentHandle:TournamentHandle){
        let remainingPlayerCount = tournamentHandle.tables.map(t=>t.getPlayerCount()).reduce((a,b)=>a+b, 0); 
        return remainingPlayerCount;
    }

    private rebuyAllowed(tournament:Tournament, remainingPlayerCount:number) : boolean{
        let rebuyAllowed = tournament.rebuyAmount && remainingPlayerCount > 1 && isWithinPeriod(tournament.startTime, tournament.rebuyForMin);
        return rebuyAllowed;
    }

    public async sendTournamentResults(results:TournamentResult[], tournament:Tournament, remainingPlayerCount:number) : Promise<void> {
        let rebuyAllowed = this.rebuyAllowed(tournament, remainingPlayerCount);
        for(let tournamentResult of results){
            let subscriber = this.subscribers.find(s=>s.user.guid==tournamentResult.userGuid);
            if(subscriber){
                let data = new DataContainer();
                let rebuyAmount :string = null;
                if(rebuyAllowed){
                    rebuyAmount = await this.getRebuyAmount(subscriber.user.guid, tournament._id.toString(), tournament.rebuyAmount);
                }               
                
                let account = await this.dataRepository.getUserAccount(subscriber.user.guid, tournament.currency);
                let accountBalance = new Decimal(account.balance || 0).dividedBy(CurrencyUnit.getCurrencyUnit(tournament.currency));
                let canRebuy = accountBalance.greaterThanOrEqualTo(new Decimal(rebuyAmount));
                data.tournamentResult = new TournamentResultView(tournament._id.toString(), tournament.name, tournamentResult.placing, rebuyAmount, tournament.currency, canRebuy);                
                subscriber.send(data)
            }
        }
    }

    private async getRebuyAmount(guid:string, tournamentId:string, rebuyAmount:string) : Promise<string> {
        let registrations = await this.dataRepository.getTournamentRegistrations( { userGuid: guid, tournamentId:tournamentId });
        let registration = registrations[0];
        let rebuyCount = registration.rebuyCount || 0;
        return new Decimal(rebuyAmount).mul(Math.pow(2, rebuyCount)).toString();
    }

    private async sendAwardPrizes(tournament:Tournament){
        let pMessage = new GameServerProcessorMessage();
        let adminTournamentResultsView = await getAdminTournamentResultsView(tournament, this.dataRepository);
        pMessage.awardPrizesRequest = new AwardPrizesRequest(tournament._id+'', adminTournamentResultsView)
        let pResult = await this.processor.sendMessage(pMessage);        
    }

    private getTableConfig(tournament:Tournament, configId:string):TableConfig{
        let config = new TableConfig();
        config._id = configId;
        config.currency = Currency.tournament;
        config.exchangeRate = 1;
        let blindConfig = getBlindConfig(new Date(tournament.startTime), tournament.blindConfig).blinds;
        config.smallBlind = blindConfig.smallBlind;
        config.bigBlind = blindConfig.bigBlind;
        config.timeToActSec = tournament.timeToActSec;        
        config.maxPlayers = tournament.playersPerTable;        
        return config;
    }

    private setupTable(table:Table, state:TableState, tournament:Tournament) : void{                
        table.tournamentId = tournament._id+'';
        table.tableConfig._id = state._id;
        table.blindConfig = tournament.blindConfig;
        table.blindsStartTime = new Date(tournament.startTime);
        table.idleTimeSec = (tournament.evictAfterIdleMin || 10) * 60;
        
        this.pokerTableProvider.addTable(table);
        for(let handle of table.getPlayers()){
            handle.isDisconnected = true;
            handle.disconnectedSince = new Date();
            handle.isAutoSitout = true;
            handle.isSittingOut = true;
            handle.sittingOutSince = new Date();
        }
        if(state.dealerSeat != null){
            table.dealerSeat = state.dealerSeat;
        }
                    
        table.onPostShowdown = this.onPostShowdown.bind(this);
    }

    async getTournamentTable(tournamentId:string, tableId:string, subscriber:ISubscriber) : Promise<Table> {
        // console.log(`subscribeToTournament ${subscriber.user.guid}`);
        let handle = this.tournaments.find(t=>t.tournament._id+'' == tournamentId);
        if(handle){
            if(this.subscribers.find(s=>s==subscriber)){
                let found = false;
                for(let table of handle.tables){
                    if(table.getPlayers().find(p=>p.guid==subscriber.user.guid)){                        
                        found=true;
                        return table;
                    }
                }

                if(!found && handle.registrations.find(r=>r.userGuid==subscriber.user.guid) != null 
                && handle.seated.find(s=>s==subscriber.user.guid)==null
                && isWithinLateRegistration(handle.tournament)
                ){                    
                    let tMessage = new TableProcessorMessage(null);
                    tMessage.lateRegistration = { tournamentId:tournamentId, user: new UserSmall(subscriber.user.guid, subscriber.user.screenName) };
                    let tableProcessorResult = await handle.processor.sendMessage(tMessage);
                    let table = this.pokerTableProvider.findTable(tableProcessorResult.lateRegistrationTableId);
                    return table;
                }

                if(!found && tableId){
                    let table = handle.tables.find(t=>t.tableConfig._id.toString() == tableId);
                    if(table!=null){                        
                        return table;
                    }
                }
            }            
            
        }else{
            logger.info(`no such tournamentId ${tournamentId} userGuid: ${subscriber.user.guid}`)
        }
        return null;
    }

   

    getSeatingArrangement(arr: { guid: string }[], playersPerTable:number): SeatingArrangement[] {
        
        let users = arr.slice();
        let tables:SeatingArrangement[] = [];
        let table:SeatingArrangement;
        let length = users.length;
        for (let i = 0; i<length; i++) {
            if(i % playersPerTable == 0){
                table = new SeatingArrangement();
                tables.push(table)
            }
            let randomResult = getRandomItemAndIndex(users);
            let seat = (i % playersPerTable) + 1;
            table.users.push({ user: randomResult.item, seat: seat })
            users.splice(randomResult.index, 1);
        }
        let min = 4;       
        let lastTable = tables[tables.length-1];        
        if(tables.length > 1 && lastTable.users.length < min){
            let numPlayersToTake = min - lastTable.users.length;
            let seat = lastTable.users[lastTable.users.length-1].seat;
            for (let i = 0; i < numPlayersToTake; i++) {
                
                let tableIndex = i % (tables.length-1);
                if(tables[tableIndex].users.length == lastTable.users.length){
                    break;
                }
                seat++;
                let user = tables[tableIndex].users.splice(0, 1)[0];
                user.seat = seat;
                lastTable.users.push(user);
            }
        }
        return tables;
    }

    getRemainingPlayers(tournamentId: string): { screenName: string, stack: number }[] {
        let arr: { screenName: string, stack: number }[] = [];
        let handle = this.tournaments.find(h => h.id == tournamentId);
        for (let table of handle.tables) {
            for (let player of table.getPlayers()) {
                arr.push({ screenName: player.screenName, stack: player.stack });
            }
        }

        arr.sort((a,b)=>b.stack - a.stack);

        return arr;
    }

    
}

class SeatingArrangement{
    users: UserSeating[] = [];
}
class UserSeating{
    user:{ guid: string };
    seat:number;
}
