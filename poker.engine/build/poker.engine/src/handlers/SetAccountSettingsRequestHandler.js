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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetAccountSettingsRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const userValidation = __importStar(require("../services/user-validation"));
const helpers_1 = require("../helpers");
class SetAccountSettingsRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository, broadcastService) {
        super();
        this.dataRepository = dataRepository;
        this.broadcastService = broadcastService;
    }
    async handleMessage(wsHandle, request) {
        let screenNameValidationResult = await userValidation.validateScreenName(request.screenName, wsHandle.user.guid, this.dataRepository);
        if (!screenNameValidationResult.success) {
            this.sendSetAccountSettingsResult(false, screenNameValidationResult.errorMessage, wsHandle);
        }
        else {
            let user = await this.dataRepository.getUser(wsHandle.user.guid);
            if (user == null) {
                user = wsHandle.user;
            }
            let oldName = user.screenName;
            let newScreenName = screenNameValidationResult.screenName;
            user.screenName = newScreenName;
            user.muteSounds = request.muteSounds;
            if (user.email) {
                user.gravatar = await (0, helpers_1.getGravatar)(user.email);
            }
            await this.dataRepository.saveUser(user);
            wsHandle.user = user;
            this.sendSetAccountSettingsResult(true, "", wsHandle);
            this.broadcastService.onScreenNameChanged(wsHandle, oldName, newScreenName);
        }
        return Promise.resolve();
    }
    sendSetAccountSettingsResult(success, errorMessage, wsHandle) {
        let data = new DataContainer_1.DataContainer();
        data.setAccountSettingsResult = new DataContainer_1.SetAccountSettingsResult(success, errorMessage);
        wsHandle.send(data);
    }
}
exports.SetAccountSettingsRequestHandler = SetAccountSettingsRequestHandler;
//# sourceMappingURL=SetAccountSettingsRequestHandler.js.map