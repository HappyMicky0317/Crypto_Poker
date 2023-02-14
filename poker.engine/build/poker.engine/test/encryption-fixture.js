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
const encryption = __importStar(require("./../src/framework/encryption"));
const session_cookie_1 = require("../src/model/session-cookie");
const crypto = require("crypto");
var assert = require('assert');
describe('#encryption-fixture', () => {
    beforeEach(() => {
        process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
        process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC';
    });
    let decryptInternal2 = (text, secret) => {
        var decipher = crypto.createDecipher('aes-256-cbc', secret);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    };
    it('Encryption', () => {
        let encrypted = encryption.encrypt('hello world');
        let decrypted = encryption.decrypt(encrypted);
        assert.equal('hello world', decrypted);
        let pKey = '';
        let secret = '';
        if (pKey) {
            let f1 = encryption.encryptInternal(pKey, secret);
            let f2 = encryption.decryptInternal(f1, secret);
        }
    });
    it('Encryption2', () => {
        let encrypted = encryption.encrypt('hello world');
        let decrypted = encryption.decrypt(encrypted);
        let decrypted2 = encryption.decrypt('85f693a9ea92f42d29b513d9c67a4a26$8a2949a87d4a1443070830adf684b461$5a6fa929fa4bd709804b624a74e52b9aa89b705c0b9b2de30b2878cfd8ef2903');
        assert.equal('hello world', decrypted);
        assert.equal('hello world', decrypted2);
    });
    it('encrypt cookie', () => {
        let timestamp = new Date().toISOString();
        let cookie = new session_cookie_1.SessionCookie("d38c3b43c803f9056f98a5355ed1b84bd0345296", timestamp);
        let encrypted = encryption.encrypt(JSON.stringify(cookie));
        let decrypted = JSON.parse(encryption.decrypt(encrypted));
        assert.equal(decrypted.guid, 'd38c3b43c803f9056f98a5355ed1b84bd0345296');
        assert.equal(timestamp, timestamp);
    });
});
//# sourceMappingURL=encryption-fixture.js.map