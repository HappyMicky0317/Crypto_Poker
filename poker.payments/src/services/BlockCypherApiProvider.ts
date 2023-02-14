import { Currency } from "../../../poker.ui/src/shared/Currency";

var bcypher = require('blockcypher');

export interface IBlockCypherApi {
    newTX(tx:any, callback:(err:any, tmptx:any)=>void) : void;
    sendTX(tx:any, callback:(err:any, data:any)=>void) : void;
    addAddrWallet(walletName:string, addresses:string[], callback:(err:any, data:any)=>void) : void;
    delAddrsWallet(walletName:string, addresses:string[], callback:(err:any, data:any)=>void) : void;
    getWallet(walletName:string, callback:(err:any, data:any)=>void) : void;
    createWallet(args:{name:string}, callback:(err:any, data:any)=>void) : void;
    genAddr(args:any, callback:(err:any, data:any)=>void) : void;
    createHook(hook:any, callback:(err:any, data:any)=>void) : void;
    listHooks(callback:(err:any, data:any)=>void) : void;
    delHook(hook:any, callback:(err:any, data:any)=>void) : void;
    getAddrBal(address:string, options:any, callback:(err:any, data:any)=>void) : void;
    getTX(address:string, options:any, callback:(err:any, data:any)=>void) : void;
  }

export interface IBlockCypherApiProvider {
    getbcypher(currency: string): IBlockCypherApi
}

export class BlockCypherApiProvider implements IBlockCypherApiProvider {
    private blockCypherApiKey: string = 'b44865eb69aa4d1abbbffed567e26e75';
    getbcypher(currency: string) {

        let result = this.getCoinChain(currency);

        if (result) {
            return new bcypher(result.coin, result.chain, this.blockCypherApiKey);
        }
        else {
            throw new Error('currency not supported: ' + currency);
        }
    }

    getCoinChain(currency: string): any {
        let result = {
            coin: currency,
            chain: 'main'
        };
        if (currency == Currency.bcy || currency == Currency.beth) {
            result.chain = 'test';
        }
        return result;
    }
}