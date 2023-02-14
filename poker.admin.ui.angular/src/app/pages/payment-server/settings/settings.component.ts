import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../../shared/admin-api.service';
import { PaymentServerUrlService } from '../payment-server-url.service';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  username:string;
  password:string;
  errorMessage:string;
  loading:boolean;
  successMessage:string;
  constructor(private apiService:AdminApiService) { }
  

  ngOnInit() {
    
   
    
  }


  dumpState(){
    this.apiService.dumpState()
    // .subscribe((x)=>{
    //   console.log('dumpState', x);
    // })
  }

}
