"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiEndpoints = void 0;
const express = require("express");
var bodyParser = require('body-parser');
const http = require("http");
var expressValidator = require('express-validator');
var cors = require('cors');
var logger = require('log4js').getLogger();
const WebSocket = require("ws");
const AdminServer_1 = require("./admin/AdminServer");
const ActivateRequestHandler_1 = require("./handlers/ActivateRequestHandler");
const ResetRequestHandler_1 = require("./handlers/ResetRequestHandler");
var crypto = require('crypto');
const fs = require("fs");
const BlockCypherPaymentEvent_1 = require("./admin/model/outgoing/BlockCypherPaymentEvent");
class ApiEndpoints {
    constructor(dataRepository, pokerProcessor, connectionToPaymentServer, processor) {
        this.dataRepository = dataRepository;
        this.pokerProcessor = pokerProcessor;
        this.connectionToPaymentServer = connectionToPaymentServer;
        this.processor = processor;
    }
    setup() {
        let app = express();
        app.use(cors({ origin: '*' }));
        app.use(bodyParser.json());
        app.use(expressValidator());
        this.app = app;
        let server = http.createServer(app);
        this.wss = new WebSocket.Server({
            server,
            verifyClient: (info, done) => { this.pokerProcessor.verifyClient(info, done); }
        });
        this.server = server;
        this.activateRequestHandler = new ActivateRequestHandler_1.ActivateRequestHandler(this.dataRepository);
        this.resetRequestHandler = new ResetRequestHandler_1.ResetRequestHandler(this.dataRepository);
        this.setupEndpoints();
        this.listen();
    }
    listen() {
        let server = this.server;
        server.listen(8111, function listening() { logger.info('Listening on %d', server.address().port); });
        this.adminServer = new AdminServer_1.AdminServer(this.dataRepository, this.pokerProcessor, this.connectionToPaymentServer, this.processor);
        this.adminServer.init();
    }
    setupEndpoints() {
        let app = this.app;
        let wss = this.wss;
        let pokerProcessor = this.pokerProcessor;
        this.dataRepository = this.dataRepository;
        wss.on("headers", (headers, request) => {
            let customData = request.customData;
            let guid;
            let loginFailed = customData.sid && !customData.guid;
            if (customData.guid) {
                guid = customData.guid;
            }
            else if (!pokerProcessor.getCookie(request.headers, "guid") || loginFailed) {
                guid = crypto.randomBytes(20).toString('hex');
                request.headers.cookie = `guid=${guid};isNewUser=1`;
            }
            if (guid) {
                headers.push(`Set-Cookie: guid=${guid}; Expires=Wed, 12 Sep 2037 07:28:00 GMT`);
            }
        });
        wss.on('connection', async (socket, httpReq) => {
            let handle = await pokerProcessor.connection(socket, httpReq);
            if (handle) {
                logger.info(`${handle.user.screenName}:${handle.id} connected from ${handle.ipAddress} ${handle.country}. app_version:${httpReq.customData.version}  clients.length: ${pokerProcessor.clients.length}`);
            }
        });
        app.post('/api/activate', async (req, res) => { this.activateRequestHandler.run(req, res); });
        app.get('/api/reset', async (req, res) => { this.resetRequestHandler.get(req, res); });
        app.post('/api/reset', async (req, res) => { this.resetRequestHandler.post(req, res); });
        app.get('/api/countryCheck', async (req, res) => {
            let ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            logger.info(`countryCheck from ${ipAddress}`);
            let iplookupResult = this.pokerProcessor.ipLookup.lookup(ipAddress);
            let success = true;
            let country = '';
            if (iplookupResult && !req.query.b) {
                success = this.pokerProcessor.isAllowedCountry(iplookupResult.countryCode);
                country = iplookupResult.countryName;
            }
            res.send({ success: success, country: country });
        });
        var paymentCallbackIndex = 1;
        app.post('/api/payment-callback', (req, res) => {
            logger.info('payment callback for address guid: ', req.query.guid);
            fs.writeFile(`event_${req.query.guid}_${paymentCallbackIndex}.json`, JSON.stringify(req.body), (err) => {
                if (err) {
                    logger.error(err);
                }
                ;
            });
            paymentCallbackIndex++;
            let event = new BlockCypherPaymentEvent_1.BlockCypherPaymentEvent();
            event.tx = req.body;
            event.guid = req.query.guid;
            this.connectionToPaymentServer.send(event);
            res.send({
                guid: req.query.guid
            });
        });
    }
}
exports.ApiEndpoints = ApiEndpoints;
//# sourceMappingURL=ApiEndpoints.js.map