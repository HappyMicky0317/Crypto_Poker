"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRequestHandler = void 0;
const DataContainer_1 = require("./../../../poker.ui/src/shared/DataContainer");
const DataContainer_2 = require("../../../poker.ui/src/shared/DataContainer");
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const login_request_1 = require("../../../poker.ui/src/shared/login-request");
var _ = require('lodash');
const bcrypt = require("bcrypt");
const CommonHelpers_1 = __importDefault(require("../../../poker.ui/src/shared/CommonHelpers"));
const handlerUtils = __importStar(require("./handler-utils"));
const helpers_1 = require("../helpers");
class LoginRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, broadcastService) {
        super();
        this.dataRepository = dataRepository;
        this.broadcastService = broadcastService;
    }
    async handleMessage(wsHandle, request) {
        let dc = new DataContainer_2.DataContainer();
        let user = await this.dataRepository.getUserByEmail(request.email);
        dc.loginResult = await this.handleLoginRequest(request, user);
        wsHandle.authenticated = dc.loginResult.success;
        let broadcastData = new DataContainer_2.DataContainer();
        broadcastData.globalUsers = new DataContainer_1.GlobalUsers();
        if (wsHandle.authenticated) {
            broadcastData.globalUsers.users.push((0, helpers_1.toUserStatus)(wsHandle, false));
            wsHandle.setUser(user);
            dc.user = await (0, helpers_1.getUserData)(user, this.dataRepository, false);
            broadcastData.globalUsers.users.push((0, helpers_1.toUserStatus)(wsHandle, true));
            this.broadcastService.broadcast(broadcastData);
        }
        wsHandle.send(dc);
        return Promise.resolve();
    }
    async handleLoginRequest(request, user) {
        let result = new login_request_1.LoginResult();
        let errorMessage;
        if (user && !user.disabled) {
            let [err, res] = await (0, CommonHelpers_1.default)(bcrypt.compare(request.password, user.password));
            if (res === true && !err) {
                if (user.activated) {
                    result.success = true;
                    result.sid = handlerUtils.getSessionId(user.guid);
                    return result;
                }
                else {
                    errorMessage = 'Account not activated! Please check your email to confirm registration';
                }
            }
        }
        result.errorMessage = errorMessage || 'Invalid username or password';
        result.success = false;
        return result;
    }
}
exports.LoginRequestHandler = LoginRequestHandler;
//# sourceMappingURL=LoginRequestHandler.js.map