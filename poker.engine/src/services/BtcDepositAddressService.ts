const b58 = require('bs58check');
import bjs = require("bitcoinjs-lib");
const bip32 = require('bip32')

export function genAddr(xpub:string, index: number): string {

    
    xpub = ypubToXpub(xpub);
    const network = bjs.networks.bitcoin; 

    var payment = bjs.payments.p2sh({ 
      redeem: bjs.payments.p2wpkh({ 
          pubkey: bip32.fromBase58(xpub, network).derive(0).derive(index).publicKey 
      })
    })
    const address = payment.address;
    return address;

  }

  function ypubToXpub(ypub:string) {
    var data = b58.decode(ypub)
    data = data.slice(4)
    data = Buffer.concat([Buffer.from('0488b21e','hex'), data])
    return b58.encode(data)
  }