import { Router, Request, Response } from 'express';
import { ISecureDataRepository } from '../repository/ISecureDataRepository';
import { CurrencyConfig, AddressSmall } from '../model/currency-config';
import { EthBlockService } from '../services/EthBlockService';
import { SendCurrencyConfigHandler } from './handlers/SendCurrencyConfigHandler';
import { IAccountService } from '../services/AccountService';



export class CurrencyConfigController{
    router: Router = Router();    
    constructor(private dataRepository:ISecureDataRepository, private sendCurrencyConfigHandler:SendCurrencyConfigHandler, private accountService:IAccountService){
        this.setupRoutes();
    }

    adjustConfig(config:any){
        if(config.masterAccount!=null){
            (<any>config).masterAccountPublic = config.masterAccount.public;
        }
    }
    setupRoutes(){
        this.router.get('/', async (req: Request, res: Response) => {
            let configs = await this.dataRepository.getCurrencyConfigs()
            for(let config of configs){
                this.adjustConfig(config)
            }
            res.send(configs);
        }); 

        this.router.post('/', async (req: Request, res: Response) => {
            let config = req.body;
            config.name = config.name.toLowerCase();
            config.requiredNumberOfConfirmations = parseInt(config.requiredNumberOfConfirmations);
            
            if(req.body._id){
                let configs:CurrencyConfig[] = await this.dataRepository.getCurrencyConfigs();
                let existingConfig = configs.find(n=>n.name == req.body.name);
                Object.assign(existingConfig, req.body);
                config = existingConfig;
            }
            if(config.masterAccountPublic){
                if(config.masterAccount != null){
                    if(!config.masterAccount.private){
                        config.masterAccount.public = config.masterAccountPublic;
                    }                    
                }else{
                    config.masterAccount = new AddressSmall();
                    config.masterAccount.public = config.masterAccountPublic;
                }
                delete config.masterAccountPublic;
            }
            
            
            await this.dataRepository.saveCurrencyConfig(config)
            config = await this.dataRepository.getCurrencyConfig(config.name);
            this.adjustConfig(config)
            res.send(config);
                        
            this.accountService.loadCurrencyConfigs();
            this.sendCurrencyConfigHandler.run();
        });                
    }
}


