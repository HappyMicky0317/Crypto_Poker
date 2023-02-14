import { Component, OnInit, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'hooks',
  templateUrl: './hooks.component.html',
  styleUrls: ['./hooks.component.scss']
})

@Injectable()
export class HooksComponent implements OnInit {

  constructor(private http:HttpClient) { 
   
  }

  ngOnInit() {
    this.load();
  }

  hooks: any[] = [];
  apiToken: string = 'b44865eb69aa4d1abbbffed567e26e75';
  deleting:boolean = false;
  currency: string = 'btc';
  currencies: string[] = ['dash', 'bcy', 'eth', 'btc', 'beth'];
  loading: boolean;
  baseUrl = 'https://api.blockcypher.com/';

  currencyChanged() {
    this.load();
  }
  

  load() {
    this.hooks = [];
    console.log('currency', this.currency)
    if (!this.currency)
      return;
    this.loading = true;
    let network = this.getNetwork();
    this.http.get(`${this.baseUrl}v1/${this.currency}/${network}/hooks?token=${this.apiToken}`)
      .subscribe((data:any) => {
        
        this.hooks = data;
        this.loading = false;
      });
  }
  
  delete(hook) {
    this.deleting = true;
    let network = this.getNetwork();
    
    let path = `${this.baseUrl}v1/${this.currency}/${network}/hooks/${hook.id}?token=${this.apiToken}`;
    this.http.delete(path)
      .subscribe((data:any) => {
        if (!data) {
          this.hooks.splice(this.hooks.indexOf(hook), 1);
        } else {
          alert('non expected result: ' + data);
        }
        this.deleting = false;
      });

  }

  getNetwork(){
    let network = 'main';
    if (this.currency === 'bcy' || this.currency === 'beth')
      network = 'test';
    return network;
  }

}
