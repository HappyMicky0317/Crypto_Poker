import { ClientMessage, SubscribeToTableRequest } from './../shared/ClientMessage';
import { ActivateRequest, ActivateResult } from './../shared/activate-request';
import { autoinject } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import WebSocketClient from "./websocket";
import { DataMessageEvent, ConnectionClosedEvent } from "../messages";
import environment from '../environment';
import {Util} from "./util";
import { HttpClient, HttpResponseMessage } from 'aurelia-http-client';
import { IClientServerMessage } from '../shared/ClientMessage';
import { ResetRequest, ResetResult } from '../shared/reset-result';
import protobufConfig from '../shared/protobuf-config';
import { Version } from '../shared/DataContainer';

@autoinject()
export class ApiService {

  wsURI: string;
  ws: WebSocketClient;  
  authenticated:boolean;
  sid:string;
  version:Version;

  constructor(private ea: EventAggregator, private util: Util) {
    let protocol = location.protocol === 'https:' ? 'wss' : 'ws';        
    let port = environment.debug ?':8111' : '';
    let host = environment.debug ? 'localhost' : window.location.hostname;

    
    this.wsURI = `${protocol}://${host}${port}/ws`;    
    this.sid = localStorage.getItem("sid");
    protobufConfig.init();
  }

  waitForSocket() : Promise<void> {
    return new Promise<void>((resolve,reject)=>{
      let attempts = 0;
      if(this.isSocketOpen())
        resolve();

      let timeout = setInterval(()=>{
        if (this.isSocketOpen()) {
          clearInterval(timeout);
          resolve();
        }else{
          attempts++;
        }
        if(attempts > 100)
          reject('socket did not open')
      }, 50);
    })
  }

  isSocketOpen(){
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  openWebSocket(onopen) {
    if (this.isSocketOpen()) {
      return;
    }
    
    // exponential backoff strategy       
    this.ws = new WebSocketClient(this.getWsUri(), null, {
      strategy: "exponential",
      randomisationFactor: 0, // defaults to 0, must be between 0 and 1 
      initialDelay: 10,       // defaults to 100 ms 
      maxDelay: 300,          // defaults to 10000 ms 
      factor: 3               // defaults to 2, must be greater than 1 
    });
    this.ws.binaryType = "arraybuffer";
    
    this.ws.onmessage = (event) => { this.socket_onmessage(event) };
    this.ws.onopen = onopen;
    this.ws.onerror = (event) => {
      //console.log('ws onerror', event);
    }
    this.ws.onclose = (event) => {      
      //console.log('ws onclose', event);
      this.ea.publish(new ConnectionClosedEvent());
    }
    // this.ws.onreconnect = (event) => {
      
    // }
  }
  getWsUri() : string {
    let version = localStorage.getItem("app_version");
    var url = new URL(this.wsURI);
    if(this.sid){
      url.searchParams.append('sid', this.sid);
    }
    if(version){
      url.searchParams.append('version', version);
    }
    return url.toString();
  }
  setAuth(sid:string){
    this.authenticated = true;
    this.sid = sid;      
    this.ws.url = this.getWsUri();//update in case of auto reconnection
  }
  removeAuth(){
    this.sid = undefined;
    this.authenticated = false;
  }

  close() {
    this.util.setCurrentTableId(null);
    this.ws.close();
  }

  socket_onmessage(event) {
    if(event.data.constructor.name==='ArrayBuffer'){
      //let buffer = new Uint8Array(event.data);
      let message = protobufConfig.deserialize(event.data, 'DataContainer');
      if(message.pong == null)
      console.log(`${new Date().toLocaleString()} Received: (${event.data.byteLength} bytes)`, message);
      this.ea.publish(new DataMessageEvent(message));
    }else{
      console.error(`event.data unexpected type!`, event.data);
    }    
    
  }

  subscribeToTable(tableId: string) {
    let message = new ClientMessage();
    message.subscribeToTableRequest = new SubscribeToTableRequest();
    message.subscribeToTableRequest.tableId = tableId;
    this.sendMessage(message);
  }
  
  sendMessage(message:ClientMessage) {
    
    if (this.ws) {
      let buffer = protobufConfig.serialize(message, 'ClientMessage');
      // console.log('buffer bytes', buffer.length);
      //this.ws.send(JSON.stringify(message));
      this.ws.send(buffer);
      console.log(`${new Date().toLocaleString()} Sent: (${buffer.byteLength} bytes)`, message);
    } else {
      console.warn('cannot send message as ws is null', message);
    }
  }
  send(data:IClientServerMessage){
    let message = new ClientMessage();    
    message[data.getFieldName()] = data;
    
    this.sendMessage(message);
  }

  loadedSounds:boolean;
  loadSounds() {
    
    if(this.loadedSounds)
      return;
    let soundFiles = [this.audioFiles.bet, this.audioFiles.fold, this.audioFiles.deal, this.audioFiles.check, this.audioFiles.message, this.audioFiles.betShortcut];

    let extension = this.audioSupport();
    if(extension){      
      this.audioFiles.yourturn += extension;
      this.audioFiles.win += extension;
      soundFiles.push(this.audioFiles.yourturn, this.audioFiles.win);
    }
    
    
    for (var i = 0; i < soundFiles.length; i++) {
      var audio = new Audio();      
      audio.src = this.version.cdn + '/' + soundFiles[i];
      this.util.audio.push(audio);
    }
    this.loadedSounds=true;
  }

  audioSupport() {
    var a = document.createElement('audio');
    var ogg = !!(a.canPlayType && a.canPlayType('audio/ogg;"').replace(/no/, ''));
    if (ogg) return 'ogg';
    var mp3 = !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
    if (mp3) return 'mp3';
    else return 0;
  }

  getHttpClient() : HttpClient{
    let client = new HttpClient();
    client.configure(x => {
      if (environment.debug) {        
        x.withBaseUrl(`http://${window.location.hostname}:8111`);
      }
    });
    return client;
  }

  countryCheck(): Promise<boolean> {
    return new Promise(resolve => {      
      this.getHttpClient().get('/api/countryCheck' + window.location.search)
        .then(data => {
          resolve(data.content);
        })
    });
  }

  activate(request:ActivateRequest): Promise<ActivateResult> {
    return new Promise(resolve => {      
      this.getHttpClient().post('/api/activate', request)
        .then(data => {
          resolve(data.content);
        })
    });
  }

  reset(request: ResetRequest): Promise<ResetResult> {
    
    return new Promise(resolve => {
      let result:ResetResult;
      this.getHttpClient().get('api/reset/', request)
        .then(data => {
          Object.setPrototypeOf(data.content, ResetResult.prototype);     
          result = data.content;          
        })
        .catch((reason: any) => {
          result = new ResetResult();
          this.handleApiError(reason, result.errors);
        })
        .then(()=>{
          resolve(result);
        });
    });          
  }

  resetPassword(request: ResetRequest): Promise<ResetResult> {
    
    return new Promise(resolve => {
      let result:ResetResult;
      this.getHttpClient().post('api/reset/', request)
        .then(data => {
          Object.setPrototypeOf(data.content, ResetResult.prototype);     
          result = data.content;          
        })
        .catch((reason: any) => {
          result = new ResetResult();
          this.handleApiError(reason, result.errors);
        })
        .then(()=>{
          resolve(result);
        });
    });          
  }

  handleApiError(reason:any, errors:string[]){
    if (reason instanceof HttpResponseMessage) {
      if(reason.statusCode == 403 && reason.response.indexOf('CSRF') > -1){
        location.reload();
      }else{
        errors.push(`${reason.statusText}: ${reason.response}`);
      }
                  
    } else {
      errors.push(reason);
    }
  }
  
  audioFiles = { 
    bet: 'sounds/bet.wav', 
    fold: 'sounds/fold.wav', 
    deal: 'sounds/cardPlace1.wav', 
    check: 'sounds/check.wav', 
    message: 'sounds/message.wav', 
    betShortcut: 'sounds/chipLay1.wav', 
    yourturn: 'sounds/yourturn.', 
    win: 'sounds/win.', 
  }

}
