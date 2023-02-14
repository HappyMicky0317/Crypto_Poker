import { Router, Request, Response } from 'express';
import { ISecureDataRepository } from '../repository/ISecureDataRepository';
import { CurrencyConfig, AddressSmall } from '../model/currency-config';
import { EthBlockService } from '../services/EthBlockService';
import { SendCurrencyConfigHandler } from './handlers/SendCurrencyConfigHandler';
import { PaymentProcessorMessage } from '../processor/PaymentProcessorMessage';
import { ManualApprovalRequest } from '../model/ManualApprovalRequest';
import { PaymentProcessor } from '../processor/PaymentProcessor';
import { to } from '../../../poker.engine/src/shared-helpers';
import { Logger, getLogger } from "log4js";
import { CancelPaymentRequest } from '../model/CancelPaymentRequest';
const logger:Logger = getLogger();


export class PaymentsController{
    router: Router = Router();    
    constructor(private dataRepository:ISecureDataRepository, private paymentProcessor:PaymentProcessor){
        this.setupRoutes();
    }

    setupRoutes(){
        this.router.get('/', async (req: Request, res: Response) => {
                        
            
            let payments = await this.dataRepository.getPayments(req.query);
            
            res.send(payments);
        }); 

        this.router.post('/approve', async (req: Request, res: Response) => {
            
            
            let message = new PaymentProcessorMessage();
            message.manualApprovalRequest = new ManualApprovalRequest(req.query.id)
            let [err,data] = await to(this.paymentProcessor.sendMessage(message));
            if(err){
                logger.error(err)
            }else if(data.manualApprovalResult){
                res.send(data.manualApprovalResult);
            }else{
                logger.error('unexpected error PaymentsController')
            }
            
        });

        this.router.post('/cancel', async (req: Request, res: Response) => {
            let message = new PaymentProcessorMessage();
            message.cancelPaymentRequest = new CancelPaymentRequest(req.query.id)
            let [err,data] = await to(this.paymentProcessor.sendMessage(message));
            if(err){
                logger.error(err)
            }else if(data.cancelPaymentResult){
                res.send(data.cancelPaymentResult);
            }else{
                logger.error('unexpected error PaymentsController')
            }
            
        }); 

    }
}


