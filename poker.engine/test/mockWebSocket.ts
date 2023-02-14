import { IWebSocket } from "../src/model/WebSocketHandle";
import { DataContainer} from "../../poker.ui/src/shared/DataContainer";
import { ClientMessage } from "../../poker.ui/src/shared/ClientMessage";
import protobufConfig from './../../poker.ui/src/shared/protobuf-config';

export class MockWebSocket implements IWebSocket {
    _socket: any = {remoteAddress:"127.0.0.1"};
    on(event: "close", cb: (code: number, message: string) => void): this;
    on(event: "error", cb: (code: number, message: string) => void): this;
    on(event: "message", cb: (data: string | Buffer | ArrayBuffer | Buffer[]) => void): this;    
    on(event: "pong", cb: (data: Buffer) => void): this;
    on(event: any, cb: any) {
        if(event==='message'){
            this.incomingMessageFunc=cb;
        }
        else if(event==='close'){
            this.closeFunc=cb;
        }
        return this;
    }
    outgoingMessages:DataContainer[] = [];
    incomingMessageFunc:(data: any, flags: { binary: boolean }) => void;
    closeFunc:any;
    readyState:number = 0;
    terminate() : void {};    
   
    
    ping() : void {};
    send(data:any):void{
        if(data instanceof Buffer){
            let deserialized = protobufConfig.deserialize(data, 'DataContainer');
            this.outgoingMessages.push(deserialized);
        }else{
            this.outgoingMessages.push(JSON.parse(data));
        }
        
    };
    upgradeReq:any;
    triggerMessageFromClient(data: ClientMessage):void {
      let dataStr = JSON.stringify(data);
        this.incomingMessageFunc(dataStr, { binary: false });        
    };
    triggerClose(){
        this.closeFunc();
    }
  clearMessages() {
    this.outgoingMessages = [];
  }
  getLastMessage(): DataContainer {
    return this.outgoingMessages[this.outgoingMessages.length - 1];
  }
  dequeue(): DataContainer {
    let message = this.getLastMessage();
    this.outgoingMessages.pop();
    return message;
  }

  checkNoErrorMessages(): any {
      for (let message of this.outgoingMessages) {
          if (message.error != undefined) {
            throw Error("expecting no errors. Instead have error: " + message.error.message);
          }
      }
      
      
  }
}