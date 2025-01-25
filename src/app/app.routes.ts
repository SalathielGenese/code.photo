import {Routes} from '@angular/router';
import {HomeComponent} from './routes/home.component';

export const routes: Routes = [
  {
    path: ':language',
    pathMatch: 'prefix',
    component: HomeComponent,
  },
  {
    path: '**',
    component: HomeComponent,
  },
];
