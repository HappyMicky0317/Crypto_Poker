import { ITimerProvider } from "./ITimerProvider";

import { TableProcessor, TableProcessorMessage, TableMessage } from "../../admin/processor/table-processor/TableProcessor";
import { Table } from "../../table";

export class TimerProvider implements ITimerProvider {
  
    constructor(private processor:TableProcessor){
      
    }
    startTimer(handler: () => void, timeoutMs: number, table:Table): any {
      return setTimeout(()=>{
        let tMessage = new TableProcessorMessage(table);
      tMessage.tableMessage = new TableMessage();
      tMessage.tableMessage.action = handler;
      this.processor.sendMessage(tMessage)
      }, timeoutMs); 
    }
  }