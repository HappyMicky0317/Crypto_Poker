import { PokerProcessor } from "./poker-processor";
import { WebSocketHandle } from "./model/WebSocketHandle";
import express = require('express');
var bodyParser = require('body-parser');
import http = require('http');
var expressValidator  = require('express-validator');       // https://npmjs.org/package/express-validator
var cors = require('cors');
var logger = require('log4js').getLogger();
import WebSocket = require('ws');
import { AdminServer } from "./admin/AdminServer";
import { IpLookupResult } from './ip-lookup';
import { IDataRepository } from "./services/documents/IDataRepository";
import { ActivateRequestHandler } from './handlers/ActivateRequestHandler';
import { ResetRequestHandler } from './handlers/ResetRequestHandler';
var crypto = require('crypto');
import fs = require('fs');
import { AdminSecureSocketService, IConnectionToPaymentServer } from './admin/AdminSecureSocketService';
import { BlockCypherPaymentEvent } from "./admin/model/outgoing/BlockCypherPaymentEvent";
import { GameServerProcessor } from "./admin/processor/GameServerProcessor";
import { getUserData } from "./helpers";

export class ApiEndpoints {

    
    app:any;
    server:any;
    wss:any;
    adminServer:AdminServer;    
    activateRequestHandler:ActivateRequestHandler;
    resetRequestHandler:ResetRequestHandler;

    constructor(private dataRepository: IDataRepository, private pokerProcessor: PokerProcessor, private connectionToPaymentServer:IConnectionToPaymentServer, private processor:GameServerProcessor){

    }

    setup(){
        
        let app = express();
        app.use(cors({origin: '*'}));
        app.use(bodyParser.json());
        app.use(expressValidator());// Form validation - This line must be immediately after bodyParser
        this.app = app;
        
        let server = http.createServer(app);
        this.wss = new WebSocket.Server({ 
        server,
        verifyClient: (info, done)=>{ this.pokerProcessor.verifyClient(info, done);}
        });
        this.server = server;

        this.activateRequestHandler = new ActivateRequestHandler(this.dataRepository);
        this.resetRequestHandler = new ResetRequestHandler(this.dataRepository);

        this.setupEndpoints();
        this.listen();
    }
    listen(){
        let server = this.server;
        server.listen(8111, function listening() { logger.info('Listening on %d', server.address().port); });
        this.adminServer = new AdminServer(this.dataRepository, this.pokerProcessor, this.connectionToPaymentServer, this.processor);
        this.adminServer.init();
    }
    setupEndpoints() {
        
        let app = this.app;
        let wss = this.wss;
        let pokerProcessor = this.pokerProcessor;        
        this.dataRepository = this.dataRepository;
        wss.on("headers", (headers: string[], request: http.IncomingMessage) => {  
        let customData = (<any>request).customData;
        let guid:string;
        let loginFailed = customData.sid && !customData.guid;

        if(customData.guid){
            guid = customData.guid;
        }
        else if (!pokerProcessor.getCookie(request.headers, "guid") || loginFailed) {
            guid = crypto.randomBytes(20).toString('hex');    
            request.headers.cookie = `guid=${guid};isNewUser=1`;
        }
        if(guid){
            headers.push(`Set-Cookie: guid=${guid}; Expires=Wed, 12 Sep 2037 07:28:00 GMT`);
        }
        });

        wss.on('connection', async (socket:any, httpReq:any) => {
  
            let handle: WebSocketHandle = await pokerProcessor.connection(socket, httpReq)
            if (handle){                        
              
              logger.info(`${handle.user.screenName}:${handle.id} connected from ${handle.ipAddress} ${handle.country}. app_version:${httpReq.customData.version}  clients.length: ${pokerProcessor.clients.length}`);
              
              
            }
          });

        app.post('/api/activate', async (req:any, res:any) => { this.activateRequestHandler.run(req, res); });
        app.get('/api/reset', async (req:any, res:any) => { this.resetRequestHandler.get(req, res); });
        app.post('/api/reset', async (req:any, res:any) => { this.resetRequestHandler.post(req, res); });
        
        app.get('/api/countryCheck', async (req:any, res:any) => {
            //let ipAddress = '220.253.185.64';
            let ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            //logger.info(`x-forwarded-for:${req.headers['x-forwarded-for']} req.connection.remoteAddress:${req.connection.remoteAddress}`);
            logger.info(`countryCheck from ${ipAddress}`);
            let iplookupResult:IpLookupResult = this.pokerProcessor.ipLookup.lookup(ipAddress);
            let success : boolean = true;
            let country : string = '';
            if (iplookupResult && !req.query.b) {
              success = this.pokerProcessor.isAllowedCountry(iplookupResult.countryCode);
              country = iplookupResult.countryName;
            }
            res.send({ success: success, country: country });
          });
          
          


        // POST method route
        var paymentCallbackIndex: number = 1;
        app.post('/api/payment-callback', (req:any, res:any) => {
            logger.info('payment callback for address guid: ', req.query.guid);
            fs.writeFile(`event_${req.query.guid}_${paymentCallbackIndex}.json`, JSON.stringify(req.body), (err: any) => {
                if (err) { logger.error(err); };
            });
            paymentCallbackIndex++;
            let event = new BlockCypherPaymentEvent();            
            event.tx = req.body;
            event.guid = req.query.guid
            this.connectionToPaymentServer.send(event)
            res.send({
                guid: req.query.guid
            });
            

        });

        
    }
}