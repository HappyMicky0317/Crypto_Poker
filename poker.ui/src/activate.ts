import { ApiService } from './lib/api-service';
import { EventAggregator } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';
import { autoinject } from 'aurelia-framework';
import { ActivateRequest, ActivateResult } from './shared/activate-request';
import * as utility from './lib/utility';

@autoinject()
export class Activate {

  loading: boolean = true;
  result: ActivateResult;
  constructor(private api: ApiService, private router: Router,private ea: EventAggregator) {

  }
  async attached() {

    let request: ActivateRequest = new ActivateRequest();
    request.token = utility.getParameterByName('token');
    let tournamentId = utility.getParameterByName('tournamentId');
    this.result = await this.api.activate(request);
    
    this.loading = false;
    if(this.result.success){
      if(tournamentId){
        localStorage.setItem("registerForTournamentId", tournamentId);
      }
      localStorage.setItem("sid", this.result.sid);
      setTimeout(()=>{             
        window.location.href = '/';//use this as otherwise token remain in the url address
      }, 2000);      
    }
  }

  
}
