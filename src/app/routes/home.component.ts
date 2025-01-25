import {Component, DestroyRef, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {L10nService} from '../service/l10n.service';

@Component({
  selector: '[appHomePage]',
  template: `
    <nav>
      <a routerLink="/">None</a>
      -
      <a (click)="l10nService.setLanguage({language: 'en'})">English</a>
      -
      <a (click)="l10nService.setLanguage({language: 'fr'})">Français</a>
    </nav>
    Home... '{{ lang }}'
  `,
  providers: [
    L10nService,
  ],
  imports: [
    RouterLink,
  ]
})
export class HomeComponent implements OnInit {
  protected lang?: string;

  constructor(private readonly destroyRef: DestroyRef,
              protected readonly l10nService: L10nService,
              private readonly activatedRoute: ActivatedRoute,) {
  }

  ngOnInit() {
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
    const subscription = this.activatedRoute.params.subscribe(async ({language}) => {
      if (language) {
        this.lang = language;
      } else {
        this.l10nService.setLanguage({replaceUrl: true});
      }
    });
  }
}
