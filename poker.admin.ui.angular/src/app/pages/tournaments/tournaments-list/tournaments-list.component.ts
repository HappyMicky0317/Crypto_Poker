import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationEnd, Event } from '@angular/router';
import { TournamentService } from '../tournament-service';
import { TournmanetView } from '../../../shared/tournmanet-view.model';
import { AdminApiService } from '../../../shared/admin-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'tournaments-list',
  templateUrl: './tournaments-list.component.html',
  styleUrls: ['./tournaments-list.component.scss']
})
export class TournamentsListComponent implements OnInit {


  tournaments: TournmanetView[] = [];
  loading: boolean = true;
  errorMessage: string;

  constructor(private apiService:AdminApiService, private route:ActivatedRoute, private router:Router) {

  }
  private subscription:Subscription;
  ngOnInit() {
    
    this.subscription = this.router.events.subscribe((event:Event)=>{      
      if (event instanceof NavigationEnd) {
        this.fetch()
    }
    })
    
    this.fetch();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  fetch(){        
    this.apiService.getTournaments(null)
      .subscribe(data => {        
        this.tournaments = data;     
        this.loading = false;   
      }, 
      (e) => this.errorMessage = e);
  }

}
