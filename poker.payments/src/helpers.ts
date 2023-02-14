import environment from './environment';

export function getAdminEndpoint(protocol:string=null) : string {
    if(!protocol){
        protocol = 'http';
        if(process.env.POKER_BASE_ADDRESS && process.env.POKER_BASE_ADDRESS.includes('https')){
            protocol = 'https';
        }        
    }
    
    let domain = process.env.POKER_ADMIN_URL || 'localhost:8112';    
    let endpoint = `${protocol}://${domain}`;
    return endpoint;
}

export function getAdminEndpointResult(protocol:string=null) : { endpoint: string, headers: any } {    
    let base64Pass = process.env.POKER_ADMIN_BASE64;
    return {
        endpoint: getAdminEndpoint(protocol),
        headers: {
            'Authorization': `Basic ${base64Pass}`
        }
    };
}