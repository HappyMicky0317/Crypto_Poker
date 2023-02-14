import environment from '../environment';
import WebSocket = require('ws');
import { Logger, getLogger } from "log4js";
import { IConnectionToGameServer } from '../services/ConnectionToGameServer';
import { PaymentServerToGameServerMessage } from '../../../poker.engine/src/admin/model/PaymentServerToGameServerMessage';
import { GameServerToPaymentServerMessage } from '../../../poker.engine/src/admin/model/GameServerToPaymentServerMessage';
import { Ping } from '../../../poker.engine/src/admin/model/incoming/ping';
import { Pong } from '../../../poker.engine/src/admin/model/outgoing/pong';
import { SendCurrencyConfigHandler } from './handlers/SendCurrencyConfigHandler';
import { PaymentProcessor } from '../processor/PaymentProcessor';
import { PaymentProcessorMessage } from '../processor/PaymentProcessorMessage';
import { GetDepositAddressRequest } from '../../../poker.engine/src/admin/model/outgoing/GetDepositAddressRequest';
import { CheckPaymentsTrigger } from '../../../poker.engine/src/admin/model/outgoing/CheckPaymentsTrigger';
import { DepositAddressTrigger } from '../../../poker.engine/src/admin/model/outgoing/DepositAddressTrigger';
import { BlockCypherPaymentEvent } from '../../../poker.engine/src/admin/model/outgoing/BlockCypherPaymentEvent';
import { GetPaymentsRequest } from '../../../poker.engine/src/admin/model/outgoing/GetPaymentsRequest';
const logger: Logger = getLogger();
import { getAdminEndpoint, getAdminEndpointResult } from '../helpers';
import { BlockCypherPaymentEventHandler } from './handlers/BlockCypherPaymentEventHandler';
import { GetPaymentsRequestHandler } from './handlers/GetPaymentsRequestHandler';
import { logToFile } from '../../../poker.engine/src/shared-helpers';

export class SocketConnection implements IConnectionToGameServer {
    
    
    timer: any;
    socket: WebSocket | undefined;
    gotPong:boolean;
    init() {        
        this.connect()
    }


    constructor(private processor:PaymentProcessor, private onOpen:()=>void, private blockCypherPaymentEventHandler:BlockCypherPaymentEventHandler
    , private getPaymentsRequestHandler:GetPaymentsRequestHandler){        
    }
    
    

    connect() {        
        this.gotPong = true;
        let protocol = 'ws';
        if(process.env.POKER_BASE_ADDRESS && process.env.POKER_BASE_ADDRESS.includes('https')){
            protocol = 'wss';
        }
            
        let connectionConfig = getAdminEndpointResult(protocol);
        let endpoint = connectionConfig.endpoint + '/api/ws';
        logger.info(`endpoint ${endpoint}`)
        this.socket = new WebSocket(endpoint, {
            headers: connectionConfig.headers
        });
        this.socket.on('open', async ()=>{
            this.startPingTimer();
            this.onOpen()
        });

        this.socket.on('message', (m: any) => {
            
            logToFile('incoming.log', m)
            let message:GameServerToPaymentServerMessage
            try {
                let message:{type:string, data:string} = JSON.parse(m)
                logger.info(`payment processor received: ${message.type}`)
                this.handleMessage(message.type, message.data)
            } catch (e) {
                logger.error(e)
            }
        });

        this.socket.on('close', () => { this. onClose(); });
        this.socket.on('error', (e: any) => {
            logger.info(`SocketConnection: error ${e}`);
        });
    }

    send(message:PaymentServerToGameServerMessage){
        
        if(this.socket != null && this.socket.readyState == WebSocket.OPEN){
            let data = JSON.stringify({type: message.constructor.name, data: message});
            logToFile('outgoing.log', data)
            this.socket.send(data)
        }        
    }

    handleMessage(type:string, message:PaymentServerToGameServerMessage){
        if(type === Pong.name){
            this.gotPong = true;
        }else if(type === DepositAddressTrigger.name){            
            let ppMessage = new PaymentProcessorMessage();
            ppMessage.checkDepositAddresses = <DepositAddressTrigger>message;
            this.processor.sendMessage(ppMessage)            
        }else if(type === CheckPaymentsTrigger.name){            
            this.processor.sendCheckWithdrawls();
        }else if(type === BlockCypherPaymentEvent.name){
            this.blockCypherPaymentEventHandler.run(<BlockCypherPaymentEvent>message)
        }else if(type === GetPaymentsRequest.name){
            this.getPaymentsRequestHandler.run(<GetPaymentsRequest>message)
        }
    }

    onClose(){
        logger.info("SocketConnection: close");
        clearInterval(this.timer);
        this.socket = undefined;
        this.timer = setTimeout(() => {
            logger.info('reconnecting...')
            this.connect();
        }, 20000)
    }

    startPingTimer(){
        this.timer = setInterval(() => {            
            
            if(this.socket){
                if(!this.gotPong){
                    logger.info(`terminating socket did not receive pong`)
                    this.socket.terminate();
                }else{
                    this.gotPong = false;
                    this.send(new Ping());
                }
                
            }
                
        }, 30000)
    }

    

}