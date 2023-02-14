import { Decimal } from './shared/decimal';
import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as $ from 'jquery';
import { Util } from "./lib/util";
import {ApiService} from "./lib/api-service";
import { CashOutRequestResult, AccountWithdrawlResult } from "./shared/DataContainer";
import { CurrencyUnit } from "./shared/Currency";
import { ClientMessage, CashOutRequest, AccountWithdrawlRequest } from "./shared/ClientMessage";

@autoinject()
export class WithdrawlForm {
  
  receivingAddress: string;  
  withdrawlAmount: number;  
  cashingOutInfo: string;
  inProgress:boolean;
  amountSent: number;
  txHash: string;
  txHashLink: string;
  balance: number;
  success: boolean;
  errorMessage:string;
  result: AccountWithdrawlResult;
  loading: boolean = true;
  accounts: ICashOutAccountRowView[] = [];
  currency:string;
  refundAddress:string;
  refundAddressCount:number;
  insufficientBalance:boolean;
  subscriptions: { dispose: () => void }[] = [];
  constructor(private controller: DialogController, public util: Util, private ea: EventAggregator, private apiService: ApiService) {
    this.subscriptions.push(ea.subscribe(AccountWithdrawlResult, (r) => this.handleAccountWithdrawlResult(r)));
    this.subscriptions.push(ea.subscribe(CashOutRequestResult, (r) => this.handleCashOutRequestResult(r)));
  }

  detached() {    
    for(let sub of this.subscriptions)
      sub.dispose();
  }

  handleCashOutRequestResult(result: CashOutRequestResult) {
    this.accounts = [];
    this.loading = false;
    for (let account of result.accounts) {
      let view:ICashOutAccountRowView = <any>Object.assign({}, account);
      view.balance = this.util.fromSmallest(account.balance, account.currency),
      
      this.accounts.push(view);      
    }  

    let validAccounts = this.accounts.filter(acc=>!acc.insufficientBalance);
    this.insufficientBalance = validAccounts.length == 0;
    if(this.accounts.length == 0 || this.accounts.every(x=>new Decimal(x.balance).equals(0))){
      this.errorMessage = "You do not have any account balances!";
    }else if(validAccounts.length == 0){
      this.errorMessage = "Your balance is insufficient to cash out.";      
    }
    if(validAccounts.length === 1){
      validAccounts[0].checked=true;
      this.setRefundAddress(validAccounts[0]);
    }
      
  }

  accountChecked(view:ICashOutAccountRowView){
    for(let account of this.accounts.filter(acc=>acc != view)){
      account.checked=false;
    }
    
    this.setRefundAddress(view);
    this.withdrawlAmount = view.checked ? parseFloat(view.balance) : null;
  }
  setRefundAddress(view:ICashOutAccountRowView){
    if(view.checked){
      this.withdrawlAmount = parseFloat(view.balance);
      this.refundAddress = view.refundAddress;
      this.refundAddressCount = view.refundAddressCount;
      this.receivingAddress = view.refundAddress;
    }else{
      this.withdrawlAmount = null;
      this.refundAddress = null;
      this.refundAddressCount = null;
      this.receivingAddress = null;
    }
    
  }

  withdraw(){
      //this.controller.ok();
    this.errorMessage = '';
    let account:ICashOutAccountRowView;
    if(this.accounts.length > 1){
      account = this.accounts.find(acc=>acc.checked);
    }else{
      account = this.accounts[0];
    }
    if(!account){
      this.errorMessage = 'Please select an account to withdraw';
      return;
    }

    if (!this.receivingAddress) {
      this.errorMessage = "Please provide a receiving address";      
      return;
    }
    if (!this.withdrawlAmount || this.withdrawlAmount < 0) {
      this.errorMessage = "Please provide a withdrawl amount";      
      return;
    }
    
    this.inProgress = true;
    this.cashingOutInfo = 'Withdrawl in progress...please wait';

    this.currency = account.currency;        
    
    let accountWithdrawlRequest = new AccountWithdrawlRequest();
    accountWithdrawlRequest.currency = this.currency;
    accountWithdrawlRequest.receivingAddress = this.receivingAddress;
    accountWithdrawlRequest.amount = new Decimal(this.withdrawlAmount).mul(CurrencyUnit.default).toString();
    this.apiService.send(accountWithdrawlRequest);
  }
  

  handleAccountWithdrawlResult(result: AccountWithdrawlResult) {
    this.result = result;
    this.inProgress = false;
    this.success = result.success;
    this.cashingOutInfo = '';
    this.errorMessage = result.errorMessage;
    
    if (result.success) {
      this.amountSent = parseFloat(result.sentAmount);
      this.txHash = result.txHash;
      this.balance = parseFloat(result.balance);
      this.txHashLink = result.txHashLink;            
    }       
  }
  
}
interface ICashOutAccountRowView {
  currency:string
  balance:string
  insufficientBalance:boolean;
  checked:boolean;
  refundAddress:string;
  refundAddressCount:number;    
}


