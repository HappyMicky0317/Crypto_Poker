import * as encryption from './../src/framework/encryption';
import { SessionCookie } from '../src/model/session-cookie';
import crypto = require('crypto');
var assert = require('assert');


describe('#encryption-fixture', ()=> {

    
    beforeEach( () => {
        process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
        process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC';
    });

   let decryptInternal2 = (text: string, secret: string)=> {
        var decipher = crypto.createDecipher('aes-256-cbc', secret)
        var dec = decipher.update(text, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
     }

    it('Encryption', () =>{                
        let encrypted = encryption.encrypt('hello world');                
        //console.log('encrypted', encryption.encrypt('zzzzzz'));         
        
        let decrypted = encryption.decrypt(encrypted);
        assert.equal('hello world', decrypted);

        let pKey = '';
        let secret = '';
        if(pKey){
            let f1 = encryption.encryptInternal(pKey, secret);                     
            let f2 = encryption.decryptInternal(f1, secret);            
        }
        
    });

    it('Encryption2', () =>{                
        let encrypted = encryption.encrypt('hello world');                
        let decrypted = encryption.decrypt(encrypted);                                            
        let decrypted2 = encryption.decrypt('85f693a9ea92f42d29b513d9c67a4a26$8a2949a87d4a1443070830adf684b461$5a6fa929fa4bd709804b624a74e52b9aa89b705c0b9b2de30b2878cfd8ef2903');
        assert.equal('hello world', decrypted);
        assert.equal('hello world', decrypted2);
        
    });

    it('encrypt cookie', () =>{        
        let timestamp = new Date().toISOString();
        let cookie = new SessionCookie("d38c3b43c803f9056f98a5355ed1b84bd0345296", timestamp);
        let encrypted = encryption.encrypt(JSON.stringify(cookie));                
        //console.log(encrypted);
        
        let decrypted = <SessionCookie>JSON.parse(encryption.decrypt(encrypted));
        assert.equal(decrypted.guid, 'd38c3b43c803f9056f98a5355ed1b84bd0345296');
        assert.equal(timestamp, timestamp);        
        
        
    });
    

})