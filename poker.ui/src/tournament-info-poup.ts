import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { Util } from "./lib/util";
import { TournamentInfoView } from "./shared/TournamentInfoView";
import { ApiService } from "./lib/api-service";
import { TournamentInfoResult, TournamentInfoRequest } from "./shared/TournamentInfoRequest";
import { EventAggregator } from "aurelia-event-aggregator";
import { Decimal } from "./shared/decimal";
import { ordinal_suffix_of } from "./shared/CommonHelpers";

@autoinject()
export class TournamentInfoPopup {
 
  
  message:string;  
  view: TournamentInfoResult;
  name:string;
  subscriptions: { dispose: () => void }[] = [];
  loading:boolean = true;
  prizes :{placing:string, prize:string}[] = [];  
  totalPrize:string;

  constructor(private ea: EventAggregator, private controller: DialogController, private apiService: ApiService,private util:Util) {
    this.subscriptions.push(ea.subscribe(TournamentInfoResult, (r) => this.handleTournamentInfoResult(r)));
  }

  handleTournamentInfoResult(result: TournamentInfoResult): any {
    this.loading = false;
    this.view = result;
    this.name = result.name;
    let i = 0;
    let total = new Decimal(0);
    for(let prize of result.prizes){
      this.prizes.push({placing: ordinal_suffix_of(i+1), prize: new Decimal(prize).toFixed(this.getNumDecimalPlaces(result.currency))})
      i++;
      total = total.add(new Decimal(prize));
    }   
    this.totalPrize = total.toString(); 
  }  

  getNumDecimalPlaces(currency:string){
    if(currency==='chp'){
      return 0;
    }
    return 3;
  }

  detached() {
    for (let sub of this.subscriptions)
      sub.dispose();
  }
  
  activate(model : { name:string, id: string}) {        
    this.name = model.name;   
    this.apiService.send(new TournamentInfoRequest(model.id))
  }


}
