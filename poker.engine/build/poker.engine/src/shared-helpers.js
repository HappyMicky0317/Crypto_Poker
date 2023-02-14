"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = exports.sleep = exports.logToFile = exports.randomBytesHex = exports.to = exports.SharedHelpers = void 0;
var crypto = require('crypto');
const Currency_1 = require("../../poker.ui/src/shared/Currency");
const decimal_1 = require("./../../poker.ui/src/shared/decimal");
const fs = require("fs");
const os = require("os");
class SharedHelpers {
    static ensureDate(date) {
        if (typeof date === 'string') {
            return new Date(date);
        }
        return date;
    }
    static getCurrency(currencyConfig) {
        if (SharedHelpers.Erc20RegExp.exec(currencyConfig.contractAddress)) {
            return Currency_1.Currency.eth;
        }
        return currencyConfig.name;
    }
    static ensureGteLteDates(obj) {
        if (obj.$gte) {
            obj.$gte = this.ensureDate(obj.$gte);
        }
        else if (obj.$lte) {
            obj.$lte = this.ensureDate(obj.$lte);
        }
        return obj;
    }
    static getPaymentQueryArgs(args) {
        let mongoArgs = {
            $and: []
        };
        if (args.guid) {
            mongoArgs.$and.push({ "guid": args.guid });
        }
        if (args.currency) {
            mongoArgs.$and.push({ "currency": args.currency });
        }
        if (args.type) {
            mongoArgs.$and.push({ "type": args.type });
        }
        if (args.status) {
            mongoArgs.$and.push({ "status": args.status });
        }
        if (args.timestamp) {
            mongoArgs.$and.push({ "timestamp": SharedHelpers.ensureGteLteDates(args.timestamp) });
        }
        if (args.updated) {
            mongoArgs.$and.push({ "updated": SharedHelpers.ensureGteLteDates(args.updated) });
        }
        if (args.screenName) {
            mongoArgs.$and.push({ 'screenName': { '$regex': args.screenName, '$options': 'i' }, });
        }
        if (!mongoArgs.$and.length) {
            return {};
        }
        return mongoArgs;
    }
    static convertToLocalAmount(currency, amount) {
        if (currency == Currency_1.Currency.eth || currency == Currency_1.Currency.beth) {
            return SharedHelpers.convertToDeciGwei(amount);
        }
        return amount;
    }
    static convertToDeciGwei(amount) {
        let result = new decimal_1.Decimal(amount + '').dividedBy(this.ethDeciGweiDivisor);
        return result.toString();
    }
    static convertToNativeAmount(currency, amount) {
        if (currency == Currency_1.Currency.eth || currency == Currency_1.Currency.beth) {
            return SharedHelpers.convertToWei(amount);
        }
        return amount;
    }
    static convertToWei(amount) {
        let result = new decimal_1.Decimal(amount + '').mul(this.ethDeciGweiDivisor);
        return result.toNumber();
    }
    static fromWei(amount) {
        let result = new decimal_1.Decimal(amount + '').dividedBy(this.ethWeiEtherDivisor);
        return result.toNumber();
    }
}
exports.SharedHelpers = SharedHelpers;
SharedHelpers.Erc20RegExp = RegExp(/0x.*/);
SharedHelpers.ethDeciGweiDivisor = new decimal_1.Decimal('10000000000');
SharedHelpers.ethWeiEtherDivisor = new decimal_1.Decimal('1000000000000000000');
function to(promise) {
    return promise.then(data => {
        return [null, data];
    })
        .catch(err => [err]);
}
exports.to = to;
function randomBytesHex() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(20, (err, buf) => {
            if (err)
                reject(err);
            else
                resolve(buf.toString('hex'));
        });
    });
}
exports.randomBytesHex = randomBytesHex;
function logToFile(logfile, text) {
    let line = `${new Date().toLocaleString()} ${text}${os.EOL}`;
    fs.writeFile(logfile, line, { 'flag': 'a' }, (err) => {
        if (err) {
            console.error(err);
        }
        ;
    });
}
exports.logToFile = logToFile;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function escapeHtml(html) {
    return html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
exports.escapeHtml = escapeHtml;
//# sourceMappingURL=shared-helpers.js.map