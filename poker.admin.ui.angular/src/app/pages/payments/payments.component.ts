import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../shared/admin-api.service';
import { isPaymentServer } from '../../../app-configuration';

@Component({
  selector: 'payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {

  loading: boolean = true;
  currencies: string[] = [];
  paymentTypes: string[] = [];
  paymentType:string;
  currency: string = ''
  screenName: string = ''
  errorMessage: string;
  payments:any[] = []
  saving:boolean = false;
  approving:boolean = false;
  cancelling:boolean = false;
  showOptions: string[] = [];
  showOption:string;

  constructor(private apiService: AdminApiService) {
    this.paymentTypes = [ '-both-', 'incoming', 'outgoing']
    this.paymentType = '-both-'
    this.currencies = [ '-all-']
    this.currency = '-all-'
    this.showOptions = ['20', '100', 'ALL'];
    this.showOption = '20';
   }

  
  ngOnInit() {
    this.apiService.getCurrencies()
    .subscribe(data => {
      this.currencies.push(...data);
      this.loading = false;
      this.fetch();
    }, 
    (e) => this.errorMessage = e);
  }

  

  fetch(){
    this.payments = [];
    let currency:string|null = this.currency==this.currencies[0] ? null : this.currency;
    let paymentType:string|null = this.paymentType==this.paymentTypes[0] ? null : this.paymentType;
    this.apiService.getPayments(currency, paymentType, this.screenName, this.showOption)
      .subscribe(data => {
        for(let payment of data){
          this.setLocalFields(payment)
        }
        this.payments = data;
      }, 
      (e) => this.errorMessage = e);
  }

  isPaymentServer() : boolean{
    if(!isPaymentServer){
      alert('You must be on the payment server to perform this action');
      return false;
    }
    return true;
  }

  approve(payment:any){
    if(!this.isPaymentServer()){
      return;
    }
    this.saving = true;
    this.approving = true;
    this.apiService.approvePayment(payment._id)
    .subscribe((manualApprovalResult:any)=>{
      if(manualApprovalResult.error){
        payment.error = manualApprovalResult.error;
      }else{
        payment.error = manualApprovalResult.payment.error;
        payment.status = manualApprovalResult.payment.status;
      }
      this.setLocalFields(payment)
      
      this.saving = false;
      this.approving = false;
    });
  }

  cancel(payment:any){
    if(!this.isPaymentServer()){
      return;
    }
    this.cancelling = true;
    this.saving = true;
    
    this.apiService.cancelPayment(payment._id)
    .subscribe((result:any)=>{
      if(result.error){
        payment.error = result.error;
      }else{        
        payment.status = result.payment.status;
      }
      this.setLocalFields(payment)
      
      this.saving = false;
      this.cancelling = false;
    });
  }

  setLocalFields(payment:any){
    payment.canApprove = payment.type=='outgoing' && (payment.status=='pending' || payment.status=='flagged');
    if(payment.txId){
      payment.txHashLink = this.getTxHashLink(payment.txId, payment.currency);
    }    
  }

  getTxHashLink(txHash:string, currency:string){
    if(currency=='dash'){
      return `https://chainz.cryptoid.info/dash/tx.dws?${txHash}.htm`;
    }else if(currency=='eth' || currency=='ukg'|| currency=='chp'){
      return `https://etherscan.io/tx/${txHash}`;
    }else if(currency=='btc'){
      return `https://www.blockchain.com/btc/tx/${txHash}`;
    }
    return txHash;
  }

  // testData(){
  //   setTimeout(()=>{
  //     this.loading=false;
  //     this.currencies = [ '-all-', 'dash']
  //     this.currency = '-all-'
  //     this.paymentTypes = [ '-both-', 'incoming', 'outgoing']
  //     this.paymentType = 'outgoing'
  //     this.payments.push({
  //       type:'outgoing',
  //       amount:'0.123',
  //       currency:'dash',
  //       address:'Xxasdasd',
  //       status:'pending',
  //       screenName:'poker_wiz',
  //       timestamp: new Date().toISOString(),
  //     })
  //     this.payments.push({
  //       type:'outgoing',
  //       amount:'0.123',
  //       currency:'dash',
  //       address:'Xxasdasd',
  //       status:'complete',
  //       screenName:'poker_wiz',
  //       timestamp: new Date().toISOString(),
  //       txHashLink: 'https://chainz.cryptoid.info/dash/tx.dws?92b0bb813981008c8493973f8e976ca6fc1a10056f9b70a2ae832f15d0a92ec4.htm'
  //     })
  //   },1000)
  // }

}
