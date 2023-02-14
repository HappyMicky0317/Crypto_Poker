import { IDataRepository } from './../services/documents/IDataRepository';
import { WebSocketHandle } from "../model/WebSocketHandle";
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { IConnectionToPaymentServer } from '../admin/AdminSecureSocketService';
import { TransferFundsRequest } from '../../../poker.ui/src/shared/ClientMessage';
import { IPokerTableProvider, IBroadcastService } from '../services/IBroadcastService';
import { DataContainer, TransferFundsResult, Account } from '../../../poker.ui/src/shared/DataContainer';
import { User } from '../model/User';
import { Currency, CurrencyUnit } from '../../../poker.ui/src/shared/Currency';
import { Payment } from '../model/Payment';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { PaymentStatus } from '../../../poker.ui/src/shared/PaymentStatus';
import { getUserData } from '../helpers';
import { UserSmall } from '../model/UserSmall';

export class TransferFundsRequestHandler extends AbstractMessageHandler<TransferFundsRequest> {

  constructor(private dataRepository: IDataRepository, private broadcastService: IBroadcastService) {
    super();
  }


  async handleMessage(wsHandle: WebSocketHandle, transferFundsRequest: TransferFundsRequest): Promise<any> {
    let dc = new DataContainer();
    dc.transferFundsResult = new TransferFundsResult();
    let user: User = await this.dataRepository.getUser(wsHandle.user.guid);
    let transferToUser: User;
    let arr: User[] = await this.dataRepository.getUsersByScreenName(transferFundsRequest.screenName)
    if (arr.length > 0) {
      transferToUser = arr[0];
    }

    let accountBalance = 0;
    let account: Account;
    if (user != null) {
      account = await this.dataRepository.getUserAccount(user.guid, Currency.dash);
      if (account != null)
        accountBalance = account.balance;
    }
    let transferAmount = transferFundsRequest.amount;

    if (isNaN(transferAmount))
      dc.transferFundsResult.errorMessage = `'${transferFundsRequest.amount}' is an invalid numeric value.`;
    else if (transferAmount < 1000000)
      dc.transferFundsResult.errorMessage = `Invalid amount. Minimum transfer balance is 0.01`;
    else if (transferAmount > accountBalance)
      dc.transferFundsResult.errorMessage = `Invalid amount. You cannot transfer ${transferFundsRequest.amount / CurrencyUnit.default} as your balance is ${accountBalance / CurrencyUnit.default}. If you are seated you must first leave the table to transfer your table balance to another player.`;
    else if (!transferFundsRequest.screenName)
      dc.transferFundsResult.errorMessage = 'Screen name to transfer to required';
    else if (!transferToUser)
      dc.transferFundsResult.errorMessage = `No user found with screen name: ${transferFundsRequest.screenName}`;
    else {
      dc.transferFundsResult.success = true;
      dc.transferFundsResult.amount = transferFundsRequest.amount;
      dc.transferFundsResult.screenName = transferFundsRequest.screenName;
      dc.transferFundsResult.currency = account.currency;

      let outgoingPayment = this.getPayment(PaymentType.outgoing, transferAmount + '', account.currency.toLowerCase(), user.guid, user.screenName, transferToUser.toSmall(), null)
      let incomingPayment = this.getPayment(PaymentType.incoming, transferAmount + '', account.currency.toLowerCase(), transferToUser.guid, transferToUser.screenName, null, user.toSmall())

      await this.dataRepository.updateUserAccount(user.guid, account.currency, -transferAmount, account.updateIndex)
      await this.dataRepository.savePayment(outgoingPayment);
      this.dataRepository.updateUserAccount(transferToUser.guid, account.currency, transferAmount)
      this.dataRepository.savePayment(incomingPayment);

    }

    wsHandle.send(dc);
    if (dc.transferFundsResult.success) {      
      wsHandle.sendUserData(user, this.dataRepository)

      this.broadcastService.send(transferToUser.guid, async () => {        
        let data = new DataContainer();
        data.user = await getUserData(transferToUser, this.dataRepository,  true);
        return Promise.resolve(data);
      })
    }



    return Promise.resolve();
  }

  getPayment(type: string, amount: string, currency: string, guid: string, screenName: string, transferTo: UserSmall, transferFrom: UserSmall) {

    let payment = new Payment();
    payment.type = type;
    payment.amount = amount;
    payment.currency = currency;
    payment.guid = guid;
    payment.screenName = screenName;
    payment.transferTo = transferTo;
    payment.transferFrom = transferFrom;
    payment.timestamp = new Date();
    payment.status = PaymentStatus.complete;
    return payment;
  }




}