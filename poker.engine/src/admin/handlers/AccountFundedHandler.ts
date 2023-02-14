import { DataContainer, FundAccountResult, AccountFunded, Account  } from "../../../../poker.ui/src/shared/DataContainer";
import { Currency } from "../../../../poker.ui/src/shared/Currency";
import { IBroadcastService } from "../../services/IBroadcastService";
import { AccountFundedResult } from "../../model/AccountFundedResult";
import { IDataRepository } from "../../services/documents/IDataRepository";
import { User } from "../../model/User";
import { Payment } from "../../model/Payment";
import { Decimal } from "../../../../poker.ui/src/shared/decimal";
import { PaymentStatus } from "../../../../poker.ui/src/shared/PaymentStatus";
import { transferTableBalance } from "../../helpers";
import { GameServerProcessorMessage } from "../processor/GameServerProcessorMessage";
import { GameServerProcessorResult } from "../processor/GameServerProcessorResult";
import { Logger, getLogger } from "log4js";
var logger:Logger = getLogger();

export class AccountFundedHandler {

    typeName: string = 'accountFunded'

    constructor(private broadcastService: IBroadcastService, private dataRepository: IDataRepository) {

    }

    async run(message: GameServerProcessorMessage): Promise<GameServerProcessorResult>{
        let result = new GameServerProcessorResult();
        await this.handlePayment(message.accountFunded.payment);
        return result;
    }    

    async handlePayment(payment:Payment) {
        
        let account:Account = await this.savePayment(payment);        

        this.broadcastService.send(payment.guid, async () => {
            let data = new DataContainer();
            
            let accountFunded = new AccountFunded();
            if(account!=null){
                accountFunded.balance = account.balance;
            }
            
            accountFunded.paymentReceived = parseFloat(payment.amount);
            accountFunded.currency = payment.currency;
            accountFunded.confirmations = payment.confirmations;

            data.accountFunded = accountFunded;
            return data;
        })
    }

    async savePayment(payment: Payment) : Promise<Account>{
        let dbPayment:Payment;
        if(payment.txId){
            dbPayment = await this.dataRepository.getPaymentByTxId(payment.currency, payment.txId)
        }else if(payment.tournamentId){
            dbPayment = await this.dataRepository.getPaymentIncomingByTournamentId(payment.tournamentId, payment.guid)
        }
        if(dbPayment == null){
            let dbPayment = await this.dataRepository.getPaymentById(payment._id);
            if(dbPayment){
                logger.error(`payment ${payment._id} was found by id but not matched by either TxId or TournamentId`);
                return;
            }
        }
        
        let shouldUpdateBalance = payment.status == PaymentStatus.complete && (dbPayment == null || dbPayment.status === PaymentStatus.pending)
        if(dbPayment == null){
            dbPayment = payment;
        }else{
            dbPayment.confirmations = payment.confirmations;
            dbPayment.status = payment.status;
        }
        await this.dataRepository.savePayment(dbPayment);
        
        if(shouldUpdateBalance){
            return this.updatePlayerBalance(payment.guid, payment.currency, payment.amount, payment._id.toString())
        }
        
        
        return null;
    }

    async updatePlayerBalance(guid:string, currency:string, amount:string, paymentId:string) : Promise<Account> {
        let user:User = await this.dataRepository.getUser(guid);
        if (!user) {
            user = new User();
            user.guid = guid;
            user.setScreenName();
            await this.dataRepository.saveUser(user);
        }
        

        await transferTableBalance(guid, new Decimal(amount).toNumber(), currency, this.dataRepository, `incoming payment id:${paymentId} for user ${user.screenName} ${user.guid}`);
                
        let account = await this.dataRepository.getUserAccount(guid, currency);        
            
        return account;
    }
}