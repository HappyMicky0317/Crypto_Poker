// import { SweepEvent } from './../src/model/sweep-event';
// import { IncomingPaymentEvent } from './../src/model/incoming-payment-event';
// import { EthEventReturnValues } from './../src/model/eth-event';
// import { CurrencyConfig,AddressSmall } from '../../poker.ui/src/shared/currency-config';
// import { Currency } from './../../poker.admin.ui/src/shared/CurrencyUnit';
// import { Helpers } from "../src/helpers";
// import { TestHelpers } from './test-helpers';
// import { IDataRepository } from '../src/services/documents/IDataRepository';
// import { EthBlockService, IWeb3Service, IWeb3EthService, IPromiEvent } from '../src/services/EthBlockService';
// import { IAccountService } from '../src/services/AccountService';
// import { AddressInfo } from '../src/model/AddressInfo';
// import { EthEvent } from '../src/model/eth-event';
// import { IParityModule } from '../src/services/parity-module';
// import { Payment } from '../src/model/Payment';
// var _ = require('lodash');

// var assert = require('assert');
// var clean = require('mongo-clean');
// var web3utils = require('web3-utils');
// var substitute = require('jssubstitute');
// substitute.throwErrors();
// var Tx = require('ethereumjs-tx');

// describe('EthBlockServiceFixture', () => {
    
//     let dataRepository:any;
//     let web3Service:IWeb3Service;
//     let parityModule:any;
//     let web3EthService:any;
//     let accountService:any;
//     let ethBlockService:EthBlockService;
//     let sweepEvent:SweepEvent;
//     let info:AddressInfo;
//     let txHash = '0xbde63ea6ce55a658ab141515da161dde09cbf2f5af2024838af78dbf42c6d059';
//     let block:any;
//     let erc20Token = new CurrencyConfig();
//     let pastEvents:EthEvent[];
    
//     let depositAddress = '0xA096A4C8aaEc86585130671C0163312A9A0E03b2';
//     let ethEvent:EthEvent = new EthEvent();
//     ethEvent.blockNumber = 5000000;
//     ethEvent.transactionHash = txHash;
//     ethEvent.returnValues = new EthEventReturnValues();
//     ethEvent.returnValues.to = depositAddress;
//     ethEvent.returnValues.value = 58307300000000000000;   
//     let web3Contract:any;
//     let currencyConfig:CurrencyConfig = new CurrencyConfig();
//     currencyConfig.requiredNumberOfConfirmations=10;
//     currencyConfig.gasPriceGwei = 2;
//     currencyConfig.gasLimit = 60000;
//     currencyConfig.sweepAccount = new AddressSmall();
//     currencyConfig.sweepAccount.public = '0xF2A29DD4B7C09d5DACDF0aC221EEa9d861B57306';        
//     currencyConfig.sweepAccount.private = 'e29a0dd490cd22364ec127c93b3d889f4e5889bd9482cbf1b2ce3cf81a75b0934a972af6bb79abb6d593cb6ebb96fcdc5e415debc7d5f8272eafe9f39b4047cbcb44bb325368e24ecf9d2d80b60da010';        
//     let methodsSub:any;
//     let promiEventSub:IPromiEvent;
//     let onTransactionHashFunc:(hash:string)=>void;
//     beforeEach(async ()=> {        
//         info = new AddressInfo();
//         info.address = depositAddress;
//         info.private = '2d3aad50e9944347e5423ca4d4e9498ecda0590f8e09c6685d992bf23361640e82d2ed0cdec3929729ea0414696cb7e6866d488e5eeefb19df0613c7f62d3fcc866d4f1f4e0226dd5217e639263fc8ff';
//         sweepEvent = new SweepEvent();
//         sweepEvent.address = depositAddress;
//         sweepEvent.incomingPaymentHash = '0xbde63ea6ce55a658ab141515da161dde09cbf2f5af2024838af78dbf42c6d059';
//         pastEvents = [];
//         block = { transactions: [ ] };    
//         dataRepository = TestHelpers.getSubstitute(IDataRepository);
//         web3Service = TestHelpers.getSubstitute(IWeb3Service);
//         parityModule = TestHelpers.getSubstitute(IParityModule);
        
//         promiEventSub = {
//             on : function(event: any, cb: any):any {            
//                 if(event == 'transactionHash')
//                     onTransactionHashFunc = cb;
//                 return this;
//             }
//         }
//         web3EthService = new IWeb3EthService();
//         web3EthService.sendSignedTransaction = (payload: any): IPromiEvent => {
//             var tx = new Tx(payload);
//             setTimeout(() => { 
//                 onTransactionHashFunc(tx.hash().toString('hex')); 
//             }, 25);
//             return promiEventSub;
//         }
        
//         web3EthService =substitute.for(web3EthService);
//         web3EthService.callsThrough('sendSignedTransaction');
//         accountService = TestHelpers.getSubstitute(IAccountService);
        
                

//         erc20Token.name = 'omg';
//         erc20Token.contractAddress = '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07';
//         erc20Token.abi = '{}';
//         dataRepository.returnsFor('getErc20Tokens', [erc20Token]);            
//         dataRepository.returnsFor('getUnprocessedAddresses', [info]);
//         dataRepository.returnsFor('getCurrencyConfig',currencyConfig);
//         dataRepository.returnsFor('getAddressInfoByAddress', info);        
//         dataRepository.returnsFor('getPaymentsWithoutFees', []);
//         dataRepository.returnsFor('getSweepEvents', []);        

//         web3EthService.returnsFor('getBlock', block);
//         web3EthService.returnsFor('getTransactionCount', 1);
//         parityModule.returnsFor('nextNonce', Promise.resolve('0x1'));
                

//         web3Service.eth = web3EthService;        
//         web3Service.utils = web3utils;        
//         ethBlockService = new EthBlockService(dataRepository, function Web3Service(arg:any) { return web3Service; }, accountService, parityModule);
//         ethBlockService.firstRun = false;
//         await ethBlockService.init();
//         ethBlockService.latestBlockNumber = 4999999;
        
//         web3Contract = {
            
//             getPastEvents(type:string, options:any) : EthEvent[] {                
//                 return options.fromBlock === 5000000 ? pastEvents : []; 
//             }            
//         }
//         web3EthService.Contract = function Contract(arg:any) { return web3Contract; }
//         methodsSub = null;
//       });    
    
//     it('contract_transfer_triggers_handle_payment_event', async () => {
//         let tx = { to: erc20Token.contractAddress, from: '' };
//         block.transactions.push(tx); 
//         block.number = 5000000;               
//         pastEvents.push(ethEvent);
        
//         await ethBlockService.newBlockHeaders(null, { number: 5000000 });

//         accountService.receivedWith('handlePayment', substitute.arg.matchUsing((event: IncomingPaymentEvent) => { 
//             return event instanceof IncomingPaymentEvent && event.info === info && event.amount === '5830730000' && event.confirmations === 1 && event.txHash === txHash && event.currency === 'omg';  
//         }));
        
//         assert.equal(ethBlockService.monitoredAddresses[0].blockNumber, 5000000);
//         assert.equal(ethBlockService.monitoredAddresses[0].addresses[0], info);
//         dataRepository.didNotReceive('saveSweepEvent');        
//     });

//     it('eth_transaction_triggers_handle_payment_event', async () => {
//         let tx = { to: depositAddress, value:'1000000000000000000', blockNumber:5000000, hash:txHash, from: ''  };
//         block.transactions.push(tx);
//         await ethBlockService.newBlockHeaders(null, { number: 5000000 });

//         accountService.receivedWith('handlePayment', substitute.arg.matchUsing((event: IncomingPaymentEvent) => { 
//             return event instanceof IncomingPaymentEvent && event.info === info && event.amount === '100000000' && event.confirmations === 1 && event.txHash === txHash && event.currency === undefined;
//         }));
//     });

//     it('new_block_triggers_payment_event_for_contract_transfer_monitored_event', async () => {
//         ethBlockService.latestBlockNumber = 5000000;
//         ethBlockService.monitoredAddresses.push( { blockNumber: 5000000, addresses: [info] })
//         let block5mil:any = { number: 5000000, transactions: [{ to: erc20Token.contractAddress, value:0, blockNumber:5000000, hash:txHash  } ] };            
//         web3EthService.getBlock = (num:number)=>{
//             return num==5000000 ? block5mil:block;
//         };
//         ethBlockService.latestBlockNumber = 5000000;
//         pastEvents.push(ethEvent);

//         await ethBlockService.newBlockHeaders(null, { number: 5000005 });

//         accountService.receivedWith('handlePayment', substitute.arg.matchUsing((event: IncomingPaymentEvent) => { 
//             return event instanceof IncomingPaymentEvent && event.info === info && event.amount === '5830730000' && event.confirmations === 6 && event.txHash === txHash && event.currency === 'omg';  ;
//         }));
//         assert.equal(ethBlockService.monitoredAddresses.length, 1);
//         assert.equal(ethBlockService.monitoredAddresses[0].addresses.length, 1);
//         assert.equal(ethBlockService.monitoredAddresses[0].addresses[0].address, depositAddress);
//     });

//     it('payment_from_sweep_address_is_ignored', async () => {
//         let amount = web3utils.toWei('0.00006', 'ether');
//         let tx = { to: info.address, value: amount, blockNumber:5000000, from: currencyConfig.sweepAccount.public };
//         block.transactions.push(tx); 
//         block.number = 5000000;               
//         pastEvents.push(ethEvent);
        
//         await ethBlockService.newBlockHeaders(null, { number: 5000000 });

//         accountService.didNotReceive('handlePayment');
        
        
//     });

//     it('new_block_triggers_payment_event_for_eth_transaction_monitored_event', async () => {
//         ethBlockService.latestBlockNumber = 5000000;
//         ethBlockService.monitoredAddresses.push( { blockNumber: 5000000, addresses: [info] })
//         let block5mil:any = { number: 5000000, transactions: [{ to: depositAddress, value:'1000000000000000000', blockNumber:5000000, hash:txHash, from: ''  } ] };            
//         web3EthService.getBlock = (num:number)=>{
//             return num==5000000 ? block5mil:block;
//         };

//         await ethBlockService.newBlockHeaders(null, { number: 5000009 });

//         accountService.receivedWith('handlePayment', substitute.arg.matchUsing((event: IncomingPaymentEvent) => { 
//             if(event instanceof IncomingPaymentEvent){
//                 assert.equal(event.info, info);
//                 assert.equal(event.amount, 100000000);
//                 assert.equal(event.confirmations, 10);
//                 assert.equal(event.txHash, txHash);
//                 assert.equal(event.currency, undefined);
//                 assert.equal(event.sweepFee, 4200);

//                 return true;
//             }
//             return false;
            
//         }));
//         assert.equal(ethBlockService.monitoredAddresses.length, 0);//remove monitored address
//         dataRepository.receivedWith('saveSweepEvent', substitute.arg.matchUsing((event:SweepEvent) => {
//             if(event!= null){
//                 assert.equal(event.incomingPaymentHash, txHash);
//                 assert.equal(event.checkSweep, true);  
//                 assert.equal(event.address, depositAddress);  
//                 assert.equal(event.weiAmount, '1000000000000000000');  
//                 assert.equal(event.erc20TokenName, null);                  
                
//                 return true;                 
//             }
//             return false;             
//         }));
//         //assert.equal(ethBlockService.monitoredAddresses[0].addresses.length, 0);
//     });

//     let setupSweep = (tokenBalance:string)=>{                
        
//         sweepEvent.weiAmount = web3utils.toWei(tokenBalance);
//         if(tokenBalance != '0')
//             sweepEvent.erc20TokenName = 'omg'; 
//         dataRepository.returnsFor('getSweepEvents', [sweepEvent]);                
        
//         let call = () => { return sweepEvent.weiAmount };
//             let methods = { 
//                 balanceOf: (address: string) => { return call; },
//                 transfer: (to: any, amount:any) => { return { encodeABI : () => "encodedABI"}; }
//             }
                
//             methodsSub = substitute.for(methods);
//             methodsSub.callsThrough('balanceOf');
//             methodsSub.callsThrough('transfer');
//             web3Contract.methods = methodsSub;        
//     }
//     it('sweep_requires_ether', async () => {
        
//         setupSweep('3');//3 OMG                
//         web3EthService.returnsFor('getBalance', web3utils.toWei('100000', 'gwei'));//0.0001 ether
//         await ethBlockService.sweep();

//         web3EthService.receivedWith('sendSignedTransaction', substitute.arg.matchUsing((payload: any) => {
//             if (payload != null) {

//                 var tx = new Tx(payload);
//                 var json = tx.toJSON();
//                 assert.equal(tx.getSenderAddress().toString('hex'), 'F2A29DD4B7C09d5DACDF0aC221EEa9d861B57306'.toLowerCase());
//                 assert.equal(web3utils.bytesToHex(tx.to), '0xA096A4C8aaEc86585130671C0163312A9A0E03b2'.toLowerCase());
//                 assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasPrice)), 'gwei'), '2');
//                 assert.equal(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasLimit)), '21000');
//                 assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.value)), 'gwei'), '20000');
//                 assert.equal(tx.verifySignature(), true);
//                 assert.equal(tx.validate(), true);
                
//                 return true;
//             }
//             return false;
//         }));
        
//         dataRepository.receivedWith('updateSweepEvent', substitute.arg.matchUsing((txHash:string) => txHash==sweepEvent.incomingPaymentHash), substitute.arg.matchUsing((setObj:any) => setObj!=null && setObj.pendingIncomingSweepTx===true));
//     });

//     it('sweep_is_not_processed_when_pending_incoming_sweep', async () => {
        
//         setupSweep('3');
//         sweepEvent.pendingIncomingSweepTx = true;
        
//         await ethBlockService.sweep();

//         web3EthService.didNotReceive('sendSignedTransaction');
//     });

//     it('sweep_out_token', async () => {
        
//         setupSweep('3');
//         web3EthService.returnsFor('getTransaction', { gasPrice: '2000000000' });
//         web3EthService.returnsFor('getBalance', web3utils.toWei('162000', 'gwei'));        
//         currencyConfig.masterAccount = new AddressSmall();
//         currencyConfig.masterAccount.public = '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b';        
//         currencyConfig.masterAccount.private = 'cd43dc0874e69f513e6b9e0f90e7edfce1bb757227693540ef9e35d0d59315d3d7209f380b7fd46ecde64a49b2be522ccf499658978c4a70203a702d46d3e309b7b21f40140b42de8acb8eb9cb4b233e';        

//         await ethBlockService.sweep();

//         methodsSub.receivedWith('transfer', '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b', web3utils.toWei('3'));
//         web3EthService.receivedWith('sendSignedTransaction', substitute.arg.matchUsing((payload: any) => {
//             if (payload != null) {

//                 var tx = new Tx(payload);
//                 // var json = tx.toJSON();
//                  assert.equal(tx.getSenderAddress().toString('hex'), 'a096a4c8aaec86585130671c0163312a9a0e03b2');
//                  assert.equal(web3utils.bytesToHex(tx.to), erc20Token.contractAddress.toLowerCase());
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasPrice)), 'gwei'), '2');
//                  assert.equal(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasLimit)), '60000');
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.value)), 'gwei'), '0');
//                  assert.equal(tx.verifySignature(), true);
//                  assert.equal(tx.validate(), true);
                
//                 return true;
//             }
//             return false;
//         }));
//         assert.equal(sweepEvent.pendingOutgoingSweepTx, true);
//         dataRepository.receivedWith('updateSweepEvent', substitute.arg.matchUsing((h:string) => h==txHash), substitute.arg.matchUsing((setObj:any) => setObj!=null && setObj.pendingOutgoingSweepTx===true));
//     });

//     it('sweep_out_ether', async () => {
                
//         setupSweep('0');
        
//         sweepEvent.weiAmount = web3utils.toWei('0.5', 'ether');
//         web3EthService.returnsFor('getBalance', web3utils.toWei('1', 'ether'));//should only sweep out sweep amt
//         currencyConfig.masterAccount = new AddressSmall();
//         currencyConfig.masterAccount.public = '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b';        

//         await ethBlockService.sweep();

//         methodsSub.didNotReceive('transfer');
//         web3EthService.receivedWith('sendSignedTransaction', substitute.arg.matchUsing((payload: any) => {
//             if (payload != null) {

//                 var tx = new Tx(payload);                
//                  assert.equal(tx.getSenderAddress().toString('hex'), 'a096a4c8aaec86585130671c0163312a9a0e03b2');
//                  assert.equal(web3utils.bytesToHex(tx.to), currencyConfig.masterAccount.public.toLowerCase());
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasPrice)), 'gwei'), '2');
//                  assert.equal(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasLimit)), '21000');
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.value)), 'ether'), '0.499958');
//                  assert.equal(tx.verifySignature(), true);
//                  assert.equal(tx.validate(), true);
                
//                 return true;
//             }
//             return false;
//         }));
//         //assert.equal(info.pendingOutgoingSweepTx, true);
//         dataRepository.receivedWith('updateSweepEvent', substitute.arg.matchUsing((h:string) => h==txHash), substitute.arg.matchUsing((setObj:any) => setObj!=null && setObj.pendingOutgoingSweepTx===true));
//     });

//     it('amounts_less_than_minimum_are_not_swept', async () => {
        
//         setupSweep('0');
//         web3EthService.returnsFor('getBalance', web3utils.toWei('0.00099', 'ether'));
//         currencyConfig.masterAccount = new AddressSmall();
//         currencyConfig.minimumDeposit = '0.001';        
//         currencyConfig.masterAccount.public = '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b';        

//         await ethBlockService.sweep();

//         methodsSub.didNotReceive('transfer', '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b');
//         web3EthService.didNotReceive('sendSignedTransaction');
//     });

//     it('amount_equal_to_minimum_is_swept', async () => {
        
//         setupSweep('0.001');
//         sweepEvent.erc20TokenName = null;
//         web3EthService.returnsFor('getBalance', web3utils.toWei('0.001', 'ether'));        
//         currencyConfig.masterAccount = new AddressSmall();
//         currencyConfig.minimumDeposit = '0.001';        
//         currencyConfig.masterAccount.public = '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b';        

//         await ethBlockService.sweep();

//         web3EthService.receivedWith('sendSignedTransaction', substitute.arg.matchUsing((payload: any) => {
//             if (payload != null) {

//                 var tx = new Tx(payload);                
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.value)), 'ether'), '0.000958');
                
//                 return true;
//             }
//             return false;
//         }));
//     });

//     it('nothing_to_sweep', async () => {        
//         setupSweep('0');
//         web3EthService.returnsFor('getBalance', web3utils.toWei('0', 'ether'));

//         await ethBlockService.sweep();

//         methodsSub.didNotReceive('transfer', '0xca227F07fe5322FFD6575ea853305A7e8744Ee6b');
//         web3EthService.didNotReceive('sendSignedTransaction');        
//         dataRepository.receivedWith('updateSweepEvent', substitute.arg.matchUsing((h:string) => h==txHash), substitute.arg.matchUsing((setObj:any) => setObj!=null && setObj.checkSweep===false));
//     });


//     it('pendingIncomingSweepTx_is_cleared', async () => {
//         dataRepository.returnsFor('getSweepEvents', [sweepEvent]); 
//         sweepEvent.pendingIncomingSweepTx = true;
//         sweepEvent.pendingIncomingSweepTxHash = txHash;   
//         dataRepository.returnsFor('getTxLog', { status: "complete"});       

//         await ethBlockService.sweep();
        
//         dataRepository.receivedWith('updateSweepEvent', substitute.arg.matchUsing((t:string) => t==txHash), 
//         substitute.arg.matchUsing((setObj:any) => setObj!=null && setObj.pendingIncomingSweepTx===false && setObj.pendingIncomingSweepTxHash===''));
//     });

//     let setupNewTransactionTests = (balance:string)=>{                
        
//         currencyConfig.masterAccount = new AddressSmall();
//         currencyConfig.masterAccount.private = 'cd43dc0874e69f513e6b9e0f90e7edfce1bb757227693540ef9e35d0d59315d3d7209f380b7fd46ecde64a49b2be522ccf499658978c4a70203a702d46d3e309b7b21f40140b42de8acb8eb9cb4b233e';        
        
        
//         let call = () => { return balance };
//             let methods = { 
//                 balanceOf: (address: string) => { return call; },  
//                 transfer: (to: any, amount:any) => { return { encodeABI : () => "encodedABI"}; }              
//             }
                
//             methodsSub = substitute.for(methods);
//             methodsSub.callsThrough('balanceOf');
//             methodsSub.callsThrough('transfer');
//             web3Contract.methods = methodsSub;        
//     }

//     it('newTransaction', async () => {
        
//         let withdrawAddress = '0x1cC7AE58C473F19E48E70567a94Cb11F5495e6dB';
//         setupNewTransactionTests('0');
//         web3EthService.returnsFor('getBalance', '200000000000000');//0.0001 ether

//         let result = await ethBlockService.newTransaction(withdrawAddress, 20000, null);

//         assert.equal(result.errorMessage, undefined);        
//         assert.equal(result.fees, '4200');        
//         assert.equal(result.success, true);        
//         assert.equal(result.sentAmount, '15800');        
//         assert.equal(result.txHash, '0xfec0e401969cab8d73ae359fa7f33cda5e251640f86ce4ec5de3e8c10bcb1a2d');        
//         web3EthService.receivedWith('sendSignedTransaction', substitute.arg.matchUsing((payload: any) => {
//             if (payload != null) {

//                 var tx = new Tx(payload);                
//                  assert.equal(tx.getSenderAddress().toString('hex'), 'ca227F07fe5322FFD6575ea853305A7e8744Ee6b'.toLowerCase());
//                  assert.equal(web3utils.bytesToHex(tx.to), withdrawAddress.toLowerCase());
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasPrice)), 'gwei'), '2');
//                  assert.equal(web3utils.hexToNumberString(web3utils.bytesToHex(tx.gasLimit)), '21000');
//                  assert.equal(web3utils.fromWei(web3utils.hexToNumberString(web3utils.bytesToHex(tx.value)), 'ether'), '0.000158');
//                  assert.equal(tx.verifySignature(), true);
//                  assert.equal(tx.validate(), true);
                
//                 return true;
//             }
//             return false;
//         }));
//     });

//     it('newTransaction_fails_as_erc20_balance_is_not_sufficient', async () => {
        
//         setupNewTransactionTests('200000000000000');        

//         let result = await ethBlockService.newTransaction('', 20000.1, erc20Token);

//         assert.equal(result.errorMessage, 'Your deposit is in the process of being transferred. Please try again in a few minutes.');        
//         assert.equal(result.fees, null);        
//         assert.equal(result.success, false);        
//         assert.equal(result.sentAmount, null);        
//         assert.equal(result.txHash, null);        
//         web3EthService.didNotReceive('sendSignedTransaction');
//     });


    

//     it('outgoing_payment_fee_is_updated', async () => {
        
//         dataRepository.returnsFor('getPaymentsWithoutFees', [{ type: 'outgoing', fees: '0', txId: 'foo', currency: 'omg' }]);
//         web3EthService.returnsFor('getTransaction', { gasPrice: '2000000000' });
//         web3EthService.returnsFor('getTransactionReceipt', { gasUsed: 37094 });        
        
//         let result = await ethBlockService.updatePaymentFees([erc20Token]);

//         dataRepository.receivedWith('savePayment', substitute.arg.matchUsing((payment:Payment) => {
//             if(payment!= null){
//                 assert.equal(payment.fees, '7418.8');
//                 return true;
//             }
//             return false;
//         }));
//     });    
// });

