import { Component, OnInit } from '@angular/core';
import { AdminApiService } from '../../../shared/admin-api.service';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  loading: boolean = true;
  errorMessage: string;
  users:any[];
  searchTerm:string;
  includeAnon:boolean = false;
  count:number = 50;

  constructor(private apiService:AdminApiService) { }

  ngOnInit() {
    this.fetch()
  }

  searchKeyup(event) {
    if (event.keyCode === 13) {
      this.fetch();
    }
  }

  fetch(){            
    this.apiService.getUsers(this.searchTerm, this.count, this.includeAnon)
      .subscribe(data => {        
        this.users = data;   
        this.loading = false;
      }, 
      (e) => this.errorMessage = e);
  }

}
