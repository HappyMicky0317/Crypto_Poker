import { NgModule } from '@angular/core';
import { ThemeModule } from '../../@theme/theme.module';
import { MiscellaneousRoutingModule, routedComponents } from './miscellaneous-routing.module';
import { TruncatePipe } from '../../shared/truncate.pipe';

@NgModule({
  imports: [
    ThemeModule,
    MiscellaneousRoutingModule,
  ],
  declarations: [
    ...routedComponents,
    TruncatePipe
  ],  
  exports:[
    TruncatePipe
  ]
})
export class MiscellaneousModule { }
