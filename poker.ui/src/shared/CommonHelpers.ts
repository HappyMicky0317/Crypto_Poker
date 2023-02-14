import { AutoOptionResult } from "./AutoOptionResult";
import { Currency } from "./Currency";

export class CommonHelpers  {
    public static allowAutoFold(guid:string, currentPlayers:IPlayer[]):AutoOptionResult {    
        
        let result :AutoOptionResult = { allowAutoFold:false, allowAutoCheck: false,autoFoldButtonText:'' }                    
        let playerNextToAct = currentPlayers.find(s=>s.myturn);    
        let currentPlayer = currentPlayers.find(p=>p.guid===guid);    
        if(playerNextToAct && currentPlayer && currentPlayer.playing && !currentPlayer.myturn && !currentPlayer.hasFolded){
          let betAmounts = currentPlayers.map(s=>s.bet);
          let maxBet = Math.max.apply(null, betAmounts);                      
          result.allowAutoFold = true;  
          let hasCalledOrRaised = currentPlayer.hasCalled || currentPlayer.hasRaised;
          if(currentPlayer.bet == maxBet && !hasCalledOrRaised){
            result.allowAutoCheck = true;
          }
          if(hasCalledOrRaised && currentPlayer.bet == maxBet)
            result.autoFoldButtonText = 'Fold any Raise';
          else
            result.autoFoldButtonText = maxBet > 0 && currentPlayer.bet < maxBet  ? 'Fold':'Check/Fold';
        }
    
        return result;
      }

    public static getTxHashLink(txHash:string, currency:string){
      if(currency==Currency.dash){
        return `https://chainz.cryptoid.info/dash/tx.dws?${txHash}.htm`;
      }else if(currency==Currency.eth || currency=='ukg'|| currency=='chp'){
        return `https://etherscan.io/tx/${txHash}`;
      }else if(currency==Currency.btc){
        return `https://www.blockchain.com/btc/tx/${txHash}`;
      }
      return txHash;
    }
}

export interface IPlayer{
  myturn: boolean;
  playing: boolean;
  hasFolded: boolean;
  hasCalled: boolean;
  hasRaised: boolean;
  bet: number;
  guid: string;
}

export default function to(promise:Promise<any>) {  
  return promise.then(data => {
     return [null, data];
  })
  .catch(err => [err]);
}


export function getCardSuit(card: string) {
  let suit = '';  
  if (card === 'S')
    suit = '♠';
  else if (card === 'C')
    suit = '♣';
  else if (card === 'H')
    suit = '♥';
  else if (card === 'D')
    suit = '♦';
  else
    throw new Error('invalid lastChar:' + card);
  return suit;
}

export function isNumeric(n:any) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function numberWithCommas(x:any):string {
  if (isNumeric(x))
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return '';
}

export function ordinal_suffix_of(i:number):string {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
}