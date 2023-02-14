export class IHttp {
    get(uri: string, options?: IHttpOptions): Promise<any> { throw new Error("Not implemented");};  
}

export interface IHttpOptions {
    body?: {}
    headers?: { }
    timeout?:number
}

