import {User} from "../model/User";
import {IDataRepository} from "../services/documents/IDataRepository";
import { Currency } from "../../../poker.ui/src/shared/Currency";
import { DbGameResults } from "../model/table/DbGameResults";

export class MergeUser {
  async run(mergeFromGuid: string, mergeToGuid: string, dataRepository:IDataRepository) : Promise<MergeUserResult> {
    
    let result:MergeUserResult = new MergeUserResult(false, '');
    let mergeFrom: User = await dataRepository.getUser(mergeFromGuid);
    // for(let account of mergeFrom.accounts){
    //   if(account.currency.toLowerCase()!== Currency.free && account.balance > 0){
    //     result.errorMessage = `mergeFrom has balance of ${account.balance} in currency ${account.currency}`;
    //     return result;
    //   }
    // }
    
    let games : DbGameResults[] = await dataRepository.getGames(null, mergeFromGuid, null);
    result.errorMessage = `test`;
    let sharedGameCount:number = 0;
    for(let game of games){
      if(game.players.find(p=>p.guid===mergeToGuid) != null){
        sharedGameCount++;
      }
    }
    if(sharedGameCount > 0){
      result.errorMessage = `cannot merge as players have played ${sharedGameCount} hand(s) together`;
      return result;
    }
    let mergeTo: User = await dataRepository.getUser(mergeToGuid);
    if (mergeFrom != null && mergeTo != null) {
      await dataRepository.mergeGames(mergeFromGuid, mergeToGuid);
      await dataRepository.mergePayments(mergeFromGuid, mergeToGuid);
      result.success = true;
    }  
    return result;  
  }
}

export class MergeUserResult{
  constructor(public success:boolean, public errorMessage:string){}
}