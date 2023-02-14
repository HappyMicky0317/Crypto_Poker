import { SweepEvent } from './../model/sweep-event';
import { Decimal } from '../../../poker.ui/src/shared/decimal';
import * as encryption from '../../../poker.engine/src/framework/encryption';
import { AddressInfo } from './../model/AddressInfo';
import { IncomingPaymentEvent } from './../model/incoming-payment-event';
import { EthEvent } from '../model/eth-event';
import { IAccountService } from './AccountService';
var Tx = require('ethereumjs-tx');
const util = require('ethereumjs-util');//a dependency of ethereumjs-tx
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();
import { TransactionResult } from './BlockCypherService';
var _ = require('lodash');
import {to, SharedHelpers, sleep, logToFile} from '../../../poker.engine/src/shared-helpers';
import { IParityModule } from './parity-module';
import { CurrencyConfig } from '../model/currency-config';
import { ISecureDataRepository } from '../repository/ISecureDataRepository';
import { TxLog } from '../model/tx-log';
import { Currency } from '../../../poker.ui/src/shared/Currency';
import { CommonHelpers } from '../../../poker.ui/src/shared/CommonHelpers';
import { PaymentProcessorMessage } from '../processor/PaymentProcessorMessage';
import { PaymentProcessor } from '../processor/PaymentProcessor';
import Web3 from 'web3';
import { IBlockChainService } from './IBlockChainService';
import * as EthDepositAddressService from "../../../poker.engine/src/services/EthDepositAddressService";
import { BlockHeader } from 'web3-eth';

export class EthBlockService implements IBlockChainService {

    currency: string = Currency.eth;
    web3:Web3;
    blocks:number[] = [];
    latestBlockNumber:number;
    checking:boolean;
    unprocessedAddresses :AddressInfo[] = [];
    erc20Tokens :CurrencyConfig[];
    monitoredAddresses : MonitoredAddress[] = [];    
    firstRun:boolean = true;
    sweepTimer:any;
    parityIp:string;
    config:CurrencyConfig;    
    lastBlockTime:number;
    newBlockHeadersSubscription:any;

    constructor(private dataRepository: ISecureDataRepository, private web3provider:any, private processor:PaymentProcessor, public parityModule:IParityModule) {
        this.parityIp = process.env.POKER_PARITY_API_IP || 'mainnet.infura.io/ws';//former should include the apiKey from infura
        this.parityModule.parityIp = this.parityIp;
    }

    async init() : Promise<void>{
        if (process.env.POKER_DISABLE_ETH)
            return; 
            
        this.unprocessedAddresses = await this.dataRepository.getUnprocessedAddresses(Currency.eth);        
        await this.subscribe();
        for(let txLog of await this.getQueuedTx()){
            let receipt = await this.parityModule.eth_getTransactionReceipt(txLog.hash);
            if(receipt && receipt.blockNumber){
                this.saveTxLogAsComplete(txLog, receipt);
            }
            
        }
    }

    async loadCurrencyConfig() : Promise<void> {
        this.config = await this.dataRepository.getCurrencyConfig(Currency.eth);
        if(this.config == null && !process.env.POKER_DISABLE_ETH){
            logger.warn('eth currency config is null. exiting');
            process.exit(1);
            
        }
        await this.loadErc20s(); 
    }

    readonly abi = JSON.parse('[{ "constant": true, "inputs": [], "name": "mintingFinished", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }], "name": "mint", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "finishMinting", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }, { "name": "_releaseTime", "type": "uint256" }], "name": "mintTimelocked", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "payable": false, "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Mint", "type": "event" }, { "anonymous": false, "inputs": [], "name": "MintFinished", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Pause", "type": "event" }, { "anonymous": false, "inputs": [], "name": "Unpause", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }]');
    async loadErc20s(){
        this.erc20Tokens = await this.dataRepository.getErc20Tokens();           
    }
    
    getAddress(currency: string, xpub: string, index: number): Promise<string> {
        return Promise.resolve(EthDepositAddressService.genAddr(xpub, index));        
      }

    async subscribe() {        
        try {            
            let args = null;
            if(this.web3provider.name==='Web3'){
                args = new Web3.providers.WebsocketProvider(`wss://${this.parityIp}`);
            }
                
            this.web3 = new this.web3provider(args);
            let latestBlock: any = await this.web3.eth.getBlock('latest');
            let lastProcessedBlock = await this.dataRepository.getLastProcessedBlock('eth');
            this.latestBlockNumber = (lastProcessedBlock || latestBlock.number) - this.config.requiredNumberOfConfirmations;
            this.log(`parityIp: ${this.parityIp} eth lastProcessedBlock: ${lastProcessedBlock} latestBlockNumber: ${latestBlock.number}`);
            //let block = await this.web3.eth.getBlock(7466105, true);             
             //this.checkBlock(block, this.unprocessedAddresses);
            //let bal = await this.getContractBalance('0x689c56aef474df92d44a1b70850f808488f9769c', this.erc20Tokens[0].contractAddress);
            //this.newBlockHeadersSubscription = this.web3.eth.subscribe('newBlockHeaders', this.newBlockHeaders.bind(this));            
            this.newBlockHeadersSubscription = await this.web3.eth.subscribe('newBlockHeaders')
            this.newBlockHeadersSubscription.on("data", (blockHeader:BlockHeader) =>{
                this.newBlockHeaders(blockHeader);
            })
            this.newBlockHeadersSubscription.on("error", (e:Error)=>{
                this.onConnectionError(e);
            });
        } catch (error) {
            this.onConnectionError(error);
            return;
        }
    }

    async getContractBalance(address: string, contractAddress:string):Promise<any> {

        let contract = new this.web3.eth.Contract(this.abi, contractAddress);
        let contractBalance = await contract.methods.balanceOf(address).call();
        //console.log('contractBalance: ', this.web3.utils.fromWei(contractBalance, "ether"));
        
        return contractBalance;
    }

    onConnectionError(error:any){
        clearInterval(this.sweepTimer); 
        let errorMessage = error;
        if(error.code || error.reason)
            errorMessage = `${error.code} ${error.reason}`;
        this.log(`eth node error: ${errorMessage} parityIp: ${this.parityIp}`);
        this.unsubscribe();
        this.firstRun = true;
        setTimeout( async ()=> await this.subscribe(), 30000);
    }

    unsubscribe() {
        if (this.newBlockHeadersSubscription) {
            try {
                this.newBlockHeadersSubscription.unsubscribe((error:any, success:any)=>{
                    if(success)
                        this.log('newBlockHeadersSubscription: Successfully unsubscribed');
                    else if(error)
                    this.log('newBlockHeadersSubscription: error on unsubscribe: ' + error);
                });
            } catch (error) {
                logger.error(error);                
            }
        }
    }

    async newBlockHeaders(blockHeader: BlockHeader) : Promise<void> {                   
        if (blockHeader.number) {
            this.blocks.push(blockHeader.number);
            await this.checkForTx();
        }
    }

    log(text:string){
        logToFile('eth.log', text)
    }
    
    async checkForTx(){
        if(this.blocks.length > 0 && !this.checking && this.blocks[this.blocks.length-1] > this.latestBlockNumber){            
            this.checking = true;
            let fetchBlock = this.latestBlockNumber+1;            
            this.latestBlockNumber = this.blocks[this.blocks.length-1];       
            
            for(let i=fetchBlock;i<=this.latestBlockNumber;i++){
                
                let block:any = null;
                let count = 0;
                while(( block = await this.web3.eth.getBlock(i, true)) == null && count < 20){
                    count++;
                    this.log(`getBlock returned null for ${i}. count: ${count}`)
                    await sleep(2000);                    
                }
                if(block){
                    if(i % 100 == 0){
                        
                    }
                    this.log(`block ${i}  num transactions: ${block.transactions.length}`);
                    
                    await this.checkBlock(block, this.unprocessedAddresses);                
                    
                    if(i==this.latestBlockNumber){
                        await this.checkMonitoredAddresses();
                    }
                    await this.dataRepository.saveLastProcessedBlock('eth', i);
                }else{
                   throw new Error(`getBlock returned null for ${i}. count${count}`)             
                }
                //let block = await this.web3.eth.getBlock(i, true);                                
            }
            this.checking = false;
            
            this.lastBlockTime = new Date().getTime();
            if(this.firstRun){
                this.firstRun = false;
                //this.sweepTimer = setInterval(async () => await this.sweep() , 30000);
            }
            if(this.blocks.length){
                setTimeout(async () => { await this.checkForTx(); }, 0);
            }
        }
    }
    
    async checkMonitoredAddresses(){
        for(let mon of this.monitoredAddresses){
            if(this.latestBlockNumber > mon.blockNumber){
                let block = await this.web3.eth.getBlock(mon.blockNumber, true);
                await this.checkBlock(block, mon.addresses);
            }
            
        }
    }

    async checkBlock(block:any, addresses:AddressInfo[]){
        const erc20sChecked = new Set<string>();
        for(let tx of block.transactions){
            if(tx.to != null){
                
                let info = addresses.find(a=>a.address.toLowerCase()===tx.to.toLowerCase());
                if(info != null){                    
                    await this.publishPaymentEvent(info, tx.value, tx.blockNumber, tx.hash);
                }
                
                for(let erc20 of this.erc20Tokens){
                    if(tx.to.toLowerCase() === erc20.contractAddress.toLowerCase() && !erc20sChecked.has(erc20.name)){
                        this.log(`detected ${erc20.name} contract tx. block:${tx.blockNumber} txHash: ${tx.hash}`);
                        await this.getPastEvents(null, block.number, erc20, addresses);
                        erc20sChecked.add(erc20.name);                        
                    }
                }
            }            
        }
    }

    async getPastEvents(toAddress:any, block:number, erc20:CurrencyConfig, addresses:AddressInfo[]){
                
        let events:EthEvent[] = await this.getPastTransferEvents(toAddress, block, erc20);
        for(let event of events){
            //logger.debug(`${erc20.name} Transfer: block:${event.blockNumber} ${event.returnValues.to} received ${SharedHelpers.fromWei(event.returnValues.value)}. txHash:${event.transactionHash}`);

            let info = addresses.find(a=>a.address.toLowerCase()===event.returnValues.to.toLowerCase());
            if(info!=null){                
                await this.publishPaymentEvent(info, event.returnValues.value, event.blockNumber, event.transactionHash, erc20.name);
            }
        }            
    }

    async getPastTransferEvents(toAddress:any, block:number, erc20:CurrencyConfig) : Promise<EthEvent[]>{
        
        let contract = this.getContract(erc20);
        let options:any = {}
        if(toAddress)
            options.filter = {to: toAddress };
        if(block){
            options.fromBlock= block;
            options.toBlock= block;
        }else{
            options.fromBlock= 0;
            options.fromBlock= 4997759;
            options.toBlock= 'latest';
        }
        let events:EthEvent[] = await contract.getPastEvents('Transfer', options);
        return events;
    }

    async publishPaymentEvent(info:AddressInfo, weiAmount:any, blockNumber:number, txHash:string, erc20TokenName?:string){
        let confirmations = this.latestBlockNumber - blockNumber + 1;
        let sweepFee:string;
        let hasRequiredNumberOfConfirmations = confirmations >= this.config.requiredNumberOfConfirmations;
        if(!hasRequiredNumberOfConfirmations){
            this.addToMonitor(info, blockNumber);
        }            
        else{            
            this.removeFromMonitor(info, blockNumber);
        }
            

        let amount = SharedHelpers.convertToLocalAmount(Currency.eth, weiAmount);
        
        let paymentEvent = new IncomingPaymentEvent(info.address, amount, confirmations, txHash);  
        if(erc20TokenName){
            paymentEvent.currency = erc20TokenName;
        }
            
        if(!erc20TokenName && hasRequiredNumberOfConfirmations)
            paymentEvent.sweepFee = this.getEthTransferFee().dividedBy(SharedHelpers.ethDeciGweiDivisor).toString();
        this.log(`publishPaymentEvent for address:${info.address} erc20TokenName:${erc20TokenName} received: ${SharedHelpers.fromWei(weiAmount)} confirmations:${confirmations} txHash:${txHash}`);        
        let pMessage = new PaymentProcessorMessage();
        pMessage.incomingPaymentEvent = paymentEvent; 
        this.processor.sendMessage(pMessage);

        if(hasRequiredNumberOfConfirmations){
            let sweepEvent = new SweepEvent();            
            sweepEvent.incomingPaymentHash = txHash;
            sweepEvent.checkSweep = true;
            sweepEvent.address = info.address;
            sweepEvent.weiAmount = weiAmount;
            if(erc20TokenName)
                sweepEvent.erc20TokenName = erc20TokenName;
            await this.dataRepository.saveSweepEvent(sweepEvent)
        }      
    }
    

    addToMonitor(info: AddressInfo, blockNumber: number) {
        let mon = this.monitoredAddresses.find(m => m.blockNumber == blockNumber);
        if (!mon) {
            mon = new MonitoredAddress(blockNumber);
            this.monitoredAddresses.push(mon)
        }
        if(!mon.addresses.find(a=>a.address==info.address))
            mon.addresses.push(info);
    }
    removeFromMonitor(info: AddressInfo, blockNumber: number) {
        let blockMonitorIndex = this.monitoredAddresses.findIndex(m => m.blockNumber == blockNumber);
        if (blockMonitorIndex>-1) {
            let monitor = this.monitoredAddresses[blockMonitorIndex];
            let index = monitor.addresses.findIndex(a=>a.address==info.address);
            if(index > -1){
                monitor.addresses.splice(index, 1);
            }
            if(!monitor.addresses.length)
                this.monitoredAddresses.splice(blockMonitorIndex, 1);
        }
    }
    


    async monitorAddress(info:AddressInfo) : Promise<void> {
        if(!this.unprocessedAddresses.find(a=>a.address==info.address)){
            this.unprocessedAddresses.push(info);
        }
    }   
    async getAddrBal(address: string, erc20Token:CurrencyConfig|null):Promise<string> {
        if(erc20Token == null){
            let addressBalance = await this.web3.eth.getBalance(address);
            return addressBalance;
        }else{            
            let contract = this.getContract(erc20Token);
            let contractBalance = await contract.methods.balanceOf(address).call();
            return contractBalance;
        }
    }

    getContract(erc20Token:CurrencyConfig) :any {        
        return new this.web3.eth.Contract(this.abi, erc20Token.contractAddress);
    }

    getEthTransferFee() :Decimal {
        let gasPrice:Decimal = new Decimal(this.web3.utils.toWei(this.config.gasPriceGwei+'', 'gwei'));
        return gasPrice.mul(this.gasLimit);
    }

    get gasLimit() : number{
        return 35000;
    }

    private getErc20Token(currency: string): CurrencyConfig {
        return this.erc20Tokens.find(c => c.name == currency);
    }

    newTransaction(currency: string, receivingAddress: string, balance: number, userGuid:string): Promise<TransactionResult> { 
        return this.newTransactionInternal(receivingAddress, balance, this.getErc20Token(currency))
    }  



    async newTransactionInternal(toAddress:string, balance:number, erc20Token:CurrencyConfig|null) : Promise<TransactionResult>{
        if (process.env.POKER_DISABLE_ETH) {
            throw new Error(`eth is disabled via POKER_DISABLE_ETH`)
        }
        let wei = new Decimal(SharedHelpers.convertToWei(balance)+'');
        let masterAccBalance = await this.getAddrBal(this.config.masterAccount.public, erc20Token);
        let result = new TransactionResult();
        if(wei.greaterThan(new Decimal(masterAccBalance))){
            
            result.errorMessage = `Master acct has a balance of ${this.web3.utils.fromWei(masterAccBalance + '', 'ether')} however the transfer
             is for ${this.web3.utils.fromWei(wei + '', 'ether')}. Have you transferred from the cold wallet to the hot wallet?`;
            return result;
        }
        
        
        
        let fees:Decimal = new Decimal('0');
        if(erc20Token == null){            
            fees = this.getEthTransferFee();
            wei = wei.minus(fees);
        }
        
        let [err,txHash] = await to(this.sendTx(toAddress, encryption.decrypt(this.config.masterAccount.private), wei.toString(), erc20Token, "OutgoingTx", null));
        if(txHash){
            result.txHash = txHash;
            result.fees = fees.dividedBy(SharedHelpers.ethDeciGweiDivisor).toString();
            result.sentAmount = parseFloat(SharedHelpers.convertToDeciGwei(wei.toString()));
            result.success = true;                           
        }else if(err){
            result.errorMessage = err.toString();
        }
        return result;
    }

    async sendTx(toAddress: string, pKey: string, wei: string, erc20Token: CurrencyConfig|null, type: string, relatedTxHash: string|null): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                let config = this.config;                
                let publicKey = util.privateToAddress(pKey).toString('hex');
                let publicKey2 = util.toChecksumAddress(publicKey);
                let privateKey = util.toBuffer(pKey);

                let gasPrice: string = this.web3.utils.toWei(config.gasPriceGwei + '', 'gwei');
                let date = new Date();
                let gasHex = this.web3.utils.toHex(gasPrice);
                //let nonce = await this.web3.eth.getTransactionCount(publicKey);            
                let [err, nonce] = await to(this.parityModule.nextNonce(publicKey2));
                if (err)
                    return reject(err);
                let rawTx: any = {
                    nonce: this.web3.utils.toHex(nonce + ''),
                    gasPrice: gasHex,
                }
                let erc20Name = '';
                if (erc20Token != null) {
                    erc20Name = erc20Token.name;
                    let contract = this.getContract(erc20Token);
                    rawTx.data = contract.methods.transfer(toAddress, wei).encodeABI();
                    rawTx.to = erc20Token.contractAddress;
                    rawTx.value = '0x0';
                    rawTx.gasLimit = this.web3.utils.toHex(config.gasLimit);
                } else {
                    rawTx.to = toAddress;
                    rawTx.value = this.web3.utils.toHex(wei);
                    rawTx.gasLimit = this.web3.utils.toHex(this.gasLimit);
                }

                var tx = new Tx(rawTx);
                tx.sign(privateKey);

                var serializedTx = tx.serialize();
                let payload = '0x' + serializedTx.toString('hex');
                let txLog = new TxLog()
                let txHash = '0x' + tx.hash().toString('hex');
                txLog.currency = Currency.eth;
                txLog.erc20Name = erc20Name;
                txLog.hash = txHash;
                txLog.status = 'queued';
                txLog.type = type;
                txLog.timestamp = date;                
                txLog.relatedTxHash = <string>relatedTxHash;
                txLog.rawTx = rawTx;
                txLog.from = publicKey2;
                await this.dataRepository.addTxLog(txLog);

                this.web3.eth.sendSignedTransaction(payload)
                    .on('transactionHash', async (hash: any) => {
                        this.log(`transactionHash ${hash} for ${type} address: ${publicKey2} erc20:${erc20Name}`);
                        resolve(txHash);
                    })
                    .on('receipt', (receipt: any) => {
                        this.log(`receipt ${receipt.transactionHash} for ${type} address: ${publicKey2} erc20:${erc20Name}`);
                        this.saveTxLogAsComplete(txLog, receipt);
                    })
                    .on('error', async (err: any) => {
                        txLog.status = 'error';                        
                        txLog.error = err.toString();
                        logger.error(`error on tx. ${type} address: ${publicKey2} erc20:${erc20Name} err:${err}`);
                        this.dataRepository.addTxLog(txLog);
                        reject(err);
                    });
            } catch (error) {
                reject(error);
            }
        }

        );
    }

    lastBlockWarningTime:number= new Date(-8640000000000000).getTime();
    lastLowSweepBalanceTime:number= new Date(-8640000000000000).getTime();

    async runChecks() : Promise<void> {
        if(!this.lastBlockTime){
            return;
        }
        let seconds = (new Date().getTime() - this.lastBlockTime) / 1000;
            let secThreshold = 600;
            if(seconds > secThreshold){
                
                let secondsSinceLastNotification = (new Date().getTime() - this.lastBlockWarningTime) / 1000;
                if(secondsSinceLastNotification > 600){
                    this.lastBlockWarningTime = new Date().getTime();
                    this.onConnectionError(`warning! last block ${this.latestBlockNumber} has not changed for ${seconds} seconds`);                    
                }
            }
    }
    
    async saveTxLogAsComplete(txLog:TxLog, receipt:any){
        
        if(txLog.erc20Name){
            let erc20Token = <CurrencyConfig>this.erc20Tokens.find(t=>t.name==txLog.erc20Name);
            let events:EthEvent[] = await this.getPastTransferEvents(null, receipt.blockNumber, erc20Token);
            let event = events.find(e=>e.transactionHash==txLog.hash);
            if(event != null){
                txLog.status = 'complete';
            }else{
                txLog.status = 'error';
                txLog.error = `Token transfer failed. Was expecting a token transfer in block: ${receipt.blockNumber} with hash: ${txLog.hash}`;
                logger.error(txLog.error);
            }
        }else{
            txLog.status = 'complete';
        }
        
        txLog.receipt = receipt;        
        this.dataRepository.addTxLog(txLog);
    }

    async isWaitingOnPriorTransaction() : Promise<string> {
        let txLogs = await this.getQueuedTx();
        if(txLogs.length){
            return txLogs[0].hash;
        }
        return null;
    }

    async getQueuedTx() : Promise<TxLog[]> {
        return this.dataRepository.getTxLogs({"status":'queued'});
    }
    
    

    
}

class MonitoredAddress{
    
    addresses:AddressInfo[] = []
    constructor(public blockNumber:number) {
        
    }
}


