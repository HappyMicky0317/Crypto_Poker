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
exports.getSessionId = exports.getAccountSettingsResult = void 0;
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const session_cookie_1 = require("../model/session-cookie");
const encryption = __importStar(require("../framework/encryption"));
function getAccountSettingsResult(wsHandle) {
    let accountSettings = new DataContainer_1.GetAccountSettingsResult();
    accountSettings.screenName = wsHandle.user.screenName;
    accountSettings.email = wsHandle.user.email;
    accountSettings.muteSounds = wsHandle.user.muteSounds;
    return accountSettings;
}
exports.getAccountSettingsResult = getAccountSettingsResult;
function getSessionId(guid) {
    let timestamp = new Date().toISOString();
    let cookie = new session_cookie_1.SessionCookie(guid, timestamp);
    let encrypted = encryption.encrypt(JSON.stringify(cookie));
    return encrypted;
}
exports.getSessionId = getSessionId;
//# sourceMappingURL=handler-utils.js.map