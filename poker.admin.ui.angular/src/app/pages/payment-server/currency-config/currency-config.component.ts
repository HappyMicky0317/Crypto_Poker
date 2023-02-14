import { Component, OnInit } from '@angular/core';
import { PaymentServerApiService } from '../payment-server-api.service';

@Component({
  selector: 'currency-config',
  templateUrl: './currency-config.component.html',
  styleUrls: ['./currency-config.component.scss']
})
export class CurrencyConfigComponent implements OnInit {

  loading: boolean = true;
  errorMessage: string;
  currencyConfigs:any[];
  isHidden:boolean = true;
  constructor(private apiService: PaymentServerApiService) { }

  ngOnInit() {
    this.apiService.getCurrencyConfigs()
      .subscribe(data => {
        this.currencyConfigs = data;
        for (let config of this.currencyConfigs) {
          this.setEditFields(config);
        }
        this.loading = false;        
      }, 
      (e) => this.errorMessage = e);
  }

  editOrSave(config: any) {
    config.edit = !config.edit;
    
    if (!config.edit) {
      config.saving = true;
      let toSave = Object.assign({}, config);
      this.deleteEditFields(toSave);
      this.apiService.saveCurrencyConfigs(toSave)
        .subscribe(updatedConfig => {
          console.log('data', updatedConfig);
          this.setEditFields(updatedConfig);
          this.update(config, updatedConfig)          
        });

    }
  }
  add() {

    this.currencyConfigs.push({
      name: '',
      contractAddress: '',
      abi: '',            
      edit: true
    });
    console.log('this.currencyConfigs', this.currencyConfigs)
  }

  setEditFields(obj: any) {
    obj.edit = false;
    obj.saving = false;
  }
  
  deleteEditFields(obj:any){
    delete obj['edit'];
    delete obj['saving'];
  }

  update(existing: any, updated: any) {
    for (var member in updated) {
      if (existing.hasOwnProperty(member))
        existing[member] = updated[member];
    }
    for (var member in existing) {
      if (!updated.hasOwnProperty(member))
        existing[member] = null;
    }
  }

}
