import * as assert from 'assert';
var clean = require('mongo-clean');
import { SecureDataRepository } from '../../src/repository/SecureDataRepository';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { PaymentStatus } from '../../../poker.ui/src/shared/PaymentStatus';

describe('SecureDataRepositoryFixture', () => {

    let dbName: string = 'pokerPaymentServerUnitTests';
    let repository: SecureDataRepository;
    let setup: Promise<any>;
    beforeEach(() => {
        repository = new SecureDataRepository(dbName);
        setup = repository.init()
            .then(() => cleanDb(repository.db))

    });

    it('getPaymentsUpdatedAfter', async () => {

        let now = new Date();
        await setup
        await repository.savePayment( <any>{ guid: '1', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*5) });//updated 5 min ago
        await repository.savePayment( <any>{ guid: '2', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*60) });//updated 60 min ago
        await repository.savePayment( <any>{ guid: '3', type: PaymentType.incoming, updated: new Date(now.getTime()-1000*60*15) });//updated 15 min ago
        await repository.savePayment( <any>{ guid: '4', type: PaymentType.outgoing, updated: new Date(now.getTime()-1000*60*1) });//updated 15 min ago

        let queryDate = new Date(now.getTime()-1000*60*20).toISOString();                
        let results = await repository.getPayments({ type:PaymentType.incoming, updated: { $gte: queryDate } })
        assert.equal(results.length, 2)        
        assert.equal(results[0].guid, '3')//most recent first
        assert.equal(results[1].guid, '1')        

    });

    it('getPayments not flagged', async ()=>{
        await setup
        await repository.savePayment( <any>{ guid: '1', status: PaymentStatus.pending });
        await repository.savePayment( <any>{ guid: '2', status: PaymentStatus.flagged });
        await repository.savePayment( <any>{ guid: '3', status: PaymentStatus.complete });

        let args:any = {status: { $ne: PaymentStatus.flagged }};
        let results = await repository.getPayments(args)

        assert.equal(results.length, 2);
        assert.equal(results[0].guid, 3);
        assert.equal(results[1].guid, 1);
        
    })

    it('getPayments by timestamp', async () => {

        let now = new Date();
        await setup
        await repository.savePayment( <any>{ guid: '1', type: PaymentType.outgoing, timestamp: new Date(now.getTime()-1000*60*11) });//added 11 min ago
        await repository.savePayment( <any>{ guid: '2', type: PaymentType.outgoing, timestamp: new Date(now.getTime()-1000*60*1) });//added 1 min ago
        await repository.savePayment( <any>{ guid: '3', type: PaymentType.outgoing, timestamp: new Date(now.getTime()-1000*60*5) });//added 5 min ago
        

        let queryDate = new Date(now.getTime()-1000*60*10).toISOString();//get payments 10 minutes or older
        let results = await repository.getPayments({ type:PaymentType.outgoing, timestamp: { $lte: queryDate } })
        assert.equal(results.length, 1)        
        assert.equal(results[0].guid, '1')

    });
})

function cleanDb(db: any) {
    return new Promise((fulfill: any, reject: any) => {
        clean(db, (err: any, db: any) => {
            if (err)
                reject();
            else
                fulfill();
                
        });

    });

}