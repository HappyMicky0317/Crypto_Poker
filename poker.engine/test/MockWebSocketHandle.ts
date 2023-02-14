import { MockWebSocket } from './mockWebSocket';
import { WebSocketHandle } from "../src/model/WebSocketHandle";
import { User } from '../src/model/User';

export class MockWebSocketHandle extends WebSocketHandle{
    
    
    constructor(guid:string) {
        super(new MockWebSocket());
        this.user = new User();
        this.user.guid = guid;    
        this.user.screenName = 'screenName_' +guid;    
    }

    get mockWebSocket() : MockWebSocket{
        return <MockWebSocket>this.socket;
    }
    
}