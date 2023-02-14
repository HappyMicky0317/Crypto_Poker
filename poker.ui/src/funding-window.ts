import { TableViewRow } from './shared/TableViewRow';
import { autoinject, computedFrom } from "aurelia-framework";

@autoinject()
export class FundingWindow {
  model:FundingWindowModel;

  activate(model:FundingWindowModel) {
    this.model = model;
  }
  
}
export class FundingWindowModel {
  tableConfig: TableViewRow;  
  seatnum: number;
  playerStack: number;
}