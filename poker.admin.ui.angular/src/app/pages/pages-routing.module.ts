import { UserEditComponent } from './users/user-edit/user-edit.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { TournamentsComponent } from './tournaments/tournaments.component';
import { TournamentEditComponent } from './tournaments/tournament-edit/tournament-edit.component';
import { PaymentsComponent } from './payments/payments.component';
import { UsersComponent } from './users/users.component';
import { TablesComponent } from './tables/tables.component';
import { GameHistoryComponent } from './game-history/game-history.component';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    
    {
      path: '',
      redirectTo: 'tournaments',
      pathMatch: 'full',
    },
    { 
      path: 'tournaments', 
      component: TournamentsComponent,
      children: [        
        { path: ':id', component: TournamentEditComponent },
      ] 
    },
    {
      path: 'users',
      component: UsersComponent,
      children: [        
        { path: ':id', component: UserEditComponent },
      ] 
    },

    {
      path: 'payments',
      component: PaymentsComponent,
    },
    
    {
      path: 'tables',
      component: TablesComponent,
    },
    {
      path: 'game-history',
      component: GameHistoryComponent,
    },

    { path: 'payment-server', loadChildren: 'app/pages/payment-server/payment-server.module#PaymentServerModule' },
    
    
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
