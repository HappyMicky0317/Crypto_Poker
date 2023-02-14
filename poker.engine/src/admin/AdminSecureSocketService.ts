import { IWebSocket } from "../model/WebSocketHandle";
import WebSocket = require('ws');
import { IHttpIncomingRequest } from "../poker-processor";
import { Logger, getLogger } from "log4js";
const logger: Logger = getLogger();
import { getIpAddress } from "../helpers";
import { GetDepositAddressResultHandler } from "./handlers/GetDepositAddressResultHandler";
import { IBroadcastService } from "../services/IBroadcastService";
import { AccountFundedHandler } from "./handlers/AccountFundedHandler";
import { IDataRepository } from "../services/documents/IDataRepository";
import { AccountWithdrawlResultHandler } from "./handlers/AccountWithdrawlResultHandler";
import { PaymentServerToGameServerMessage } from "./model/PaymentServerToGameServerMessage";
import { Ping } from "./model/incoming/ping";
import { GameServerToPaymentServerMessage } from "./model/GameServerToPaymentServerMessage";
import { Pong } from "./model/outgoing/pong";
import { CurrencyConfigData } from "./model/incoming/CurrencyConfigData";
import { CurrencyConfigDataHandler } from "./handlers/CurrencyConfigDataHandler";
import { ExchangeRatesService } from "../services/ExchangeRatesService";
import { GetDepositAddressResult } from "./model/incoming/GetDepositAddressResult";
import { AccountFundedResult } from "../model/AccountFundedResult";
import { AccountWithdrawlResultInternal } from "../model/AccountWithdrawlResultInternal";
import { GetPaymentsRequest } from "./model/outgoing/GetPaymentsRequest";
import { GetPaymentsResult } from "./model/incoming/GetPaymentsResult";
import { GetPaymentsResultHandler } from "./handlers/GetPaymentsResultHandler";
import { logToFile } from "../shared-helpers";
import { GameServerProcessor } from "./processor/GameServerProcessor";
import { GameServerProcessorMessage } from "./processor/GameServerProcessorMessage";
import { inspect } from "util";

export class AdminSecureSocketService implements IConnectionToPaymentServer {

    socket: IWebSocket;
    constructor(private broadcastService:IBroadcastService, private dataRepository:IDataRepository, private exchangeRatesService:ExchangeRatesService, private processor:GameServerProcessor){
        
    }

    async onConnection(socket: IWebSocket, httpReq: IHttpIncomingRequest) {
        this.socket = socket;
        logger.info(`admin socket connection from ${getIpAddress(socket, httpReq)}`)
        await this.sendGetPaymentsSince();
        socket.on('message', async (m: any) => {

            logToFile('incoming.log', m)
            try {
                let message:{type:string, data:string} = JSON.parse(m)
                logger.info(`game server received: ${message.type}`)    
                await this.handleMessage(message.type, message.data)
            } catch (e) {
                logger.error(e)
            }
        });        
        
        socket.on('close', () => {
            logger.info("AdminSecureSocketService: close");
        });
        socket.on('error', (e) => {
            logger.info(`AdminSecureSocketService: error ${e}`);            
        });
    }

    async sendGetPaymentsSince(){
        let lastPayment = await this.dataRepository.getLastPaymentUpdate();
        let lastUpdated:Date|null = null;
        if(lastPayment != null){
            lastUpdated = lastPayment.updated;
        }
        logger.info(`LastIncomingPayment:${lastUpdated}`)
        this.send(new GetPaymentsRequest(lastUpdated));
        
    }

    send(message:GameServerToPaymentServerMessage) : void {
        if(this.socket != null && this.socket.readyState == WebSocket.OPEN){
            let data = JSON.stringify({type: message.constructor.name, data: message});
            logToFile('outgoing.log', data)
            this.socket.send(data)
        }else{
            logger.warn(`message '${message.constructor.name}' to payment server not sent as socket is not defined or not open ${inspect(message)}`)
        }        
    }

    async handleMessage(type:string, message:PaymentServerToGameServerMessage){
        if(type === Ping.name){
            this.send(new Pong())
        }
        else if(type === CurrencyConfigData.name){
            await new CurrencyConfigDataHandler(this.dataRepository, this.exchangeRatesService).run(<CurrencyConfigData>message);
        }
        else if(type === GetDepositAddressResult.name){
            new GetDepositAddressResultHandler(this.broadcastService, this.dataRepository).run(<GetDepositAddressResult>message)
        }
        else if(type === AccountFundedResult.name){
            let pMessage = new GameServerProcessorMessage();
            pMessage.accountFunded = <AccountFundedResult>message
            this.processor.sendMessage(pMessage)                  
        }
        else if(type === AccountWithdrawlResultInternal.name){
            new AccountWithdrawlResultHandler(this.broadcastService, this.dataRepository).run(<AccountWithdrawlResultInternal>message)               
        }
        else if(type === GetPaymentsResult.name){
            let pMessage = new GameServerProcessorMessage();
            pMessage.getPaymentsResult = <GetPaymentsResult>message
            this.processor.sendMessage(pMessage)                         
        }
    }
    
     
}

export class IConnectionToPaymentServer {
  onConnection(socket: IWebSocket, httpReq: IHttpIncomingRequest): any {     throw new Error("Method not implemented.");  }
  send(message:GameServerToPaymentServerMessage) : void { throw new Error("Not implemented"); }
}