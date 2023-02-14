import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { PagesRoutingModule } from './pages-routing.module';
import { ThemeModule } from '../@theme/theme.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { TournamentsComponent } from './tournaments/tournaments.component';
import { TournamentsListComponent } from './tournaments/tournaments-list/tournaments-list.component';
import { TournamentEditComponent } from './tournaments/tournament-edit/tournament-edit.component';
import { TruncatePipe } from '../shared/truncate.pipe';
import { PaymentsComponent } from './payments/payments.component';
import { UsersComponent } from './users/users.component';
import { UserEditComponent } from './users/user-edit/user-edit.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { TablesComponent } from './tables/tables.component';
import { GameHistoryComponent } from './game-history/game-history.component';
import { TournamentResultsComponent } from './tournaments/tournament-results/tournament-results/tournament-results.component';
import { UserBalancesComponent } from './users/user-balances/user-balances.component';

const PAGES_COMPONENTS = [
  PagesComponent,
  TournamentsComponent  
];

@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    DashboardModule,
    MiscellaneousModule,
  ],
  declarations: [
    ...PAGES_COMPONENTS,
    TournamentsListComponent,
    TournamentEditComponent,
    PaymentsComponent,
    UsersComponent,
    UserEditComponent,
    UserListComponent,
    TablesComponent,
    GameHistoryComponent,
    TournamentResultsComponent,
    UserBalancesComponent,

  ]
})
export class PagesModule {
}
