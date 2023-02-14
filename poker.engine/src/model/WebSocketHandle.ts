import WebSocket = require('ws');
import { User } from "./User";
import {DataContainer, PokerError, UserData } from "../../../poker.ui/src/shared/DataContainer";
var logger = require('log4js').getLogger();
import protobufConfig from '../../../poker.ui/src/shared/protobuf-config';
import { ISubscriber } from './ISubscriber';
import { getUserData } from '../helpers';
import { IDataRepository } from '../services/documents/IDataRepository';
import { inspect } from 'util' 

export interface IWebSocket {
    terminate(): void;
    // on(event: string, cb: (data: any, flags: { binary: boolean }) => void): this;
    on(event: 'close', cb: (code: number, message: string) => void): this;
    on(event: 'error', cb: (code: number, message: string) => void): this;
    on(event: 'message', cb: (data: WebSocket.Data) => void): this;
    on(event: 'pong', cb: (data: Buffer) => void): this;    
    ping(data?: any, options?: { mask?: boolean; binary?: boolean }, dontFail?: boolean): void;
    send(data: any, cb?: (err: Error) => void): void;
    _socket:any;    
    readyState:number;    
}

export class WebSocketHandle implements ISubscriber {
  static handleIndex:number = 0;  
  constructor(socket: IWebSocket) {
      this.id = ++WebSocketHandle.handleIndex;
      this.socket = socket;
        //(<any>this.socket).binaryType = 'arraybuffer';
        this.isAlive = true;
        this.lastPing = new Date();
        this.socket.on('pong', () => {
            // console.log('received pong');
            this.isAlive = true;
        });
    }

    socket: IWebSocket;
    isAlive: boolean;
    user: User;
    lastPing: Date;
    ipAddress: string;
    countryCode: string;
    country: string;
    authenticated: boolean;
    onerror:()=>void;
    id:number;

    setUser(user: User) {
      if (user) {
        this.user = user;
      } else {
        throw new Error("cannot set user to null" + JSON.stringify(this.user));
      }
    }
    terminate() {
        this.socket.terminate();
    }
    ping() {
        this.socket.ping('', undefined, true);
    }

    send(data: DataContainer|Buffer) {
      
      try {
        if(data instanceof DataContainer){        
          data = protobufConfig.serialize(data, 'DataContainer');                    
        }
        try {        
          this.socket.send(data);
          
        }catch(e) {
          logger.info(`error sending to user:${this.user.screenName}:${this.id} ${inspect(e)}`);
          this.onerror();    
        }
      } catch (e) {
        logger.error(`error serialize :${this.user.screenName}:${this.id} data:${inspect(data)}` +  e);//this will be a serialize error
      }
      
      
    }

  sendError(msg: string) {
    let data = new DataContainer();
    data.error = new PokerError();
    data.error.message = msg;
    this.send(data);
    }
  async sendUserData(user: User, dataRepository:IDataRepository, initialData:boolean=true):Promise<void> {
    let data = new DataContainer();    
    data.user = await getUserData(user, dataRepository, initialData);
    this.send(data);
  }



}


