import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthGuard } from './auth.guard';
import {
  NbAuthComponent,
} from '@nebular/auth';
import { LoginComponent } from './login/login.component'


const routes: Routes = [
  { path: '', loadChildren: 'app/pages/pages.module#PagesModule', canActivate : [AuthGuard] },
  
  {
    path: 'auth',
    component: NbAuthComponent,
    children: [
      {
        path: '',
        component: LoginComponent,
      },
    ],
  },
  //{ path: '', redirectTo: 'pages', pathMatch: 'full' },
  // { path: '**', component: NotFoundComponent, },
  // { path: '**', redirectTo: 'pages', },
];

const config: ExtraOptions = {
  useHash: true,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
