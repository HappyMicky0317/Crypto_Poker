import { NgModule } from '@angular/core';


import { ThemeModule } from '../../@theme/theme.module';
import { DashboardComponent } from './dashboard.component';
import { DatepickerBasicComponent } from './datepicker-basic/datepicker-basic.component';


@NgModule({
  imports: [
    ThemeModule,
  ],
  declarations: [
    DashboardComponent,
    DatepickerBasicComponent,
  ],
  exports: [
    DatepickerBasicComponent,
  ],
})
export class DashboardModule { }
