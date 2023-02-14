import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { IDataRepository } from '../services/documents/IDataRepository';
import { IBroadcastService } from '../services/IBroadcastService';
import { SetAccountSettingsRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { User } from "../model/User";
import { DataContainer, SetAccountSettingsResult, UserStatus, GlobalUsers } from "../../../poker.ui/src/shared/DataContainer";
import * as handlerUtils from './handler-utils';
import * as userValidation from '../services/user-validation';
import { getGravatar } from "../helpers";

export class SetAccountSettingsRequestHandler extends AbstractMessageHandler<SetAccountSettingsRequest> {
    constructor(private dataRepository: IDataRepository, private broadcastService:IBroadcastService) {
        super();
    }

    async handleMessage(wsHandle: WebSocketHandle, request: SetAccountSettingsRequest): Promise<void> {

        let screenNameValidationResult = await userValidation.validateScreenName(request.screenName, wsHandle.user.guid, this.dataRepository);
        if (!screenNameValidationResult.success) {
            this.sendSetAccountSettingsResult(false, screenNameValidationResult.errorMessage, wsHandle);

        } else {
            let user: User = await this.dataRepository.getUser(wsHandle.user.guid);
            if(user == null){
                user = wsHandle.user;
            }
            let oldName = user.screenName;
            let newScreenName = screenNameValidationResult.screenName;
            user.screenName = newScreenName;
            user.muteSounds = request.muteSounds;
            if(user.email){
                user.gravatar = await getGravatar(user.email);
            }
            
            await this.dataRepository.saveUser(user);
            wsHandle.user = user;

            this.sendSetAccountSettingsResult(true, "", wsHandle);
            this.broadcastService.onScreenNameChanged(wsHandle, oldName, newScreenName);
        }


        return Promise.resolve();
    }
    

    sendSetAccountSettingsResult(success: boolean, errorMessage: string, wsHandle: WebSocketHandle) {

        let data = new DataContainer();
        data.setAccountSettingsResult = new SetAccountSettingsResult(success, errorMessage);
        wsHandle.send(data);
    }
}