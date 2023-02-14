import { IPaymentProcessorMessageHandler } from "./PaymentProcessor";
import { PaymentProcessorResult, PaymentProcessorMessage } from "./PaymentProcessorMessage";
import { IAccountService } from "../services/AccountService";
import { DepositAddressService } from "../../../poker.engine/src/services/DepositAddressService";
import { ISecureDataRepository } from "../repository/ISecureDataRepository";
import { getAdminEndpointResult } from "../helpers";
import { AddressInfo as PokerEngineAddressInfo } from "../../../poker.engine/src/model/AddressInfo";
import { Logger, getLogger } from "log4js";
import { AddressInfo } from "../model/AddressInfo";
import { IHttp } from "../../../poker.engine/src/services/IHttp";
var logger:Logger = getLogger();

export class CheckDepositAddressesHandler implements IPaymentProcessorMessageHandler {
    
    typeName: string = 'checkDepositAddresses'
    connectionConfig:{ endpoint: string, headers: any };
    httpOptions:any;

    constructor(private dataRepository:ISecureDataRepository, private http:IHttp, private accountService:IAccountService){
            this.connectionConfig = getAdminEndpointResult();
            this.httpOptions = {            
                headers: this.connectionConfig.headers,
                json: true,
                timeout: 5000
            };
    }
    
    async run(message: PaymentProcessorMessage): Promise<PaymentProcessorResult> {
        let result = new PaymentProcessorResult()

        let lastAddressInfo = await this.dataRepository.getLastAddressInfo();        

        let endpoint = this.connectionConfig.endpoint + '/api/addressInfo';
        if(lastAddressInfo){
            endpoint += `?id=${lastAddressInfo._id.toString()}`;
        }

        
        let infos = <PokerEngineAddressInfo[]> await this.http.get(endpoint, this.httpOptions)
        .catch(((r:any)=>{
            logger.info(`checkDepositAddresses failed: ${r}`);
        }))
        if(infos){
            for(let info of infos){
                try {
                    await this.importAddressInfo(info);
                } catch (error) {
                    logger.error(error);
                }
            }
        }
        
        return Promise.resolve(result);
    }    

    async getUserDepositIndex(guid:string) : Promise<number>{
        let endpoint = this.connectionConfig.endpoint + `/api/user?guid=${guid}`;
        let user = await this.http.get(endpoint, this.httpOptions);//is UserDetailView
        return user.depositIndex;
    }

    async importAddressInfo(info:PokerEngineAddressInfo) : Promise<void> {
        let existingAddressInfo = this.dataRepository.getAddressInfoById(info._id);
        if(!existingAddressInfo){            
            let addressInfo = new AddressInfo();
            addressInfo._id = info._id;
            addressInfo.userGuid = info.userGuid;
            addressInfo.screenName = info.screenName;
            addressInfo.currency = info.currency;
            let depositIndex = await this.getUserDepositIndex(info.userGuid);
            let currencyConfig = await this.dataRepository.getCurrencyConfig(info.currency);
            let address = await new DepositAddressService().getAddress(info.currency, currencyConfig.xpub, depositIndex);
            if(address === info.address){
                addressInfo.address = address;
                addressInfo.index = depositIndex;
                await this.dataRepository.saveAddress(addressInfo);
                await this.accountService.monitorAddress(addressInfo);
            }else{
                logger.warn(`addresses do not match! received ${info} and using xpub:${currencyConfig.xpub} and ${depositIndex} calculated address=${address}`)
            }
            
        }
    }


}