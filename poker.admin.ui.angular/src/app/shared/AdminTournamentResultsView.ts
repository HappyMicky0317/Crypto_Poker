export class AdminTournamentResultsView {
  hasAwardedPrizes:boolean;
  canAwardPrizes:boolean;
  results :TournamentResultView[] = [];
}

export class TournamentResultView{
      
  constructor(public screenName:string, public placing: number, public prize:string){

  }
}
