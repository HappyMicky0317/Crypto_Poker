import * as assert from 'assert';
import { PaymentProcessor } from '../../src/processor/PaymentProcessor';
import { PaymentProcessorMessage, PaymentProcessorResult } from '../../src/processor/PaymentProcessorMessage';
import { IAccountService } from '../../src/services/AccountService';
import { GetDepositAddressRequest } from '../../../poker.engine/src/admin/model/outgoing/GetDepositAddressRequest'
import { GetDepositAddressResult } from '../../../poker.engine/src/admin/model/incoming/GetDepositAddressResult'
import { IConnectionToGameServer } from '../../src/services/ConnectionToGameServer';
import { PaymentServerToGameServerMessage } from '../../../poker.engine/src/admin/model/PaymentServerToGameServerMessage';

describe('PaymentProcessorFixture', ()=>{
    
    let processor:PaymentProcessor;
    beforeEach(()=>{
        processor = new PaymentProcessor(50);
    })

    let testHandler = {
        run: (m: PaymentProcessorMessage): Promise<PaymentProcessorResult> =>{
            let message = <any>(m);
            let id = message.test.id;
            return new Promise<PaymentProcessorResult>((resolve, reject)=>{
                let timeout = 10;
                if(id == 7){
                    reject('bad message')
                }
                else if(id == 6){
                    throw new Error('some other error')
                }
                else{
                    setTimeout(()=>{                        
                        let result = new PaymentProcessorResult();
                        (<any>result).id = id;                                                
                        resolve(result);
                    }, timeout)
                }  
                
                
            })
        },
        typeName : 'test'
        
    }
    
    it('sendMessage', async ()=>{        
        processor.addHandler(testHandler);
        let promises:Promise<PaymentProcessorResult>[] = [];
        for(let i=0;i<10;i++){
            let promise = new Promise<PaymentProcessorResult>((resolve, reject)=>{
                setTimeout(async ()=>{
                    let message = <any>(new PaymentProcessorMessage());
                    message['test'] = { id: i};
                    let result = await processor.sendMessage(Object.assign(message, { id: i}));
                    resolve(result);
                }, 1)            
            });
            promises.push(promise)            
        }
        const results = await Promise.all(promises);        
        assert.equal(results.length, 10);
        assert.equal((<any>results)[0].id, 0);
        assert.equal((<any>results)[1].id, 1);
        assert.equal((<any>results)[2].id, 2);
        assert.equal((<any>results)[3].id, 3);
        assert.equal((<any>results)[4].id, 4);
        assert.equal((<any>results)[5].id, 5);        
        assert.equal(results[6].error.indexOf('error handling message PaymentProcessorMessage { test: { id: 6 }, id: 6 }: some other error Error: some other error') > -1, true, results[6].error);
        assert.equal(results[7].error, 'error handling message PaymentProcessorMessage { test: { id: 7 }, id: 7 }: bad message');
        assert.equal((<any>results)[8].id, 8);
        assert.equal((<any>results)[9].id, 9);
    })

    it('sendMessage timeout', async ()=>{
        
        let handler = {
            run: (m: PaymentProcessorMessage): Promise<PaymentProcessorResult> =>{
                return new Promise<PaymentProcessorResult>((resolve, reject)=>{
                    let id = (<any>m).test.id;                    
                    if(id != 6){
                        resolve(id);
                    }                    
                })
            },
            typeName : 'test'
            
        }

        processor.addHandler(handler);
        for(let i=0;i<10;i++){
            let message = <any>(new PaymentProcessorMessage());
            message['test'] = { id: i };
            let result = await processor.sendMessage(message);
            
            if(i != 6){
                assert.equal(i, result)
                
            }else{
                assert.equal(result.error.indexOf('message did not complete execution after timeout of 50')> -1, true)
            }    
        }
        
        
    })

   
})