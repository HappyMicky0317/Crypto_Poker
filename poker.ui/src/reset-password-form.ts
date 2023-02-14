import { ApiService } from './lib/api-service';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';
import { autoinject } from 'aurelia-framework';
import { ResetResult, ResetRequest } from './shared/reset-result';
import * as utility from './lib/utility';

@autoinject()
export class Reset{
  loading: boolean = true;
  result: ResetResult;
  password: string;
  confirm: string;
  resetPasswordSuccess:boolean;
  submitting:boolean;
  constructor(private apiService: ApiService, private router: Router, private ea: EventAggregator) {

  }

  async attached() {
    
    this.result = await this.apiService.reset(this.getResetRequest());
    this.loading = false;
  }

  async reset(){
    this.submitting = true;
    this.result.errors = [];
    let resetPasswordResult = await this.apiService.resetPassword(this.getResetRequest());
    this.submitting = false;
    
    if(resetPasswordResult.success){
      this.resetPasswordSuccess = true;
      localStorage.setItem("sid", resetPasswordResult.sid);
      setTimeout(()=>{ 
        window.location.href = '/';//use this as otherwise token remain in the url address
      }, 1500);
    }else{
      this.result.errors = resetPasswordResult.errors;
    }

  }

  getResetRequest() : ResetRequest{
    let request: ResetRequest = new ResetRequest();
    request.token = utility.getParameterByName('token');
    request.password = this.password;
    request.confirm = this.confirm;
    return request;
  }

  navigateToForgot(){
    window.location.href = '/#/forgot';//use this as otherwise tokens remain in the url address
  }
}
