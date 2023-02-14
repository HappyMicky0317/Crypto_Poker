import { GlobalUsers } from './../../../poker.ui/src/shared/DataContainer';
import { IDataRepository } from './../services/documents/IDataRepository';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer, GlobalChatResult, ChatMessage } from '../../../poker.ui/src/shared/DataContainer';
import { IBroadcastService } from '../services/IBroadcastService';
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { LoginRequest, LoginResult } from '../../../poker.ui/src/shared/login-request';
import { User } from '../model/User';
var _ = require('lodash');
import bcrypt = require('bcrypt');
import to from '../../../poker.ui/src/shared/CommonHelpers';
import { SessionCookie } from '../model/session-cookie';
import * as handlerUtils from './handler-utils';
import environment from '../environment';
import { toUserStatus, getUserData } from "../helpers";

export class LoginRequestHandler extends AbstractMessageHandler<LoginRequest> {
    
    
    constructor(private dataRepository: IDataRepository, private broadcastService: IBroadcastService) {
        super();
    }

    async handleMessage(wsHandle: WebSocketHandle, request: LoginRequest): Promise<void> {


        let dc = new DataContainer();
        let user = await this.dataRepository.getUserByEmail(request.email);
        dc.loginResult = await this.handleLoginRequest(request, user);
        wsHandle.authenticated = dc.loginResult.success;
        let broadcastData = new DataContainer();
        broadcastData.globalUsers = new GlobalUsers();
        if (wsHandle.authenticated) {
            broadcastData.globalUsers.users.push(toUserStatus(wsHandle, false));//broadcast anon going offline            
            wsHandle.setUser(user);
            dc.user = await getUserData(user, this.dataRepository, false);
            broadcastData.globalUsers.users.push(toUserStatus(wsHandle, true));//broadcast auth'ed user online now
            this.broadcastService.broadcast(broadcastData);
        }
        wsHandle.send(dc);

        return Promise.resolve();
    }

    async handleLoginRequest(request: LoginRequest, user: User) {
        let result = new LoginResult();


        let errorMessage: string;
        if (user && !user.disabled) {
            let [err, res] = await to(bcrypt.compare(request.password, user.password));

            if (res === true && !err) {
                if (user.activated) {
                    result.success = true;
                    result.sid = handlerUtils.getSessionId(user.guid);
                    return result;
                } else {
                    errorMessage = 'Account not activated! Please check your email to confirm registration';
                }
            }
        }
        result.errorMessage = errorMessage || 'Invalid username or password';
        result.success = false;
        return result;
    }


}