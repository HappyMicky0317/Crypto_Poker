import { ClientMessage } from './../../../poker.ui/src/shared/ClientMessage';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";

export class AbstractMessageHandler<T> implements IMessageHandler {
    public readonly typeName : string;
    
    constructor() {
        let typeName = this.constructor.name.replace('Handler', '');
        this.typeName = typeName.charAt(0).toLowerCase() + typeName.slice(1);
    }
    run(wsHandle: WebSocketHandle, data: ClientMessage): Promise<any> {
        
        let request:T = (<any>data)[this.typeName];
        return this.handleMessage(wsHandle, request);
    }
    async handleMessage(wsHandle: WebSocketHandle, request:T): Promise<any>{
        throw new Error("Method not implemented."); 
    }
    init(): Promise<void> {
        return Promise.resolve();
    }
}
