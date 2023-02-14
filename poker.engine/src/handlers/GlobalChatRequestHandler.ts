import { IDataRepository } from './../services/documents/IDataRepository';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer, GlobalChatResult, ChatMessage } from '../../../poker.ui/src/shared/DataContainer';
import { IBroadcastService } from '../services/IBroadcastService';
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { GlobalChatRequest } from '../../../poker.ui/src/shared/ClientMessage';
var _ = require('lodash');

export class GlobalChatRequestHandler extends AbstractMessageHandler<GlobalChatRequest> {
    globalChatMessages: ChatMessage[] = [];
    
    constructor(private dataRepository:IDataRepository, private broadcastService:IBroadcastService) {
        super();
    }

    async init() : Promise<void>{
        let data:ChatMessage[] = await this.dataRepository.getChatMessages();
        this.globalChatMessages=data.reverse();
    }

    handleMessage(wsHandle: WebSocketHandle, request: GlobalChatRequest): Promise<any> {
        if (request.message)
            this.handleGlobalChat(request.message, wsHandle);
        else if (request.initialData) {
            let dc = new DataContainer();
            dc.globalChatResult = new GlobalChatResult();
            dc.globalChatResult.initialData = true;
            dc.globalChatResult.messages = _.takeRight(this.globalChatMessages, 100);
            wsHandle.send(dc);
        }

        return Promise.resolve();
    }

    handleGlobalChat(message: string, wsHandle: WebSocketHandle) {
        let chatMessage = new ChatMessage();
        chatMessage.message = message;
        chatMessage.screenName = wsHandle.user.screenName;
        this.dataRepository.saveChat(chatMessage);
        this.globalChatMessages.push(chatMessage);
        let data = new DataContainer();
        data.globalChatResult = new GlobalChatResult();
        data.globalChatResult.messages.push(chatMessage);
        this.broadcastService.broadcast(data);
    }
}