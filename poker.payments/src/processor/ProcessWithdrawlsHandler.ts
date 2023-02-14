import { CurrencyConfig } from './../model/currency-config';
import { IPaymentProcessorMessageHandler } from "./PaymentProcessor";
import { PaymentProcessorResult, PaymentProcessorMessage } from "./PaymentProcessorMessage";
import { IAccountService } from "../services/AccountService";
import { IConnectionToGameServer } from "../services/ConnectionToGameServer";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { Payment } from "../../../poker.engine/src/model/Payment";
import { PaymentType } from "../../../poker.ui/src/shared/PaymentType";
import { Logger, getLogger } from "log4js";
var logger:Logger = getLogger();
import { PaymentStatus } from "../../../poker.ui/src/shared/PaymentStatus";
import { withdraw } from "./WithdrawlsHandler";
import { IBlockCypherService } from "../services/IBlockCypherService";
import { IHttp } from '../../../poker.engine/src/services/IHttp';


export class ProcessWithdrawlsHandler implements IPaymentProcessorMessageHandler {
    
    readonly typeName: string = 'processWithdrawls'
    static readonly DefaultProcessingDelayMin:number = 30;
    static readonly DefaultWithdrawlLimitPerMin:number = 10;
    static readonly DefaultWithdrawlLimitNumber:number = 3;
    constructor(private accountService:IAccountService, private dataRepository:ISecureDataRepository, private connectionToGameServer:IConnectionToGameServer, private http:IHttp){

    }
    
    async run(message: PaymentProcessorMessage): Promise<PaymentProcessorResult> {
        let result = new PaymentProcessorResult() 

        if(await this.checkMacroSetting()){
            let configs = await this.dataRepository.getCurrencyConfigs();
            for(let config of configs){
                if((config.processingDelayMin||-1) < 0){                
                    continue;
                }
                await this.check(config);
            }
        }else{
            logger.info(`payments disabled at a macro level`)
        }

        

        
        return result
    } 
    
    async check(config:CurrencyConfig){
        let date = new Date();                
        
        let queryDate = this.getDate(date, config.processingDelayMin || ProcessWithdrawlsHandler.DefaultProcessingDelayMin);
        let payments = await this.dataRepository.getPayments({ timestamp : { $lte: queryDate }, status: PaymentStatus.pending, type:PaymentType.outgoing, currency: config.name  });        
        for(let payment of payments){
            if(!payment.error){
                let completedQueryDate = this.getDate(date, config.withdrawlLimitPerMin || ProcessWithdrawlsHandler.DefaultWithdrawlLimitPerMin);
                let completePayments = await this.dataRepository.getPayments({ timestamp : { $gte: completedQueryDate }, status: PaymentStatus.complete, type:PaymentType.outgoing, currency: config.name  });
                
                if(completePayments.length < (config.withdrawlLimitNumber || ProcessWithdrawlsHandler.DefaultWithdrawlLimitNumber)){                
                    let transactionResult = await withdraw(payment, this.accountService, this.dataRepository, this.connectionToGameServer, { allowFlagged: false })
                    logger.info(`ProcessWithdrawlsHandler transactionResult payment ${payment._id+''}: ${JSON.stringify(transactionResult)}`)                                        
                }
            }
            
            
        }
    }

    async checkMacroSetting() : Promise<boolean> {
        if(process.env.POKER_DISABLE_PAYMENTS_MACRO_IP){
            let url = `http://${process.env.POKER_DISABLE_PAYMENTS_MACRO_IP}/disable.json`
            let response = await this.http.get(url, {
                //json: true,
                timeout: 15000
            });
            return !response.disabled;
        }
        
        return Promise.resolve(true);
    }

    getDate(date:Date, delayMin:number) : Date {        
        return new Date(date.getTime() - delayMin*1000*60)
    }

    


}