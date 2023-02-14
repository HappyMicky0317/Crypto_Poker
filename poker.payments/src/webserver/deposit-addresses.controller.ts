import { Router, Request, Response } from 'express';
import { ISecureDataRepository } from '../repository/ISecureDataRepository';



export class DepositAddressesController{
    router: Router = Router();    
    constructor(private dataRepository:ISecureDataRepository){
        this.setupRoutes();
    }

    setupRoutes(){
        this.router.get('/', async (req: Request, res: Response) => {
            let currenyConfig = await this.dataRepository.getCurrencyConfig(req.query.currency)
            let addresses = await this.dataRepository.getAddressesByCurrency(req.query.currency);            
            res.send({ addresses:addresses, xpub: currenyConfig.xpub});
        });                
    }
}


