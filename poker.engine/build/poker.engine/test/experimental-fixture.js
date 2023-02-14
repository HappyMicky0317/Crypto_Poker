"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MailchimpService_1 = require("../src/services/MailchimpService");
var assert = require('assert');
const util = require('util');
describe('experimental-fixture', () => {
    it.skip('test1', async () => {
        let f1 = parseFloat('200000000000');
        console.log('f1', f1);
    });
    it.skip('addSubscribers', async () => {
        let list = [
            'foo@bar.com'
        ];
        for (let sub of list) {
            await new MailchimpService_1.MailchimpService().addSubscriber(sub);
        }
    });
});
//# sourceMappingURL=experimental-fixture.js.map