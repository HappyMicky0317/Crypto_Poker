const hdkey = require('ethereumjs-wallet/hdkey')

export function genAddr(xpub:string, index: number): string {

  
  let account = hdkey.fromExtendedKey(xpub)
  let res1 = account.deriveChild(0).deriveChild(index);
  let wallet = res1.getWallet();
  let address = wallet.getChecksumAddressString();
  return address;
  }
