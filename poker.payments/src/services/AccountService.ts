import { IBlockCypherService } from "./IBlockCypherService";
import * as encryption from '../../../poker.engine/src/framework/encryption';
import { AddressInfo } from "../model/AddressInfo";
import { TransactionResult } from "./BlockCypherService";
import { Payment } from "../../../poker.engine/src/model/Payment";
import { EventHook, EventHookResult } from "../model/EventHook";
import environment from '../environment';

import { IncomingPaymentEvent } from "../model/incoming-payment-event";
import { Logger, getLogger } from "log4js";
const logger: Logger = getLogger();
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import { to, SharedHelpers } from '../../../poker.engine/src/shared-helpers';
import { ISecureDataRepository } from '../repository/ISecureDataRepository';
import { IConnectionToGameServer } from "./ConnectionToGameServer";
import { AccountFundedResult } from "../../../poker.engine/src/model/AccountFundedResult";
import { AccountWithdrawlResultInternal } from "../../../poker.engine/src/model/AccountWithdrawlResultInternal";
import { Currency } from "../../../poker.ui/src/shared/Currency";
import { PaymentType } from "../../../poker.ui/src/shared/PaymentType";
import { GetDepositAddressRequest } from "../../../poker.engine/src/admin/model/outgoing/GetDepositAddressRequest";
import { GetDepositAddressResult } from "../../../poker.engine/src/admin/model/incoming/GetDepositAddressResult";
import { UserSmall } from "../../../poker.engine/src/model/UserSmall";
import { PaymentStatus } from "../../../poker.ui/src/shared/PaymentStatus";
import { IBlockChainService } from "./IBlockChainService";
import { EthBlockService } from "./EthBlockService";
import { CurrencyConfig } from "../model/currency-config";


export class IAccountService {
  loadCurrencyConfigs() : Promise<void> {         throw new Error("Method not implemented.");    }
  handlePayment(event: IncomingPaymentEvent): Promise<Payment | null> { throw new Error("Not implemented"); };
  monitorAddress(addressInfo: AddressInfo) { throw new Error("Method not implemented."); }
  isWaitingOnPriorTransaction(currency: string): Promise<string> { throw new Error("Not implemented"); }
  async newTransaction(currency: string, receivingAddress: string, balance: number, userGuid: string): Promise<TransactionResult> { throw new Error("Not implemented"); }
}


export class AccountService implements IAccountService {


  private dataRepository: ISecureDataRepository;
  blockCypherService: IBlockCypherService;
  connectionToGameServer: IConnectionToGameServer;
  


  constructor(blockCypherService: IBlockCypherService, dataRepository: ISecureDataRepository, private services: IBlockChainService[]) {
    this.dataRepository = dataRepository;
    this.blockCypherService = blockCypherService;
  
  }

  async monitorAddress(info: AddressInfo) : Promise<void> {
    let service = this.getService(info.currency);
    if (service != null) {
      
      let currencyConfig = await this.dataRepository.getCurrencyConfig(info.currency);
      let address = await service.getAddress(info.currency, currencyConfig.xpub, info.index);
      if(address === info.address){
        service.monitorAddress(info);
      }else{
        logger.warn(`addresses do not match! received ${info} and using xpub:${currencyConfig.xpub} and ${info.index} calculated address=${address}`)
      }
      
      
    } else {
      throw new Error(`currency not supported: ${info.currency}`);
    }
  }

  async newTransaction(currency: string, receivingAddress: string, balance: number, userGuid: string): Promise<TransactionResult> {

    let service = this.getService(currency);
    if (service != null) {
      return service.newTransaction(currency, receivingAddress, balance, userGuid);
    } else {
      throw new Error(`currency not supported: ${currency}`);
    }
  }

  private getService(currency: string): IBlockChainService {
    let config = this.blockCypherService.currencyConfigs.find(x=>x.name==currency);
    currency = SharedHelpers.getCurrency(config);
    let service = this.services.find(s => s.currency == currency);
    return service;
  }

  async init(): Promise<void> {
    await this.loadCurrencyConfigs();
    await this.blockCypherService.init();
    for(let service of this.services){
      await service.init();
    }   
  }

  async loadCurrencyConfigs(): Promise<void> {
    await this.blockCypherService.loadCurrencyConfigs();
    let ethBlockService = this.services.find(s => s.currency == Currency.eth);
    if (ethBlockService) {
      await (<EthBlockService>ethBlockService).loadCurrencyConfig();
    }

  }

  
  isWaitingOnPriorTransaction(currency: string): Promise<string> {

    let service = this.getService(currency);
    return service.isWaitingOnPriorTransaction();

  }

  async handlePayment(event: IncomingPaymentEvent): Promise<Payment | null> {
    let info: AddressInfo = await this.dataRepository.getAddressInfoByAddress(event.address);
    let amountDecimal = new Decimal(event.amount);
    let remainder = amountDecimal.minus(amountDecimal.floor());
    let amount: number = amountDecimal.floor().toNumber();
    let confirmations: number = event.confirmations;
    logger.info(`creditAccount: address: ${info.address} confirmations ${confirmations} amount ${amount} instantlock: ${event.instantlock}`);


    let currencyConfig = await this.dataRepository.getCurrencyConfig(info.currency);
    if (!currencyConfig.requiredNumberOfConfirmations) {
      logger.warn(`requiredNumberOfConfirmations is not defined for currency config ${info.currency}`);
      return null;
    }

    if (info.incomingTxHashes.find(h => h == event.txHash)) {
      logger.info(`address ${info.address} has already processed tx ${event.txHash}`);
      return null;
    }
    
    let payment = await this.dataRepository.getPaymentByTxId(info.currency, event.txHash)
    if (payment != null && payment.status == PaymentStatus.complete) {
      //should not get here ever due to info.incomingTxHashes catch above
      logger.warn(`payment is complete but is missing expected entry in incomingTxHashes. address:${info.address} event.txHash:${event.txHash}`);
      return null;
    }

    if (payment == null) {
      let currency = (event.currency || info.currency).toLowerCase();
      payment = new Payment();
      payment.type = PaymentType.incoming;
      payment.currency = currency;
      payment.guid = info.userGuid;
      payment.screenName = info.screenName;
      payment.timestamp = new Date();
      payment.address = info.address;
      payment.txId = event.txHash;
      payment.amount = amount + '';
    }
    if (payment.confirmations !== confirmations) {

      payment.confirmations = confirmations;
      payment.status = confirmations < currencyConfig.requiredNumberOfConfirmations ? PaymentStatus.pending : PaymentStatus.complete;
      payment.sweepFeeUsed = false;
      payment.remainder = remainder.toString();
      payment.updated = new Date();

      if (payment.status == PaymentStatus.complete) {
        info.incomingTxHashes.push(event.txHash);
        await this.dataRepository.saveAddress(info);
      }

      await this.dataRepository.savePayment(payment);

      this.sendAccountFunded(payment);
      return payment;
    }



  }

  private sendAccountFunded(payment?: Payment) {
    let accountFundedResult: AccountFundedResult = new AccountFundedResult();
    accountFundedResult.payment = payment;
    this.connectionToGameServer.send(accountFundedResult);
  }



  getPayment(currency: string, guid: string, bcResult: TransactionResult, address: string, screenName: string) {
    let payment = new Payment();
    payment.currency = currency.toLowerCase();
    payment.address = address;
    payment.amount = bcResult.sentAmount + '';
    payment.guid = guid;
    payment.timestamp = new Date();
    payment.type = PaymentType.outgoing;
    payment.fees = bcResult.fees;
    payment.txId = bcResult.txHash;
    payment.screenName = screenName;
    return payment;
  }



  async checkPayment(address: string): Promise<void> {
    let info = await this.dataRepository.getAddressInfoByAddress(address);
    if (!info) {
      logger.warn(`checkPayment for address ${address} but no address found`);
      return Promise.resolve();
    }
  }





}


interface IPaymentPollArgs {
  address: string;
  currency: string;
  count: number;
  userGuid: string;
}