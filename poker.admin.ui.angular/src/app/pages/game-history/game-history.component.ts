import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../shared/admin-api.service';

@Component({
  selector: 'game-history',
  templateUrl: './game-history.component.html',
  styleUrls: ['./game-history.component.scss', './cards.scss']
})
export class GameHistoryComponent implements OnInit {

  constructor(private apiService: AdminApiService) { }
  

  games: any[] = [];
  loading: boolean;
  screenNames: string;
  tableId: string = "";
  tournamentId: string = "";
  userGuid: string;
  errorMessage: string;
  tables: any[] = [];
  tournaments: any[] = [];
  loadingTables:boolean = true;

  ngOnInit() {
    this.loadTables();
    this.apiService.getTournaments(null)
      .subscribe(data => {
        this.tournaments = data;
      },
        (e) => this.errorMessage = e);
  }

  loadTables(){
    this.tables = [];
    this.loadingTables = true;
    this.apiService.getTables(this.tournamentId)
      .subscribe(data => {
        this.tables = data;
        this.loadingTables = false;
      });
  }

  userGuidKeyup(event) {
    
    if (event.keyCode === 13) {
      this.loadGames();
    }
  }

  tournamentChanged(){
    this.loadTables();
  }

  getPlayer(game, guid) {
    let player = game.players.find(p=>p.guid===guid);
    return player.screenName + ' at Seat ' + (player.seat+1);
  }

  getWinningHand(potResult, guid) {
    if (potResult.playerHandEvaluatorResults.length) {
      let result = potResult.playerHandEvaluatorResults.find(evalResult => evalResult.player.guid === guid);      
      return result;
    }
    return '';
  }

  getBestHand(potResult, guid) {
    if (potResult.playerHandEvaluatorResults.length) {
      let result = potResult.playerHandEvaluatorResults.find(evalResult => evalResult.player.guid === guid);
      let winningHand = result.handRankEnglish;
      return winningHand;
    }
    return '';
  }

  tableIdChanged() {
    this.loadGames();
  }

  loadGames() {
    this.games = [];
    this.screenNames = '';    

   
    this.loading = true;
    
    this.apiService.getGameHistory(this.tableId, this.userGuid, this.tournamentId)
      .subscribe((gamesArr:any[]) => {
        this.loading = false;
        this.games = gamesArr;
        
        
        let arr = [];
        for (let game of this.games) {
          if (this.userGuid) {
            let player = game.players.find(p => p.guid === this.userGuid);
            if (arr.indexOf(player.screenName) === -1)
              arr.push(player.screenName);
            this.screenNames = arr.join();            
          }
          let currencyUnit = 1;
          if(game.currency !='tournament'){
            currencyUnit = game.currency == 'usd' ? 100 : 100000000;
          }          
          
          for(let player of game.players){              
            player.profitLossUsd = (player.profitLoss/currencyUnit*game.exchangeRate).toFixed(2);
          }
          for(let potResult of game.potResults){
            for(let allocation of potResult.allocations){
              allocation.amountUsd = (allocation.amount/currencyUnit*game.exchangeRate).toFixed(2);
            }
          }
          for(let audit of game.auditEvents){
            audit.betAmount /= currencyUnit;
          }
        }
        
      });
  }




}
