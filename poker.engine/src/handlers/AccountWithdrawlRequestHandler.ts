 import { WebSocketHandle } from "../model/WebSocketHandle";
import { AccountWithdrawlRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { DataContainer, AccountWithdrawlResult, Account } from "../../../poker.ui/src/shared/DataContainer";
import { IPokerTableProvider } from "../services/IBroadcastService";
import { IDataRepository } from "../services/documents/IDataRepository";
import { Decimal } from "../../../poker.ui/src/shared/decimal";
import { Table } from "../table";
import { CurrencyUnit } from "../../../poker.ui/src/shared/Currency";
import { IConnectionToPaymentServer } from "../admin/AdminSecureSocketService";
import { CheckPaymentsTrigger } from "../admin/model/outgoing/CheckPaymentsTrigger";
import { Payment } from "../model/Payment";
import { PaymentType } from "../../../poker.ui/src/shared/PaymentType";
import { UserSmall } from "../model/UserSmall";
import { PaymentStatus } from "../../../poker.ui/src/shared/PaymentStatus";
import { PlayerTableHandle } from "../model/table/PlayerTableHandle";

export class AccountWithdrawlRequestHandler extends AbstractMessageHandler<AccountWithdrawlRequest>{

    constructor(private pokerTableProvider: IPokerTableProvider, private dataRepository: IDataRepository, private connectionToPaymentServer:IConnectionToPaymentServer) {
        super();

    }
    
    async handleMessage(wsHandle: WebSocketHandle, request: AccountWithdrawlRequest): Promise<any>{
        let result = await this.handleMessageInternal(wsHandle, request)
        this.sendAccountWithdrawlResult(result, wsHandle);
        if(result.success){
            await this.savePayment(request.currency, request.receivingAddress, request.amount+'', wsHandle.user);
            this.connectionToPaymentServer.send(new CheckPaymentsTrigger())
        }
    }
    async handleMessageInternal(wsHandle: WebSocketHandle, accountWithdrawlRequest: AccountWithdrawlRequest): Promise<any> {

        let withdrawlAmount = new Decimal(accountWithdrawlRequest.amount);
        
        
        if (!withdrawlAmount.greaterThan(0)) {
            return Promise.resolve(this.getAccountWithdrawlResult('Invalid withdrawl amount'));
        }
        let config = await this.dataRepository.getCurrencyConfig(accountWithdrawlRequest.currency);
        if (isNaN(parseFloat(config.minimumWithdrawl))) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Minimum withdrawl not defined for currency ${accountWithdrawlRequest.currency}`));
        }
        let minimumWithdrawl = new Decimal(config.minimumWithdrawl).mul(CurrencyUnit.default);
        
        if (withdrawlAmount.lessThan(minimumWithdrawl)) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Amount is less than the minimum withdrawl of ${config.minimumWithdrawl}`));
        }

        if(!accountWithdrawlRequest.receivingAddress || !accountWithdrawlRequest.receivingAddress.trim().length){
            return Promise.resolve(this.getAccountWithdrawlResult(`Invalid receiving address`));
        }
        
        let addresses = await this.dataRepository.getAddressInfoByAddress(accountWithdrawlRequest.receivingAddress);
        if(addresses.length){
            return Promise.resolve(this.getAccountWithdrawlResult(`Cannot withdraw to deposit address`));
        }


        let currentTable: Table;
        let currentPlayer: PlayerTableHandle;
        for (let table of this.pokerTableProvider.getTables().filter(t => accountWithdrawlRequest.currency.toLowerCase() == t.tableConfig.currency)) {
            let player = table.findPlayer(wsHandle.user.guid);
            if (player) {
                if (table.currentPlayers && table.currentPlayers.indexOf(player) > -1) {
                    let errorMessage = `You are still playing at table '${table.tableConfig.name}'. Select 'Sit out next hand' then complete the hand.`;
                    return Promise.resolve(this.getAccountWithdrawlResult(errorMessage));
                } else {
                    currentTable = table;
                    currentPlayer = player;
                    break;
                }

            }
        }

        if(currentTable != null){
            await currentTable.sendLeaveTable(wsHandle.user.toSmall())                           
        }
        
        let account = await this.dataRepository.getUserAccount(wsHandle.user.guid, accountWithdrawlRequest.currency)
        
        if (!account) {
            return Promise.resolve(this.getAccountWithdrawlResult(`Account does not exist for currency ${accountWithdrawlRequest.currency}`));
        } else if (new Decimal(account.balance).lessThan(withdrawlAmount)) {
            let currencyUnit = CurrencyUnit.getCurrencyUnit(accountWithdrawlRequest.currency);
            return Promise.resolve(this.getAccountWithdrawlResult(`Insufficient balance: Trying to withdraw ${withdrawlAmount.dividedBy(currencyUnit)} however account balance is ${account.balance/currencyUnit}`));
        }
        
        let updateResult:any = await this.dataRepository.updateUserAccount(wsHandle.user.guid, accountWithdrawlRequest.currency, -withdrawlAmount.toNumber(), account.updateIndex)
        if (updateResult.result.nModified !== 1) {
            throw new Error(`updateUserAccount: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${wsHandle.user.guid} accountWithdrawlRequest: ${JSON.stringify(accountWithdrawlRequest)}`);
          } 
        let result = new AccountWithdrawlResult();
        result.balance = new Decimal(account.balance).minus(withdrawlAmount).toString();
        result.sentAmount = withdrawlAmount.toString()
        result.success = true;
        result.currency = account.currency;

        
        return Promise.resolve(result);
    }

    async savePayment(currency: string, address: string, amount: string, user:UserSmall) {
        let payment = new Payment();
        payment.currency = currency.toLowerCase();
        payment.address = address;
        payment.amount = amount;
        payment.guid = user.guid;
        payment.timestamp = new Date();
        payment.type = PaymentType.outgoing;
        payment.status = PaymentStatus.pending;
        payment.screenName = user.screenName;
        await this.dataRepository.savePayment(payment)
    }

    getAccountWithdrawlResult(errorMessage: string) {
        let result = new AccountWithdrawlResult();
        result.errorMessage = errorMessage;
        return result;
    }

    sendAccountWithdrawlResult(result: AccountWithdrawlResult, wsHandle:WebSocketHandle) {
        let data = new DataContainer();
        data.accountWithdrawlResult = result;
        wsHandle.send(data);
    }

    
}