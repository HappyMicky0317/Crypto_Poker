"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpLookup = void 0;
var fs = require('fs');
var logger = require('log4js').getLogger();
var path = require("path");
var maxmind = require('maxmind');
class IpLookup {
    constructor() {
        let ipLookupDb = path.resolve('./GeoLite2-Country.mmdb');
        if (fs.existsSync(ipLookupDb)) {
            this.ipLookup = maxmind.openSync(ipLookupDb);
        }
        else {
            logger.info(`could not find ip lookup database file: ${ipLookupDb}`);
        }
    }
    lookup(ipAddress) {
        if (this.ipLookup && ipAddress && ipAddress.length > 3) {
            let iplookupResult = this.ipLookup.get(ipAddress);
            if (iplookupResult && iplookupResult.country) {
                return {
                    countryCode: iplookupResult.country.iso_code.toLowerCase(),
                    countryName: iplookupResult.country.names["en"]
                };
            }
        }
        return null;
    }
}
exports.IpLookup = IpLookup;
//# sourceMappingURL=ip-lookup.js.map