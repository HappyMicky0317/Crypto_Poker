import { TableViewRow } from './shared/TableViewRow';
import { autoinject, computedFrom, bindable } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { EventAggregator } from 'aurelia-event-aggregator';
import * as $ from 'jquery';
import 'bootstrap-slider';//see http://seiyria.com/bootstrap-slider/
import { Util } from "./lib/util";
import {FundAccountResult, AccountFunded } from "./shared/DataContainer";
import {ApiService} from "./lib/api-service";
import { ClientMessage, FundAccountRequest } from "./shared/ClientMessage";
import { Currency } from './shared/Currency';
import { FundingWindowModel } from './funding-window';

@autoinject()
export class DepositForm {
  
  @bindable fundingWindowModel:FundingWindowModel;
  @bindable hideCloseControls:boolean;
  paymentAddress: string;
  currency: string;
  seatnum: number;
  infoMessage: string;
  paymentReceived: number = 0;
  checkingForPaymentLabel: string = 'Waiting for payment';
  paymentTimer: number;
  paymentTimerStart: Date;
  waitingOnPayment: HTMLElement;
  joinAmountInput: HTMLInputElement;
  currencySelect: HTMLInputElement;
  paymentAddressInput: any;
  subscriptions: { dispose: () => void }[] = [];
  copied: boolean;
  tableConfig: TableViewRow;
  buyInAmount: string;
  playerStack: number;
  fundAccountResult:FundAccountResult;
  funded:boolean;
  currencies:string[];
  backgroundInterval:any;

  constructor(private controller: DialogController, public util: Util, private ea: EventAggregator, private apiService: ApiService) {
    this.subscriptions.push(ea.subscribe(FundAccountResult, (r) => this.handleFundAccountResult(r)));
    this.subscriptions.push(ea.subscribe(AccountFunded, (r) => this.handleAccountFunded(r)));
    this.currencies = util.getCryptoCurrencies();     
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }
  
  @computedFrom('currency')
  get isCrypto(): boolean {
    return this.currency && this.currency.toLowerCase() !== 'usd';
  }


  handleFundAccountResult(result: FundAccountResult) {
    if(result.currency==this.currency){
      this.fundAccountResult = result;  
      this.paymentAddress = result.paymentAddress;    
      this.blink();    
    }
    
  }

  getPaymentLabel(seconds: number) {
    if (seconds === 0)
      return 'Checking payment...';
    return `Next checking for payment in ${seconds} second` + (seconds>1?'s':'');
  }

  //dataSliderTicks: string;
  //dataSliderTickLabels: string;

  handleAccountFunded(result: AccountFunded) {
    
    if(this.currency != result.currency)
      return;      

    let isPlayMoney = result.currency == Currency.free;
    this.funded = isPlayMoney || (result.paymentReceived > 0 && result.confirmations >= this.fundAccountResult.requiredConfirmations);
    if (this.funded && this.seatnum != null) {      
      this.playerStack = result.balance;
      this.setupSlider();      
    }
    
    if(!isPlayMoney){
      this.checkingForPaymentLabel = `Received ${result.confirmations} of ${this.fundAccountResult.requiredConfirmations} confirmations`;  
    }
    
    this.paymentReceived = result.paymentReceived;    
    if (this.funded) {
      clearInterval(this.paymentTimer);
      if(this.seatnum != null){
        this.infoMessage = 'Use the slider below to select your buy-in amount';
      }else{
        this.infoMessage = 'Your account has been funded';
      }
      
    }      
    else
      this.paymentTimerStart = new Date();
  }

  setupSlider(){
    let min = this.tableConfig.bigBlind;      
    let max = Math.min(this.tableConfig.maxBuyIn*min, this.playerStack);
    let maxUsd = this.util.toUsd(max, this.tableConfig.exchangeRate, this.tableConfig.currency);
    let minLabel = this.util.formatAmountWithUsd(min, this.tableConfig.currency, this.tableConfig.bigBlindUsd);
    let maxLabel = this.util.formatAmountWithUsd(max, this.tableConfig.currency, maxUsd);
    $(this.joinAmountInput).slider({
      min: min,
      max: max,
      step: 1,
      value: max,
      ticks: [min, max],
      ticks_labels: [minLabel, maxLabel],
    }).on('slide', () => {
      this.joinAmountChanged();      
    });   
    this.joinAmountChanged();    
  }

  joinAmountChanged() {
    let amount = this.getBuyInAmount();    
    let tableConfig = this.util.tableConfigs.find(t=>t.currency.toLowerCase()===this.currency.toLowerCase());
    this.buyInAmount = this.util.toDisplayAmount(amount, tableConfig);  
  }

  getBuyInAmount() :number {
    return parseFloat(this.joinAmountInput.value);
  }

  
  bind(bindingContext: Object, overrideContext: Object){
    if(this.fundingWindowModel!=null){
      this.tableConfig = this.fundingWindowModel.tableConfig;    
      this.currency = this.tableConfig.currency;
      this.seatnum = this.fundingWindowModel.seatnum;
      this.playerStack = this.fundingWindowModel.playerStack;
      this.infoMessage = 'Your account needs to be funded'; 
    }
    
  }

  currencyChanged() {
    clearInterval(this.backgroundInterval);
    this.fundAccountResult = null;
    this.paymentAddress = null;
    this.sendFundAccountRequest();
  }

  attached() {
    //console.log('DepositForm.attached', this.fundingWindowModel);
    if(this.fundingWindowModel){
      if(!this.playerStack){
        this.sendFundAccountRequest();
      }else{
        this.setupSlider();
        this.infoMessage = 'Use the slider below to select your buy-in amount';
      }
    }else{
      this.currency = this.currencies[0];      
    }
  }

  sendFundAccountRequest(){    
    console.log('deposit form sending sendFundAccountRequest');
    this.apiService.send(new FundAccountRequest(this.currency));
  }

  copyAddress() {    
    this.paymentAddressInput.select();
    document.execCommand("copy");
    this.paymentAddressInput.selectionStart = this.paymentAddressInput.selectionEnd;
    this.copied = true;
  }

  blink() {
    if (!this.paymentAddress)
      return;
    
    // $(this.waitingOnPayment).fadeOut(1000).fadeIn(1000, () => {
    //   //console.log('blink complete');
    //   this.blink();
    // });
    this.backgroundInterval = setInterval(() =>{
      $(this.waitingOnPayment).toggleClass("yellow-bg");
   },550)
  }

  
  
}

