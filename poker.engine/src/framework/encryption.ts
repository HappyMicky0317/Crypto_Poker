import crypto = require('crypto');
const ALGORITHM = 'AES-256-CBC';
const HMAC_ALGORITHM = 'SHA256';
//see http://www.levigross.com/2014/03/30/how-to-write-an-encrypt-and-decrypt-api-for-data-at-rest-in-nodejs/
export function encrypt(text: string) {
    return encryptInternal(text, process.env.POKER_K1);
}

export function decrypt(text: string) {
    return decryptInternal(text, process.env.POKER_K1);
}

export function encryptInternal (plain_text:string, secret:string) {    
    var IV = Buffer.from(crypto.randomBytes(16)); // ensure that the IV (initialization vector) is random    
    var cipher_text;
    var hmac;
    var encryptor;
    let KEY = Buffer.from(secret || process.env.POKER_K1, "hex")
    encryptor = crypto.createCipheriv(ALGORITHM, KEY, IV);
    encryptor.setEncoding('hex');
    encryptor.write(plain_text);
    encryptor.end();

    cipher_text = encryptor.read();
    let HMAC_KEY = Buffer.from(process.env.POKER_HMAC_KEY, "hex")
    hmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_KEY);
    hmac.update(cipher_text);
    hmac.update(IV.toString('hex')); // ensure that both the IV and the cipher-text is protected by the HMAC

    // The IV isn't a secret so it can be stored along side everything else
    return cipher_text + "$" + IV.toString('hex') + "$" + hmac.digest('hex') 

};

export function decryptInternal(cipher_text:string, secret:string) {
    let KEY = Buffer.from(secret || process.env.POKER_K1, "hex")
    var cipher_blob = cipher_text.split("$");
    var ct = cipher_blob[0];
    var IV = Buffer.from(cipher_blob[1], 'hex');
    var hmac = cipher_blob[2];
    var decryptor;
    
    let HMAC_KEY = Buffer.from(process.env.POKER_HMAC_KEY, "hex")
    const chmac = crypto.createHmac(HMAC_ALGORITHM, HMAC_KEY);
    chmac.update(ct);
    chmac.update(IV.toString('hex'));

    if (!constant_time_compare(chmac.digest('hex'), hmac)) {
        console.log("Encrypted Blob has been tampered with...");
        return null;
    }

    decryptor = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    var decryptedText =decryptor.update(ct, 'hex', 'utf8');
    return decryptedText + decryptor.final('utf-8');


};

var constant_time_compare = function (val1:any, val2:any) {
    var sentinel:any;

    if (val1.length !== val2.length) {
        return false;
    }


    for (var i = 0; i <= (val1.length - 1); i++) {
        sentinel |= val1.charCodeAt(i) ^ val2.charCodeAt(i);
    }

    return sentinel === 0
};