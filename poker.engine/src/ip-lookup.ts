var fs = require('fs');
var logger = require('log4js').getLogger();
var path = require("path");
var maxmind = require('maxmind');

export class IpLookup {
    ipLookup:any;
    
    constructor() {
        let ipLookupDb = path.resolve('./GeoLite2-Country.mmdb');
        if (fs.existsSync(ipLookupDb)) {
            this.ipLookup = maxmind.openSync(ipLookupDb);
        } else {
            logger.info(`could not find ip lookup database file: ${ipLookupDb}`)
        }
        
    }
   
    lookup(ipAddress:string) : IpLookupResult {
        if(this.ipLookup && ipAddress && ipAddress.length > 3){
            let iplookupResult = this.ipLookup.get(ipAddress);                   
            if(iplookupResult && iplookupResult.country){
              return { 
                  countryCode: iplookupResult.country.iso_code.toLowerCase(),
                  countryName: iplookupResult.country.names["en"]
                }              
            }
          }
          return null;
    }
}

export interface IpLookupResult{
    countryCode:string;
    countryName:string;
}