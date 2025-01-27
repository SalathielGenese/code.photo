import {Component, effect, input, WritableSignal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {L10nService} from '../service/l10n.service';
import {JsonPipe} from '@angular/common';

@Component({
  standalone: true,
  selector: '[appHomePage]',
  template: `
    <nav>
      <a routerLink="/">None</a>
      -
      <a (click)="l10nService.setLanguage('en')">English</a>
      -
      <a (click)="l10nService.setLanguage('fr')">Français</a>
    </nav>
    Home... ~{{ l10nService.language() }}~
    <pre>{{ l10nService.cache() | json }}</pre>
  `,
  providers: [
    L10nService,
  ],
  imports: [
    RouterLink,
    JsonPipe,
  ]
})
export class HomeComponent {
  protected language = input<string>();

  constructor(protected l10nService: L10nService) {
    effect(() => (l10nService.language as WritableSignal<string>).set(this.language()!));
  }
}
