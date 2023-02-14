import {Aurelia} from 'aurelia-framework'
import environment from './environment';
import { ApiService } from './lib/api-service';

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources')
    .plugin('aurelia-dialog', config => {
      config.useDefaults();
      config.settings.lock = true;
      config.settings.centerHorizontalOnly = false;
      config.settings.startingZIndex = 5;
      config.settings.keyboard = true;
    });

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }  

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }
  
  
  aurelia.start().then(() => {    
    //aurelia.setRoot();       
    
    //comment in if country check required
    var api = <ApiService>aurelia.container.get(ApiService);
    if(environment.debug){
      aurelia.setRoot();
    }else{
      api.countryCheck()
      .then((result:any) =>{
        if(result.success === false)
          window.location.href = `/restricted.html?c=${result.country}`;        
        else
          aurelia.setRoot();       
      })
      .catch((reason: any) => {
        console.error(reason);
      });    
    }
    
  });
}
