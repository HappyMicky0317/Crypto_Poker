import { NgModule } from '@angular/core';
import { PaymentServerRoutingModule } from './payment-server-routing.module';
import { ThemeModule } from '../../@theme/theme.module';
import { MiscellaneousModule } from '../miscellaneous/miscellaneous.module';
import { DepositAddressesComponent } from './deposit-addresses/deposit-addresses.component';
import { CurrencyConfigComponent } from './currency-config/currency-config.component';
import { SettingsComponent } from './settings/settings.component';
import { HooksComponent } from './hooks/hooks.component';
import { TruncatePipe } from '../../shared/truncate.pipe';
import { PaymentServerApiService } from './payment-server-api.service';

@NgModule({
  imports: [
    PaymentServerRoutingModule,
    ThemeModule,    
    MiscellaneousModule,
    
  ],
  declarations: [        
    DepositAddressesComponent,   
    CurrencyConfigComponent,
    SettingsComponent,
    HooksComponent 
  ],
  providers:[
    PaymentServerApiService
  ]
})
export class PaymentServerModule {
}
