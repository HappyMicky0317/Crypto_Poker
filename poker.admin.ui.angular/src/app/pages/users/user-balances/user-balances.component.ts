import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../../shared/admin-api.service';


@Component({
  selector: 'user-balances',
  templateUrl: './user-balances.component.html',  
})
export class UserBalancesComponent implements OnInit {

  loading: boolean = false;
  currencies: string[] = [];  
  currency: string = ''
  userBalances:{screenName:string, joined:string, email:string, balance:number}[];  
  errorMessage: string;
  total:string|undefined;

  constructor(private apiService: AdminApiService) {
    
   }

  
  ngOnInit() {
    this.apiService.getCurrencies()
    .subscribe(data => {
      this.currencies.push(...data);
      this.currency = 'dash';
      //this.fetch();
    }, 
    (e) => this.errorMessage = e);
  }

  

  fetch(){
    this.loading = true;
    this.apiService.getUserBalances(this.currency)
      .subscribe(data => {        
        this.userBalances = data;
        this.total = this.userBalances.map(x=>x.balance).reduce((a,b)=>a+b, 0) + '';
        this.loading = false;
      }, 
      (e) => this.errorMessage = e);
  }



  

  
}
