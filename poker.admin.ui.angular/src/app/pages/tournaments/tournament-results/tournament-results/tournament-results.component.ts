import { Component, OnInit, Input } from '@angular/core';
import { AdminApiService } from '../../../../shared/admin-api.service';

@Component({
  selector: 'tournament-results',
  templateUrl: './tournament-results.component.html',
  styleUrls: ['./tournament-results.component.scss']
})
export class TournamentResultsComponent implements OnInit {

  tournamentResultsView:any = {};
  loadingTournamentResults:boolean;
  _tournamentId:string;
  @Input()
  set tournamentId(value:string){
    this._tournamentId = value;
    this.refreshTournamentResults();    
  }
  

  constructor(private apiService: AdminApiService) { }

  ngOnInit() {
    
  }

  refreshTournamentResults(){
    this.tournamentResultsView = {};
    this.loadingTournamentResults = true;
    this.apiService.getTournamentResults(this._tournamentId)
    .subscribe((data:any)=>{      
      this.tournamentResultsView = data;
      this.loadingTournamentResults = false;
    })
    
  }

  awardPrizes(){
    this.apiService.awardPrizes(this._tournamentId)
    .subscribe((result:{success:boolean, message:string, view:any })=>{
      if(result.success){
        this.tournamentResultsView = result.view;
        console.log('this.tournamentResultsView', this.tournamentResultsView);
        
        alert('Prizes Awarded');
      }else{
        alert(result.message);
      }
    });
    
    
  }

}
