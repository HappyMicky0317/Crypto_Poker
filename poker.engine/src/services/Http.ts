import { IHttp, IHttpOptions } from "./IHttp";
import http, { AxiosRequestConfig } from 'axios';

export class Http implements IHttp {
    get(uri: string, options?: IHttpOptions): Promise<any> {
        const { stack } = new Error();
        const config:AxiosRequestConfig = {
            headers: options?.headers,
            timeout: options?.timeout
        };
        return http.get(uri, config).then((result)=>{            
            return result.data;
        }).catch(error => {
            error.stack = stack;
            throw error;
        });

    };

    post(uri: string, options: IHttpOptions): Promise<any> {
        const { stack } = new Error();
        const config:AxiosRequestConfig = {
            headers: options.headers,
            timeout: options.timeout
        };
        
        return http.post(uri, options.body, config).then((result)=>{
            //console.log('result', result)
            return result.data;
        })
        .catch(error => {
            error.stack = stack;
            throw error;
        });

    };
}