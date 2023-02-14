import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../shared/admin-api.service';

@Component({
  selector: 'tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {

  constructor(private apiService: AdminApiService) {
   }
   myDropdownModel:number = 4;
  
  tableConfigs: any[] = [];
  currencies:string[] = []
  
  errorMessage:string;
  loading:boolean = true;
  
  ngOnInit() {
    
    this.apiService.getCurrencies()
      .subscribe(data => {
        this.currencies = data;
        this.getTables();
      }, 
      (e) => this.errorMessage = e);

    
  }

getTables(){
  this.apiService.getTables(null)
  .subscribe(data => {
    this.loading = false;
    this.tableConfigs = data;
    for (let config of this.tableConfigs) {
      config.edit = false;
    }
  },
  (e) => {
    this.errorMessage = e;
    this.loading = false;
  });
}

  editOrSave(table: any) {
    table.edit = !table.edit;
    console.log('table', table)
    if (!table.edit) {
      let toSave = Object.assign({}, table);
      delete toSave['edit'];
      this.apiService.saveTable(toSave)
        .subscribe((data:any) => {
          console.log('save table', data)
          Object.assign(table, data)
        });
    }
  }
  addTable() {
    this.tableConfigs.push({
      name: '',
      smallBlindUsd: 0.1,
      bigBlindUsd: 0.2,
      currency: 'DASH',
      maxPlayers: 9,
      timeToActSec: 65,
      maxBuyIn: 200,
      orderIndex: this.tableConfigs.length+1,
      rake: 1,
      edit: true
    });
  }
  delete(table) {
    this.apiService.deleteTable(table._id)
      .subscribe(data => {
        this.tableConfigs.splice(this.tableConfigs.indexOf(table), 1);
      });

    
  }

}
