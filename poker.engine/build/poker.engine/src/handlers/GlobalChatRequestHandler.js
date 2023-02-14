"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalChatRequestHandler = void 0;
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
var _ = require('lodash');
class GlobalChatRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, broadcastService) {
        super();
        this.dataRepository = dataRepository;
        this.broadcastService = broadcastService;
        this.globalChatMessages = [];
    }
    async init() {
        let data = await this.dataRepository.getChatMessages();
        this.globalChatMessages = data.reverse();
    }
    handleMessage(wsHandle, request) {
        if (request.message)
            this.handleGlobalChat(request.message, wsHandle);
        else if (request.initialData) {
            let dc = new DataContainer_1.DataContainer();
            dc.globalChatResult = new DataContainer_1.GlobalChatResult();
            dc.globalChatResult.initialData = true;
            dc.globalChatResult.messages = _.takeRight(this.globalChatMessages, 100);
            wsHandle.send(dc);
        }
        return Promise.resolve();
    }
    handleGlobalChat(message, wsHandle) {
        let chatMessage = new DataContainer_1.ChatMessage();
        chatMessage.message = message;
        chatMessage.screenName = wsHandle.user.screenName;
        this.dataRepository.saveChat(chatMessage);
        this.globalChatMessages.push(chatMessage);
        let data = new DataContainer_1.DataContainer();
        data.globalChatResult = new DataContainer_1.GlobalChatResult();
        data.globalChatResult.messages.push(chatMessage);
        this.broadcastService.broadcast(data);
    }
}
exports.GlobalChatRequestHandler = GlobalChatRequestHandler;
//# sourceMappingURL=GlobalChatRequestHandler.js.map