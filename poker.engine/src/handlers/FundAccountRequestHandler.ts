import { IDataRepository } from './../services/documents/IDataRepository';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer, GlobalChatResult, ChatMessage, PaymentHistoryResult, PaymentHistoryRowView, AccountFunded, Account } from '../../../poker.ui/src/shared/DataContainer';
import { IBroadcastService, IPokerTableProvider } from '../services/IBroadcastService';
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { GlobalChatRequest, PaymentHistoryRequest, FundAccountRequest } from '../../../poker.ui/src/shared/ClientMessage';
import { GetDepositAddressRequest } from '../admin/model/outgoing/GetDepositAddressRequest';
import { IConnectionToPaymentServer } from '../admin/AdminSecureSocketService';
import { Currency } from '../../../poker.ui/src/shared/Currency';
import { User } from '../model/User';
import { Payment } from '../model/Payment';
import { AddressInfo } from '../model/AddressInfo';
import { getFundAccountResult } from '../helpers';
import { PaymentStatus } from '../../../poker.ui/src/shared/PaymentStatus';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { IDepositAddressService } from '../services/IDepositAddressService';
import { DepositAddressTrigger } from '../admin/model/outgoing/DepositAddressTrigger';
import { SharedHelpers } from '../shared-helpers';
var _ = require('lodash');

export class FundAccountRequestHandler extends AbstractMessageHandler<FundAccountRequest> {

    constructor(private pokerTableProvider: IPokerTableProvider, private dataRepository: IDataRepository, private connectionToPaymentServer: IConnectionToPaymentServer, private depositAddressService:IDepositAddressService) {
        super();
    }


    async handleMessage(wsHandle: WebSocketHandle, request: FundAccountRequest): Promise<void> {
        let currency = request.currency;
        if (currency == Currency.free) {
            return this.sendPlayMoney(wsHandle);
        } else {

            let user = await this.dataRepository.getUser(wsHandle.user.guid);
            
            if (!user) {
                user = wsHandle.user;                                
            }

            if(user.depositIndex === undefined){
                user.depositIndex = await this.dataRepository.getNextUserIndex();
                await this.dataRepository.saveUser(user);
            }
            

            let addressInfo = await this.getAddressInfo(request.currency, user)
            let currencyConfig = await this.dataRepository.getCurrencyConfig(currency)
            let data =  await getFundAccountResult(currency, currencyConfig.requiredNumberOfConfirmations, addressInfo.address)
            
            let payments = await this.dataRepository.getPayments({ guid: wsHandle.user.guid, currency: currency});
            let pendingPayment = payments.find(p=>p.status==PaymentStatus.pending && p.type==PaymentType.incoming);
            if(pendingPayment){
                data.accountFunded = this.getAccountFunded(pendingPayment);
            }
            
            wsHandle.send(data)
        }
    }

    async getAddressInfo(currency:string, user:User) : Promise<AddressInfo> {
        let currencyConfig = await this.dataRepository.getCurrencyConfig(currency)
        if(SharedHelpers.Erc20RegExp.exec(currencyConfig.contractAddress)){
            currency = Currency.eth;
            currencyConfig = await this.dataRepository.getCurrencyConfig(Currency.eth)
        }

        let addresses: AddressInfo[] =  await this.dataRepository.getAddressInfo(user.guid, currency, false);
        if(!addresses.length){
            
            let address = await this.depositAddressService.getAddress(currency, currencyConfig.xpub, user.depositIndex);
            let addressInfo = new AddressInfo();
            addressInfo.address = address;
            addressInfo.currency = currency;
            addressInfo.screenName = user.screenName;
            addressInfo.userGuid = user.guid;
            await this.dataRepository.saveAddress(addressInfo);
            addresses.push(addressInfo);

            let request = new DepositAddressTrigger();
            request.user = user.toSmall();
            request.currency = currency;
            request.address = address;
            request.depositIndex = user.depositIndex;
            
            this.connectionToPaymentServer.send(request)
        }
        return addresses[0];
    }

    getAccountFunded(payment:Payment):AccountFunded {
        //let data = new DataContainer();

        let accountFunded = new AccountFunded();
        accountFunded.paymentReceived = parseFloat(payment.amount);
        accountFunded.currency = payment.currency;
        accountFunded.confirmations = payment.confirmations;

        //data.accountFunded = accountFunded;
        return accountFunded;
    }

    async sendPlayMoney(socketHandle: WebSocketHandle): Promise<void> {
        let guid = socketHandle.user.guid;
        let accountFunded = new AccountFunded();
        accountFunded.currency = Currency.free;
        
        accountFunded.paymentReceived = Currency.freeStartingAmount;        
        let account = await this.dataRepository.getUserAccount(guid, Currency.free)
        let balance = account == null ? 0 : account.balance;
        if (balance <= 2) {
            await this.dataRepository.updateUserAccount(guid, Currency.free, Currency.freeStartingAmount-balance)            
        } 
        account = await this.dataRepository.getUserAccount(guid, Currency.free)
        accountFunded.balance = account.balance;

        let data = new DataContainer();
        data.accountFunded = accountFunded;
        setTimeout(() => {
            socketHandle.send(data);
        },
            1000);        
    }


}