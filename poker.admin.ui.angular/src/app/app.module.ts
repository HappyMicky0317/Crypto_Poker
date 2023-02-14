/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { APP_BASE_HREF } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER  } from '@angular/core';
import { CoreModule } from './@core/core.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ThemeModule } from './@theme/theme.module';
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { NotFoundComponent } from './pages/miscellaneous/not-found/not-found.component';
import { TournamentService } from './pages/tournaments/tournament-service';
import { NgbDateCustomParserFormatter } from './pages/miscellaneous/NgbDateCustomParserFormatter';
import { AdminApiService } from './shared/admin-api.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './shared/auth.interceptor';
import { isPaymentServer } from '../app-configuration';
import { PaymentServerApiService } from './pages/payment-server/payment-server-api.service';
import { PaymentServerUrlService } from './pages/payment-server/payment-server-url.service';
import { SetupAdminApiService } from './shared/SetupAdminApiService';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [AppComponent,
    NotFoundComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,

    NgbModule.forRoot(),
    ThemeModule.forRoot(),
    CoreModule.forRoot(),
  ],
  bootstrap: [AppComponent],
  providers: [
    { 
      provide: APP_BASE_HREF, 
      useValue: '/' 
    },
    TournamentService,
    AdminApiService,
    PaymentServerUrlService,
    {
      provide: NgbDateParserFormatter, 
      useClass: NgbDateCustomParserFormatter
    },

    SetupAdminApiService,
     { 
        provide: APP_INITIALIZER,
        useFactory: SetupApp,
        deps: [SetupAdminApiService],
        multi: true
     },

    ... (isPaymentServer ? [ {  provide : HTTP_INTERCEPTORS,      useClass: AuthInterceptor,      multi   : true,    } ] : []),
  ],
})
export class AppModule {
}

//create a function outside in the class module
export function SetupApp(setup: SetupAdminApiService) {
  return () => setup.initliaze();
}