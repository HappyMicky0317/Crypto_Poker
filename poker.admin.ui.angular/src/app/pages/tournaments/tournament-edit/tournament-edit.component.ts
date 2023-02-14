import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TournamentService } from '../tournament-service';
import { NgForm, FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { TournmanetView, BlindConfigView } from '../../../shared/tournmanet-view.model';
import {NgbDateStruct, NgbCalendar, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';
import { AdminApiService } from '../../../shared/admin-api.service';

@Component({
  selector: 'tournament-edit',
  templateUrl: './tournament-edit.component.html',
  styleUrls: ['tournament-edit.component.css'] 
})
export class TournamentEditComponent implements OnInit {
  saving: boolean;
  tournament: TournmanetView;
  form: FormGroup;
  currencies:string[] = []
  model: NgbDateStruct;
  prizeTotal:string;
  

  constructor(private route: ActivatedRoute, private apiService: AdminApiService, private formBuilder: FormBuilder, private router:Router) {
    
  }



  toNgbDateStruct(date:Date){
    let ngbDate = {'year': date.getFullYear(), 'month': date.getMonth()+1, 'day': date.getDate(), hour: date.getHours(), minute: date.getMinutes()};
    //console.log('ngbDate', ngbDate);
    
    return ngbDate;
  }

  fromNgbDateStruct(date: NgbDateStruct, time: NgbTimeStruct){
    //{year: 2018, month: 9, day: 25, hour: 21, minute: 35
    return new Date(date.year, date.month-1, date.day, time.hour, time.minute).toISOString();
  }

  ngOnInit() {
    
    this.form = this.formBuilder.group({
      'name': new FormControl("", Validators.required),
      'currency': new FormControl("", Validators.required),
      'startingChips': new FormControl("", Validators.required),
      'minPlayers': new FormControl("", Validators.required),
      'maxPlayers': new FormControl("", Validators.required),
      'playersPerTable': new FormControl("", Validators.required),
      'timeToActSec': new FormControl("", Validators.required),
      'lateRegistrationMin': new FormControl("", Validators.required),
      'awardPrizesAfterMinutes': new FormControl("", Validators.required),
      'startDate': ["", Validators.required],
      'startTime': ["", Validators.required],    
      'prizes': this.formBuilder.array([  ]),
      'blindConfig': this.formBuilder.array([  ]),
      'mailchimpSendTimeMin': new FormControl(""),
      'telegramSendTimeMin': new FormControl(""),
      'buyIn': new FormControl(""),
      'housePrize': new FormControl(""),
      'rebuyForMin': new FormControl(""),
      'rebuyAmount': new FormControl(""),
    })

    this.apiService.getCurrencies()
    .subscribe(data => {
      this.currencies.push(...data);
      
    }, 
    (e) => console.error(e));
    
    this.route.params.subscribe((params: Params) => {
      let id = params['id']
      
      if(id==='new'){
        this.tournament = this.getDefaultTournament();
        this.setTournament();
      }else{
        this.apiService.getTournaments(id)
      .subscribe(data => {        
        this.tournament = data[0];          
        this.setTournament();      
      }, 
      (e) => console.error(e));
      }
      
    })
  }

  navigateToUser(guid:string){
    console.log('guid', guid);
    this.router.navigate(['/users', guid]);
  }

  setTournament(){
    
    
    //this.tournament.registrations.push({guid:'foo', screenName:'bar'})
    this.form.patchValue(this.tournament);    
    
    let prizesArr = <FormArray>this.form.get('prizes');
    this.clearFormArray(prizesArr);
    for(let prizeControl of this.tournament.prizes.map(p=>this.formBuilder.control(p))){
      prizesArr.push(prizeControl)
    }

    let blindsArr = <FormArray>this.form.get('blindConfig');
    this.clearFormArray(blindsArr);
    for(let blindConfigControl of this.tournament.blindConfig.map(b=>this.createBlindConfig(b.smallBlind, b.bigBlind, b.timeMin))){
      blindsArr.push(blindConfigControl)
    }
     let startTime = this.toNgbDateStruct(new Date(this.tournament.startTime));
     this.form.get('startDate').setValue(startTime)
     this.form.get('startTime').setValue(startTime)   
     this.setPrizeTotal(); 
  }

  clearFormArray(formArray:FormArray){
    while (formArray.length !== 0) {
      formArray.removeAt(0)
    }
  }

  deleteTournament(){
    if(confirm('Delete Tournament?')){
      this.apiService.deleteTournament(this.tournament._id)
      .subscribe((result:any)=>{
        if(result.success){
          alert('Tournament deleted')
          this.router.navigate(['../'], { relativeTo: this.route})
        }
      })
    }
    
  }

  getPrizesControls(){
    return (<FormArray>this.form.get('prizes')).controls;
  }
  getBlindControls(){
    return (<FormArray>this.form.get('blindConfig')).controls;
  }

  addPrize(){
    let items = this.form.get('prizes') as FormArray;
    items.push(this.formBuilder.control(''));
  }

  addBlindConfig(){
    let items = this.form.get('blindConfig') as FormArray;
    items.push(this.createBlindConfig(undefined, undefined, undefined));
  }

  createBlindConfig(smallBlind:number, bigBlind:number, timeMin:number): FormGroup {
    return this.formBuilder.group({
      smallBlind: smallBlind,
      bigBlind: bigBlind,
      timeMin: timeMin
    });
  }

  prizeInputKeyup(){
    
    this.setPrizeTotal();
  }
  
  setPrizeTotal(): void {
    let total = 0;
    for(let prize of this.form.value.prizes){
      if(!isNaN(parseFloat(prize))){
        total += parseFloat(prize)*100000000;
      }
    }
    this.prizeTotal =  total/100000000 + '';    
  }

  getDefaultTournament(): TournmanetView {
    let view = new TournmanetView();
    view.name = 'Sunday Tournament';
    view.currency = 'dash';
    view.startTime = new Date(new Date().getTime() + (1 * 60 * 60 * 1000)).toISOString();
    view.prizes = ['0.5', '0.25', '0.10', '0.05', '0.04', '0.03', '0.02', '0.01'];
    view.startingChips = 1000;
    view.playersPerTable = 6;
    view.minPlayers = 2;
    view.maxPlayers = 102;
    view.blindConfig = [];
    view.timeToActSec = 30;
    view.lateRegistrationMin = 20;
    view.awardPrizesAfterMinutes = 1;
    let date = new Date();
    date.setHours(20, 30, 0,0);
    date.setDate(date.getDate() + 7 - date.getDay());    
    //view.startTime = "2018-11-21T12:30:00.000Z"
    view.startTime = date.toISOString();
    view.blindConfig.push(new BlindConfigView(10, 20, 20));
    view.blindConfig.push(new BlindConfigView(20, 40, 20));
    view.blindConfig.push(new BlindConfigView(40, 80, 15));
    view.blindConfig.push(new BlindConfigView(80, 160, 15));
    view.blindConfig.push(new BlindConfigView(150, 300, 15));
    view.blindConfig.push(new BlindConfigView(300, 600, 15));
    view.blindConfig.push(new BlindConfigView(500, 1000, 15));
    view.blindConfig.push(new BlindConfigView(1000, 2000, 15));
    view.mailchimpSendTimeMin = 120;
    view.telegramSendTimeMin = 15;
    view.buyIn = 0.01;
    view.housePrize = 1;
    view.rebuyForMin = 60;
    view.rebuyAmount = 0.01;
    

    return view;
  }


  onSubmit() {
    let tournament = this.form.value;      
    let total = tournament.prizes.reduce((a,b)=> a + parseFloat(b), 0);
    if(total !== 0 && total !== 1){
      alert('Percentage prizes must add up to 1');
      return;
    }

    if(this.form.valid){
      this.saving = true;            
      
      tournament._id = this.tournament._id;
      console.log('tournament', tournament)
      tournament.startTime = this.fromNgbDateStruct(this.form.get('startDate').value, this.form.get('startTime').value);
      delete tournament.startDate;

      this.apiService.saveTournament(this.form.value)
        .subscribe((data: any) => {
          this.tournament = data.tournament;
          this.saving = false;
          alert(`Saved Tournament`)
        })
      
    }else{
      alert(JSON.stringify(this.form.errors))
    }
    
    
  }



}
