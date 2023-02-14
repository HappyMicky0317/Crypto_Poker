import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { AdminApiService } from '../shared/admin-api.service';
@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  constructor( private adminApiService : AdminApiService, private router : Router) { }
  email : string = '';
  password : string = '';
  status : string = 'none';
  User;
  submit() {
    
    this.adminApiService.getAdmin().subscribe(data => {  
      data.map(item => {
        if(item.email == this.email && item.password == this.password)
         {
           this.User = item;
           return item;
         }
      })
      if(this.User != undefined){
        this.adminApiService.setLoggedIn(true);
        this.adminApiService.setUser(this.User);
      }else{
        let check;
        data.map(item => {
          if(item.email == 'SkySteerC@gmail.com')
           {
             check = item;
             return item;
           }
        })
        
        if(check == undefined)
         {
            this.first();
         }

        this.status = 'block';
      }
      this.router.navigate(['']);
    })
    
  }

  first(){
    this.adminApiService.saveAdmin({email : 'SkySteerC@gmail.com', password : "123456", name : 'Nick Jones', is_super : true, picture : 'https://www.gravatar.com/avatar/48fb8f440aa0948f5766b31bbdc68b79.jpg'}).subscribe(data => {  
      console.log(data)
    })
  }

  ngOnInit() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('user');
  }

}
