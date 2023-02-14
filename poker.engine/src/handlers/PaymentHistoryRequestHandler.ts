import { IDataRepository } from './../services/documents/IDataRepository';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer, GlobalChatResult, ChatMessage, PaymentHistoryResult, PaymentHistoryRowView } from '../../../poker.ui/src/shared/DataContainer';
import { IBroadcastService } from '../services/IBroadcastService';
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { GlobalChatRequest, PaymentHistoryRequest } from '../../../poker.ui/src/shared/ClientMessage';
import { PaymentType } from '../../../poker.ui/src/shared/PaymentType';
import { ordinal_suffix_of } from '../../../poker.ui/src/shared/CommonHelpers';
var _ = require('lodash');

export class PaymentHistoryRequestHandler extends AbstractMessageHandler<PaymentHistoryRequest> {
    
    constructor(private dataRepository:IDataRepository) {
        super();
    }

   
    async handleMessage(wsHandle: WebSocketHandle, request: PaymentHistoryRequest): Promise<any> {
        let result = new PaymentHistoryResult();        
        result.payments = [];
        let currencyConfigs = await this.dataRepository.getCurrencyConfigs();
        
        for(let payment of await this.dataRepository.getPayments({guid: wsHandle.user.guid})){
            let config = currencyConfigs.find(c=>c.name==payment.currency);
            let view = new PaymentHistoryRowView();
            view.amount = payment.amount;
            view.confirmations = payment.confirmations;
            view.currency = payment.currency;
            view.requiredConfirmations = config.requiredNumberOfConfirmations;            
            view.timestamp = payment.timestamp.toISOString();
            view.type = payment.type;
            view.txHash = payment.txId;
            if(payment.tournamentId){
                let type = '';
                if(payment.type == PaymentType.outgoing){
                    type = payment.isTournamentRebuy ? `Rebuy`: `Buy in`;                    
                }else if(payment.type == PaymentType.incoming){
                    let placing = '';
                    if(payment.tournamentPlacing){
                        placing = ordinal_suffix_of(payment.tournamentPlacing);
                    }
                    type = `${placing} Place`
                }
                view.comment = `${type} - ${payment.tournamentName}`;
                
            }else{
                view.comment = payment.comment;
                view.status = payment.status;
            }
            
            result.payments.push(view);
        }

        let data = new DataContainer();
        data.paymentHistoryResult = result;
        wsHandle.send(data)

        return Promise.resolve();
    }

    
}