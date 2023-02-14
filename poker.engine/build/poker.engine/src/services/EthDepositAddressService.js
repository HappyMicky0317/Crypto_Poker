"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAddr = void 0;
const hdkey = require('ethereumjs-wallet/hdkey');
function genAddr(xpub, index) {
    let account = hdkey.fromExtendedKey(xpub);
    let res1 = account.deriveChild(0).deriveChild(index);
    let wallet = res1.getWallet();
    let address = wallet.getChecksumAddressString();
    return address;
}
exports.genAddr = genAddr;
//# sourceMappingURL=EthDepositAddressService.js.map