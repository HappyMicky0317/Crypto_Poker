import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AdminApiService } from '../../../shared/admin-api.service';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { UserDetailView } from './UserDetailView';

@Component({
  selector: 'user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss']
})
export class UserEditComponent implements OnInit {

  user: UserDetailView;
  form: FormGroup;
  loading: boolean = true;
  saving: boolean;
  saveSuccess: boolean;
  editAccounts:boolean;
  errorMessage:string;
  manualAddCurrency:string;
  manualAddAmount:string;
  manualAddComment:string;
  currencies: string[] = [];

  get accounts(): FormArray {
    return this.form.get('accounts') as FormArray;
  }

  constructor(private route: ActivatedRoute, private apiService: AdminApiService, private formBuilder: FormBuilder, private router:Router) { }

  ngOnInit() {
    
    this.user= new UserDetailView();
    this.user.accounts = [];
    this.form = this.formBuilder.group({
      'guid': [''],     
      'email': ['', Validators.required],     
      'screenName': [''],     
      'password': [''],     
      'activated': [''],     
      'notifyUserStatus': [''],     
      'disabled': [''],     
      'accounts': this.formBuilder.array([]),
    })
    
    this.route.params.subscribe((params: Params) => {
      let id = params['id']

      this.apiService.getUser(id)
        .subscribe(data => {
          this.loading = false;
          this.saving = false;
          this.editAccounts = false;
          this.setUser(data);
          
        },
          (e) => console.error(e));

    })

    this.apiService.getCurrencies()
    .subscribe(data => {
      this.currencies.push(...data);      
    }, 
    (e) => console.error(e));
  }

  setUser(user:any){
    this.form.reset();
    this.accounts.controls.splice(0)
    this.user = user;
    if(this.user.accounts){
      for (let account of this.user.accounts) {
        let group = this.formBuilder.group({
          currency: this.formBuilder.control(account.currency),
          balance: new FormControl(account.balance, Validators.required)
        });
        (<FormArray>this.form.get('accounts')).push(group)
      }
    }
    
    this.form.patchValue(this.user);
  }

  manaullyAddFundsToAccount(){
    
    this.saving = true;
    let request = {
      guid: this.user.guid,
      currency: this.manualAddCurrency,
      amount: this.manualAddAmount,
      comment: this.manualAddComment
    }
    this.apiService.addFundsToAccount(request)
    .subscribe((result:{success:boolean, user:any, message:string })=>{
      if(result.success){
        this.setUser(result.user);        
        alert('Added Funds');
      }else{
        alert(result.message);
      }
      this.saving = false;
    });
  }

  editAccountsCheckChanged(){
    this.editAccounts=!this.editAccounts;
  }

  createAccount(smallBlind:number): FormGroup {
    return this.formBuilder.group({
      balance: smallBlind     
    });
  }

  save(){
    this.saving = true;
    this.saveSuccess = false;
    console.log('value', this.form.value)
    this.apiService.saveUser(this.form.value)
        .subscribe((data: any) => {          
          this.setUser(data.user);
          this.saving = false;
          this.saveSuccess = true;
        })
  }

  delete(){
    
    if(confirm('Delete User?')){
      console.log('this.form.value.guid', this.form.value.guid);

      this.apiService.deleteUser(this.form.value.guid)
      .subscribe((result:any)=>{
        if(result.success){
          alert('User deleted')
          this.router.navigate(['../'], { relativeTo: this.route})
        }
      })
    }
  }

  
  

}
