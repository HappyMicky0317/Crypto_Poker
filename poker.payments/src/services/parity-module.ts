import { Http } from "../../../poker.engine/src/services/Http";

const http = new Http();

export class IParityModule {
    parityIp: string;
    async nextNonce(address: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
    async eth_getTransactionReceipt(hash: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
}

export class ParityModule implements IParityModule {
    parityIp: string;

    async nextNonce(address: string): Promise<string> {
        //let post_data = { "method": "parity_nextNonce", "params": [address], "id": 1, "jsonrpc": "2.0" };
        let post_data = {"jsonrpc":"2.0","method":"eth_getTransactionCount","params": [address,"pending"],"id":1}
        let data:any = await this.post(post_data);
        if (data) {
            if(data.error)
                throw new Error(JSON.stringify(data.error));
            return data.result;
        }        
    }

    async eth_getTransactionReceipt(hash: string): Promise<any> {        
        let post_data = {"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params": [hash],"id":1}
        let data:any = await this.post(post_data);
        if (data) {
            if(data.error)
                throw new Error(JSON.stringify(data.error));
            return data.result;
        }        
    }

    post(post_data: any): Promise<any> {        
        let url = `https://mainnet.infura.io/v3/6a6f87faddeb42c59da65bb2e8193be8`;        
        var options = {            
            uri: url,
            body: post_data,
            json: true // Automatically stringifies the body to JSON
        };

        return http.post(url, options);
    }
}