import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { DepositAddressesComponent } from './deposit-addresses/deposit-addresses.component';
import { CurrencyConfigComponent } from './currency-config/currency-config.component';
import { SettingsComponent } from './settings/settings.component';
import { HooksComponent } from './hooks/hooks.component';


const routes: Routes = [
  {
    path: 'deposit-addresses',
    component: DepositAddressesComponent,
  },
  {
    path: 'currency-config',
    component: CurrencyConfigComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
  {
    path: 'hooks',
    component: HooksComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PaymentServerRoutingModule {
}
