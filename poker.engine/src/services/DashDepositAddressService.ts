const { HDPublicKey, Address } = require('@dashevo/dashcore-lib');

export function genAddr(xpub:string, index: number): string {

    let addr = getAddress(xpub, index);
    let child = new Address(addr.publicKey, addr.network);
    //console.log(`${index} address ${child.toString()}`);
    //console.log(`addr.publicKey ${addr.publicKey}`);

    let address = child.toString();
    return address;
  }

  export function getAddress(xpub:string, index: number): any {

    let pubKey = new HDPublicKey(xpub);
    let account1 = pubKey.derive(0);
    let addr = account1.derive(index);
    return addr;
  }