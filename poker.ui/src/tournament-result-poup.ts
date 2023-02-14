import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';

import { Util } from "./lib/util";
import { TournamentResultView } from "./shared/TournamentResultView";
import { ApiService } from "./lib/api-service";
import { RebuyRequest } from "./shared/ClientMessage";
import { ordinal_suffix_of } from "./shared/CommonHelpers";

@autoinject()
export class TournamentResultPopup {
  
  message:string;
  view: TournamentResultView;
  placingSuffix:string;
  constructor(private controller: DialogController, private util: Util,private apiService: ApiService) {
  }

  
  activate(view:TournamentResultView) {    
    this.view = view;
    this.placingSuffix = ordinal_suffix_of(view.placing);
  }

  rebuy(){
    this.apiService.send(new RebuyRequest(this.view.tournamentId))
    this.controller.ok();
  }

}
