import dotenv from 'dotenv';
import { encrypt, decrypt } from '../../poker.engine/src/framework/encryption';
const result = dotenv.config();

if (!process.env.POKER_K1) {
    console.log(`process.env.POKER_K1 not defined ${JSON.stringify(result)}`)
    process.exit(1);
}
if (!process.env.POKER_HMAC_KEY) {
    console.log(`process.env.POKER_HMAC_KEY not defined ${JSON.stringify(result)}`)
    process.exit(1); 
}
if(!process.argv[2]){
    console.log(`No input specified!`)
    process.exit(1); 
}


let encrypted = encrypt(process.argv[2])

let decrypted = decrypt(encrypted)
if(decrypted != process.argv[2]){
    console.error(`decrypted does not match input`)
}else{
    console.log(encrypted)
}