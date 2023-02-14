import { MailchimpService } from "../src/services/MailchimpService";

var assert = require('assert');

const util = require('util');

describe('experimental-fixture', () => {


  it.skip('test1', async () => {
    let f1 = parseFloat('200000000000');
    console.log('f1', f1)
  });

  it.skip('addSubscribers', async () => {
    let list: string[] = [
      'foo@bar.com'
    ]
    for (let sub of list) {
      await new MailchimpService().addSubscriber(sub)
    }
  });

});


