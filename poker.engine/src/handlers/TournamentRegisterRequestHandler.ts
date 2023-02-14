import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { TournamentSubscriptionRequest, TournamentRegisterRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { IDataRepository } from './../services/documents/IDataRepository';
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer, TournamentSubscriptionResult, PokerError } from '../../../poker.ui/src/shared/DataContainer';
import { IBroadcastService } from '../services/IBroadcastService';
import { TournamentViewRow } from "../../../poker.ui/src/shared/tournmanet-view-row";
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { TournamentRegistration } from "../model/TournamentRegistration";
import { User } from "../model/User";
import { Tournament } from "../model/tournament";
import { TournmanetStatus } from "../../../poker.ui/src/shared/TournmanetStatus";
import { TournamentLogic } from "./TournamentLogic";
import { TableProcessorMessage, TableMessage, TableProcessorResult } from "../admin/processor/table-processor/TableProcessor";
import { UserSmall } from "../model/UserSmall";
import { isWithinLateRegistration, getUserData, getTotalPrize, debitAccount } from "../helpers";
import { CurrencyUnit } from "../../../poker.ui/src/shared/Currency";
import { TournamentPaymentMeta } from "../model/TournamentPaymentMeta";

export class TournamentRegisterRequestHandler extends AbstractMessageHandler<TournamentRegisterRequest> {
    constructor(private dataRepository: IDataRepository, private broadcastService: IBroadcastService, private tournamentLogic:TournamentLogic) {
        super();
    }
    async handleMessage(wsHandle: WebSocketHandle, request: TournamentRegisterRequest): Promise<any> {
        
        let data:DataContainer = new DataContainer();
        let broadcastMessage:DataContainer;

       let result:ValidationResult = await this.validate(request, wsHandle.user.guid);
       if(result.error){
           data.error = new PokerError(result.error);
       }else{
        
        let { user, tournament } = result;
        let debitError :string = '';
            if(tournament.buyIn){                
                debitError = await debitAccount(user.toSmall(), tournament.currency, tournament.buyIn, this.dataRepository, null, new TournamentPaymentMeta(tournament._id.toString(), false, tournament.name));                           
                data.user = await getUserData(user, this.dataRepository, false);
            }

            if(!debitError){
                let registration = new TournamentRegistration(request.tournamentId, wsHandle.user.guid, wsHandle.user.screenName);

                await this.dataRepository.saveTournamentRegistration(registration);
                data.tournamentSubscriptionResult = new TournamentSubscriptionResult();                
                data.tournamentSubscriptionResult.tournaments.push(<TournamentViewRow>{ id : request.tournamentId, joined : true});

                if(tournament.status == TournmanetStatus.Started){
                    await this.sendLateRegistration(tournament, user.toSmall());
                }

                let playerCount = await this.dataRepository.getTournamentPlayerCount(registration.tournamentId)
                let buyInTotal = await this.dataRepository.getTournamentBuyIns(tournament._id.toString());
                broadcastMessage = new DataContainer();
                broadcastMessage.tournamentSubscriptionResult = new TournamentSubscriptionResult();                
                let rowView = <TournamentViewRow>{ id : request.tournamentId, playerCount : playerCount};
                if(tournament.buyIn){
                    rowView.totalPrize = getTotalPrize(tournament, buyInTotal).toString();
                }
                broadcastMessage.tournamentSubscriptionResult.tournaments.push(rowView);
            }
            else{
                data.error = new PokerError(debitError);
            }
       }
        
        
        wsHandle.send(data);
        if(broadcastMessage){
            this.broadcastService.broadcast(broadcastMessage);
        }
    }

    async validate(request: TournamentRegisterRequest, userGuid:string) : Promise<ValidationResult>   {
        let result:ValidationResult = {};
        result.tournament = await this.dataRepository.getTournmanetById(request.tournamentId);
        if(result.tournament == null){
            result.error = `Tournament not found: ${request.tournamentId}`;
            return result;
        }
        if(!this.canRegister(result.tournament)){
            result.error = `You can no longer register for this tournament`;
            return result;
        }
        result.user = await this.dataRepository.getUser(userGuid);
        if(!result.user){
            result.error = 'You must register to play tournaments';
            return result;
        }
        if(!result.user.activated){
            result.error = 'Account not activated! Please check your email to confirm registration';
            return result;
        }
        let existingRegistration = await this.dataRepository.getTournamentRegistrations( { userGuid: userGuid, tournamentId:request.tournamentId });
        if(existingRegistration.length){
            result.error = 'You are already registered for this tournament';
            return result;
        }
       
        return result;
    }

 

    sendLateRegistration(tournament:Tournament, user:UserSmall) : Promise<TableProcessorResult> {
        let tournamentId = tournament._id.toString();
        let processor = this.tournamentLogic.getTableProcessor(tournamentId);
        let tMessage = new TableProcessorMessage(null);
        tMessage.lateRegistration = { tournamentId:tournamentId, user: user };
        return processor.sendMessage(tMessage);
    }

    canRegister(tournament:Tournament) : boolean{
        if(!tournament.status){
            return true;//not started
          }else if (isWithinLateRegistration(tournament)){
            return true;     
        }
        return false;
    }


    
}

interface ValidationResult{
    error?:string;
    user?:User;
    tournament?:Tournament;
}