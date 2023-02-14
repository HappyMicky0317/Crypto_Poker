"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptInternal = exports.encryptInternal = exports.decrypt = exports.encrypt = void 0;
const crypto = require("crypto");
const ALGORITHM = 'AES-256-CBC';
const HMAC_ALGORITHM = 'SHA256';
function encrypt(text) {
    return encryptInternal(text, process.env.POKER_K1);
}
exports.encrypt = encrypt;
function decrypt(text) {
    return decryptInternal(text, process.env.POKER_K1);
}
exports.decrypt = decrypt;
function encryptInternal(plain_text, secret) {
    var IV = Buffer.from(crypto.randomBytes(16));
    var cipher_text;
    var hmac;
    var encryptor;
    let KEY = Buffer.from(secret || process.env.POKER_K1, "hex");
    encryptor = crypto.createCipheriv(ALGORITHM, KEY, IV);
    encryptor.setEncoding('hex');
    encryptor.write(plain_text);
    encryptor.end();
    cipher_text = encryptor.read();
    let HMAC_KEY = Buffer.from(process.env.POKER_HMAC_KEY, "hex");
    hmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_KEY);
    hmac.update(cipher_text);
    hmac.update(IV.toString('hex'));
    return cipher_text + "$" + IV.toString('hex') + "$" + hmac.digest('hex');
}
exports.encryptInternal = encryptInternal;
;
function decryptInternal(cipher_text, secret) {
    let KEY = Buffer.from(secret || process.env.POKER_K1, "hex");
    var cipher_blob = cipher_text.split("$");
    var ct = cipher_blob[0];
    var IV = Buffer.from(cipher_blob[1], 'hex');
    var hmac = cipher_blob[2];
    var decryptor;
    let HMAC_KEY = Buffer.from(process.env.POKER_HMAC_KEY, "hex");
    const chmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_KEY);
    chmac.update(ct);
    chmac.update(IV.toString('hex'));
    if (!constant_time_compare(chmac.digest('hex'), hmac)) {
        console.log("Encrypted Blob has been tampered with...");
        return null;
    }
    decryptor = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    var decryptedText = decryptor.update(ct, 'hex', 'utf8');
    return decryptedText + decryptor.final('utf-8');
}
exports.decryptInternal = decryptInternal;
;
var constant_time_compare = function (val1, val2) {
    var sentinel;
    if (val1.length !== val2.length) {
        return false;
    }
    for (var i = 0; i <= (val1.length - 1); i++) {
        sentinel |= val1.charCodeAt(i) ^ val2.charCodeAt(i);
    }
    return sentinel === 0;
};
//# sourceMappingURL=encryption.js.map