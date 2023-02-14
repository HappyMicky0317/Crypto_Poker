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
import { getAdminEndpoint } from '../helpers';
const logger:Logger = getLogger();


export class RemoteAuthController {
    router: Router = Router();    
    constructor(private dataRepository:ISecureDataRepository, private paymentProcessor:PaymentProcessor){
        this.setupRoutes();
    }

    setupRoutes(){
        this.router.get('/', async (req: Request, res: Response) => {
                        
            
            let result : { url:string, base64Pass: string } = {
                url: getAdminEndpoint(),
                base64Pass: process.env.POKER_ADMIN_BASE64
            };
            
            res.send(result);
        }); 

       

    }
}


