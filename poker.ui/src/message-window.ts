import { autoinject } from "aurelia-framework";
import { DialogController } from 'aurelia-dialog';

@autoinject()
export class MessageWindow {
  
  message:string;

  constructor(private controller: DialogController) {
  }

  
  activate(model) {
    this.message = model;

  }


}
