import { Component, OnInit } from '@angular/core';
import { Http, Response } from "@angular/http";
import { PaymentServerApiService } from '../payment-server-api.service';

@Component({
  selector: 'deposit-addresses',
  templateUrl: './deposit-addresses.component.html',
  styleUrls: ['./deposit-addresses.component.scss']
})
export class DepositAddressesComponent implements OnInit {

  constructor(private apiService: PaymentServerApiService) { }
  loading: boolean = true;
  currencies: string[] = [];
  currency: string;
  errorMessage: string;
  depositAddresses:any[] = [];
  xpub:string='';

  ngOnInit() {
    this.apiService.getCurrencyConfigs()
      .subscribe(data => {
        this.currencies = data.map(c=>c.name);
        this.loading = false;
        this.onCurrencyChanged();
      }, 
      (e) => this.errorMessage = e);
  }

  refresh(){
    this.onCurrencyChanged();
  }

  onCurrencyChanged(){
    if(!this.currency){
      return;
    }
    this.apiService.getDepositAddresses(this.currency)
      .subscribe(data => {
        
        this.depositAddresses = data.addresses;
        this.xpub = data.xpub
      }, 
      (e) => this.errorMessage = e);
  }

}
