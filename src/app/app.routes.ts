import {ActivatedRouteSnapshot, Router, Routes} from '@angular/router';
import {HomeComponent} from './routes/home.component';
import {Component, inject} from '@angular/core';
import {L10nService} from './services/l10n.service';

@Component({
  selector: 'section[appNever]',
  template: 'Never',
})
export class NeverComponent {
  constructor() {
    console.warn(this)
  }
}
export const routes: Routes = [
  {
    path: ':language',
    pathMatch: 'prefix',
    component: HomeComponent,
    canActivate: [
      ({params: {language}, fragment, queryParams}: ActivatedRouteSnapshot) => {
        if (L10nService.LANGUAGES.some(({tag}) => tag === language)) return true;
        return inject(Router).createUrlTree([], {
          ...queryParams ? {queryParams} : {},
          ...fragment ? {fragment} : {},
          relativeTo: null,
        });
      }
    ],
  },
  {
    path: '**',
    component: NeverComponent,
    canActivate: [
      ({fragment, queryParams}: ActivatedRouteSnapshot) => {
        const urlTree = inject(Router).parseUrl(`/${inject(L10nService).resolveLanguage()}`);
        if (queryParams) urlTree.queryParams = queryParams;
        if (fragment) urlTree.fragment = fragment;
        return urlTree;
      }
    ],
  },
];
