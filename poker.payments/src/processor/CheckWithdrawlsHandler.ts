import { IPaymentProcessorMessageHandler } from "./PaymentProcessor";
import { PaymentProcessorResult, PaymentProcessorMessage } from "./PaymentProcessorMessage";
import { IAccountService } from "../services/AccountService";
import { IConnectionToGameServer } from "../services/ConnectionToGameServer";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { getAdminEndpoint, getAdminEndpointResult } from "../helpers";
import environment from "../environment";
import { Payment } from "../../../poker.engine/src/model/Payment";
import { PaymentType } from "../../../poker.ui/src/shared/PaymentType";
import { Logger, getLogger } from "log4js";
var logger:Logger = getLogger();
import { CurrencyUnit } from "../../../poker.ui/src/shared/Currency";
import { Decimal } from "../../../poker.ui/src/shared/decimal";
import { to } from "../../../poker.engine/src/shared-helpers";
import { ITelegramService } from "../../../poker.engine/src/framework/telegram/ITelegramService";
import { PaymentStatus } from "../../../poker.ui/src/shared/PaymentStatus";
import { IHttp } from "../../../poker.engine/src/services/IHttp";


export class CheckWithdrawlsHandler implements IPaymentProcessorMessageHandler {
    
    typeName: string = 'checkWithdrawls'

    constructor(private dataRepository:ISecureDataRepository, private http:IHttp, private telegramService:ITelegramService){

    }
    
    async run(message: PaymentProcessorMessage): Promise<PaymentProcessorResult> {
        let result = new PaymentProcessorResult()

        let lastWithdrawl = await this.dataRepository.getLastOutgoingPayment();        
        let connectionConfig = getAdminEndpointResult();
        let endpoint = connectionConfig.endpoint + '/api/payments-since';
        if(lastWithdrawl){
            endpoint += `?id=${lastWithdrawl._id.toString()}`;
        }
        let options = {            
            headers: connectionConfig.headers,
            json: true,
            timeout: 5000
        };
        
        let payments = <Payment[]> await this.http.get(endpoint, options)
        .catch(((r:any)=>{
            logger.info(`checkWithdrawls failed: ${r}`);
        }))
        if(payments){
            for(let payment of payments){
                await this.importPayment(payment);
            }
        }
        
        return Promise.resolve(result);
    }    

    private async importPayment(payment:Payment){
        let dbPayment = await this.dataRepository.getPaymentById(payment._id);
        if(!dbPayment){
            if(payment.type == PaymentType.outgoing){
                if(payment.status){
                    if(payment.status==PaymentStatus.pending){
                        await this.importOutgoingPendingPayment(payment);                                        
                    }else {
                        await this.dataRepository.savePayment(payment);
                    }       
                }else{
                    logger.warn(`payment status not defined! ${JSON.stringify(payment)}`);
                }
                         
                
            }else if(payment.type == PaymentType.incoming){
                await this.dataRepository.savePayment(payment);//tournament transfer
            }
            else{
                logger.warn(`received payment ${payment._id} with unexpected payment type ${payment.type}`);
            }
        }
    }

    private async importOutgoingPendingPayment(payment:Payment) : Promise<void> {
        let currencyConfig = await this.dataRepository.getCurrencyConfig(payment.currency);
        let amount = new Decimal(payment.amount).dividedBy(CurrencyUnit.getCurrencyUnit(payment.currency))
        let shouldFlag = amount.greaterThan(new Decimal(currencyConfig.flagAmount))
        payment.status = shouldFlag ? PaymentStatus.flagged : PaymentStatus.pending;
        let processingDelayStr:string = '';
        if(!shouldFlag){
            processingDelayStr = ' Processing delay:'
            processingDelayStr += (currencyConfig.processingDelayMin||-1) < 0 ? 'disabled' : `${currencyConfig.processingDelayMin} min`;
        }
        
        let txtMsg = `Received new withdrawl (${payment.status}) from ${payment.screenName} for ${amount.toString()} ${payment.currency}.${processingDelayStr}`;
        let sent = await this.telegramService.sendTelegram(txtMsg);
        if(!sent){
            logger.info(`not saving payment ${payment._id} as telegram send failed`)
        }else{
            
            payment.timestamp = new Date();//use our date as timestamp to avoid hack where malicious user predates the timestamp
            
            this.dataRepository.savePayment(payment);
            
        }
    }


}