
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from '../../../src/environments/environment';
import { AppModule } from '../../../src/app/app.module';



if (environment.production) {
  enableProdMode();
}
console.log('test3')
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
