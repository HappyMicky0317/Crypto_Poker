import { JoinTableRequest as ClientJoinTableRequest } from './../../../poker.ui/src/shared/ClientMessage';
import { WebSocketHandle } from "../model/WebSocketHandle";
import { ListTablesRequest } from "../../../poker.ui/src/shared/ClientMessage";
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { DataContainer } from "../../../poker.ui/src/shared/DataContainer";
import { IPokerTableProvider } from "../services/IBroadcastService";
import { IDataRepository } from '../services/documents/IDataRepository';
import { User } from '../model/User';
import { UserTableAccount } from '../model/TableBalance';
import { Logger, getLogger} from "log4js";
import { TableProcessorMessage } from '../admin/processor/table-processor/TableProcessor';
import { JoinTableResult } from '../model/table/JoinTableResult';
import { JoinTableRequest } from '../model/table/JoinTableRequest';
const logger: Logger = getLogger();

export class JoinTableRequestHandler extends AbstractMessageHandler<ClientJoinTableRequest>{

  constructor(private pokerTableProvider: IPokerTableProvider, private dataRepository: IDataRepository) {
    super();

  }

  async handleMessage(handle: WebSocketHandle, joinTableRequest: ClientJoinTableRequest): Promise<any> {


    let result: JoinTableResult = new JoinTableResult();
    let table = this.pokerTableProvider.findTable(joinTableRequest.tableId);
    if (!table)
      return;

    let dbUser = await this.dataRepository.getUser(handle.user.guid)

    let user = dbUser || handle.user;
    let invalidAmount = false;
    let amount:number;
    //joinTableRequest.amount is deserialized as a string
    if(typeof(joinTableRequest.amount) === 'string'){
      amount = parseFloat(joinTableRequest.amount);
      if (isNaN(amount)) {
        invalidAmount = true;
     }
    }
    else{
      invalidAmount = true;
     }
    if(invalidAmount){
      handle.sendError(`request amount of ${joinTableRequest.amount} is invalid`);
      return;
    }


    joinTableRequest.amount = amount;
    let request = new JoinTableRequest(joinTableRequest.seat, user.guid, user.screenName, user.gravatar, joinTableRequest.amount);

    let account = await this.dataRepository.getUserAccount(user.guid, table.tableConfig.currency);
    let playerBalance = account == null ? 0 : account.balance;
    if (request.stack > playerBalance) {
      result.errorMessage = `request stack size of ${request.stack} exceeds player balance of ${playerBalance}`;
    } else {
      result = table.validateJoinTable(request);
    }

    if (result.success) {
      if (!dbUser) {
        await this.dataRepository.saveUser(handle.user)
      }
      await this.dataRepository.updateUserAccount(handle.user.guid, account.currency, -request.stack, account.updateIndex)
      let tableId = table.tableConfig._id.toString();
      let updateResult: any = await this.dataRepository.updateTableBalance(tableId, new UserTableAccount(user.guid, user.screenName, request.stack))
      if (updateResult.result.nModified !== 1) {
        throw new Error(`updateTableBalance: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${user.guid} stack: ${request.stack} tableId: ${tableId}`);
      } 

    } else {
      handle.sendError(result.errorMessage);
      return Promise.resolve(null);
    }
    let tMessage = new TableProcessorMessage(table);
    tMessage.joinTableRequest = request;
    table.sendTableProcessorMessage(tMessage);
   

  }
}