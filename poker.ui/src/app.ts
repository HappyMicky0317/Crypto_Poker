import { autoinject } from "aurelia-framework";
import { Router, RouterConfiguration } from 'aurelia-router';
import {AccountSettings} from "./account-settings";
import { DialogService } from 'aurelia-dialog';
import { ApiService } from "./lib/api-service";
import * as $ from 'jquery';
import { LoginPopup } from "./login-popup";
import { Util } from "./lib/util";

@autoinject()
export class App {
  router: Router;
  message: string = 'Tournament Starting Soon - ';
  infoBannerActive:boolean = true;
  infoBannerDiv: HTMLElement;
  year:number = new Date().getFullYear();
  get appName() : string {
    return this.apiService.version == null ? '': this.apiService.version.appName;
  }
  get appSupportEmail() : string {
    return this.apiService.version == null ? '': this.apiService.version.appSupportEmail;    
  }  
  
  constructor(private dialogService: DialogService, private apiService: ApiService, private util: Util) {  }
  configureRouter(config: RouterConfiguration, router: Router){
    config.map([
      { route: '', name: 'home', moduleId: 'poker-table'},
      { route: 'faq/', moduleId: 'faq', name:'faq' },
      { route: 'duplicate-ip/', moduleId: 'duplicate-ip', name:'duplicate-ip' },
      { route: 'logged-out/', moduleId: 'logged-out', name:'logged-out' },
      { route: 'activate/', moduleId: 'activate', name:'activate' },
      { route: 'reset/', moduleId: 'reset-password-form', },
    ]);

    this.router = router;
  }

  openLoginWindow(){
    this.ensureOnHomePage();
    this.dialogService.open({ viewModel: LoginPopup })    ;    
  }

  async openMyAccount():Promise<void> {
    
    this.ensureOnHomePage();
    this.apiService.loadSounds();    
    this.openAccountDialog();    
  }
  async ensureOnHomePage():Promise<void>{
    if (this.router.currentInstruction.config.name !== 'home') {
      this.router.navigate('');     
      await this.apiService.waitForSocket();
    } 
    
  }
  openAccountDialog() {
    this.dialogService.open({ viewModel: AccountSettings, lock: false });
  }
  closeBanner(){    
    $(this.infoBannerDiv).fadeOut("slow");
    //setTimeout(()=> { this.infoBannerActive = false;}, 1000);
  }
}
