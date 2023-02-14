import { autoinject } from "aurelia-framework";
import { ApiService } from "./lib/api-service";

@autoinject()
export class DuplicateIp{
    constructor(private apiService: ApiService) {  }

    get appSupportEmail() : string {
        return this.apiService.version == null ? '': this.apiService.version.appSupportEmail;    
      }  
}