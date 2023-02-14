import { JoinTableRequestHandler } from './handlers/JoinTableRequestHandler';
import { ListTablesRequestHandler } from './handlers/ListTablesRequestHandler';
import { IDataRepository } from './services/documents/IDataRepository';
import { PokerProcessor } from "./poker-processor";
import { GlobalChatRequestHandler } from "./handlers/GlobalChatRequestHandler";
import { LoginRequestHandler } from './handlers/LoginRequestHandler';
import { RegisterRequestHandler } from './handlers/RegisterRequestHandler';
import { SetAccountSettingsRequestHandler } from './handlers/SetAccountSettingsRequestHandler';
import { TournamentSubscriptionRequestHandler } from './handlers/TournamentSubscriptionRequestHandler';
import { TournamentRegisterRequestHandler } from './handlers/TournamentRegisterRequestHandler';
import { ForgotRequestHandler } from './handlers/ForgotRequestHandler';
import { TournamentLogic } from './handlers/TournamentLogic';
import { SubscribeToTableRequestHandler } from './handlers/SubscribeToTableRequestHandler';
import { AccountWithdrawlRequestHandler } from './handlers/AccountWithdrawlRequestHandler';
import { IConnectionToPaymentServer } from './admin/AdminSecureSocketService';
import { PaymentHistoryRequestHandler } from './handlers/PaymentHistoryRequestHandler';
import { FundAccountRequestHandler } from './handlers/FundAccountRequestHandler';
import { TransferFundsRequestHandler } from './handlers/TransferFundsRequestHandler';
import { IBroadcastService } from './services/IBroadcastService';
import { TournamentInfoRequestHandler } from './handlers/TournamentInfoRequestHandler';
import { RebuyRequestHandler } from './handlers/RebuyRequestHandler';
import { DepositAddressService } from './services/DepositAddressService';

export class RequestHandlerInit{
    init(dataRepository:IDataRepository, processor:PokerProcessor, tournamentLogic:TournamentLogic,connectionToPaymentServer:IConnectionToPaymentServer, depositAddressService:DepositAddressService){
        processor.addHandler(new GlobalChatRequestHandler(dataRepository, processor));
        processor.addHandler(new LoginRequestHandler(dataRepository, processor));        
        processor.addHandler(new RegisterRequestHandler(dataRepository));        
        processor.addHandler(new SetAccountSettingsRequestHandler(dataRepository, processor));
        processor.addHandler(new TournamentSubscriptionRequestHandler(dataRepository, tournamentLogic));
        processor.addHandler(new TournamentRegisterRequestHandler(dataRepository, processor, tournamentLogic));
        processor.addHandler(new ForgotRequestHandler(dataRepository));
        processor.addHandler(new ListTablesRequestHandler(processor));
        processor.addHandler(new SubscribeToTableRequestHandler(processor, tournamentLogic));
        processor.addHandler(new JoinTableRequestHandler(processor, dataRepository));
        processor.addHandler(new AccountWithdrawlRequestHandler(processor, dataRepository,connectionToPaymentServer));
        processor.addHandler(new PaymentHistoryRequestHandler(dataRepository));
        processor.addHandler(new FundAccountRequestHandler(processor, dataRepository,connectionToPaymentServer, depositAddressService));
        processor.addHandler(new TransferFundsRequestHandler(dataRepository,processor));
        processor.addHandler(new TournamentInfoRequestHandler(dataRepository, tournamentLogic));
        processor.addHandler(new RebuyRequestHandler(dataRepository, tournamentLogic));
    }
}