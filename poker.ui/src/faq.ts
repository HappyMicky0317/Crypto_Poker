import { autoinject } from "aurelia-framework";
import { ApiService } from "./lib/api-service";

@autoinject()
export class Faq {

  constructor(private apiService: ApiService) {  }

    get appSupportEmail() : string {
        return this.apiService.version == null ? '': this.apiService.version.appSupportEmail;    
      }  


  scrollToElement(elementId){
    document.getElementById(elementId).scrollIntoView(true);
    window.scrollBy(0, -100); // Adjust scrolling with a negative value here
    }
}
