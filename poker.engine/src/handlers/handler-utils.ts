import { WebSocketHandle } from "../model/WebSocketHandle";
import { GetAccountSettingsResult } from "../../../poker.ui/src/shared/DataContainer";
import { SessionCookie } from "../model/session-cookie";
import * as encryption from '../framework/encryption';

export function getAccountSettingsResult(wsHandle: WebSocketHandle) {
    let accountSettings = new GetAccountSettingsResult();
    accountSettings.screenName = wsHandle.user.screenName;
    accountSettings.email = wsHandle.user.email;
    accountSettings.muteSounds = wsHandle.user.muteSounds;
    return accountSettings;
}
export function getSessionId(guid:string):string{
    let timestamp = new Date().toISOString();
    let cookie = new SessionCookie(guid, timestamp);
    let encrypted = encryption.encrypt(JSON.stringify(cookie));     
    return encrypted;           
}