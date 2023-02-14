import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';
import { TournamentViewRow } from "./shared/tournmanet-view-row";
import { DepositNowEvent } from "./messages";
import { EventAggregator } from "aurelia-event-aggregator";
import { FundingWindowModel } from "./funding-window";
import { TableViewRow } from "./shared/TableViewRow";
import Decimal from "decimal.js";

@autoinject()
export class RegisterTournamentPopup {
  
  view:RegisterTournamentPopupViewModel;
  housePrize:number;

  constructor(private controller: DialogController, private ea: EventAggregator) {
  }

  
  activate(model:RegisterTournamentPopupViewModel) {
    this.view = model;
    this.housePrize = new Decimal(model.tournament.totalPrize).minus(new Decimal(model.tournament.buyIn).mul(model.tournament.playerCount)).toNumber();
  }

  openDepositWindow(){
    let model = new FundingWindowModel();    
    model.tableConfig = new TableViewRow();
    model.tableConfig.currency = this.view.tournament.currency;

    this.ea.publish(new DepositNowEvent(model));
    this.controller.cancel();
  }

  registerForTournament(){
    this.controller.ok();
  }

}

export class RegisterTournamentPopupViewModel {  
  tournament:TournamentViewRow;
  isFunded:boolean;
}
