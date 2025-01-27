import {Component, effect, input, signal, WritableSignal} from '@angular/core';
import {L10nService} from '../services/l10n.service';
import {SettingsComponent} from '../components/settings.component';
import {Settings} from '../domains/settings.domain';
import {JsonPipe} from '@angular/common';

@Component({
  standalone: true,
  selector: 'section[appHomePage]',
  template: `
    <aside appSettings [(settings)]="settings"></aside>

    <fieldset>
      <pre>{{ settings() | json }}</pre>
    </fieldset>
  `,
  providers: [
    L10nService,
  ],
  imports: [
    SettingsComponent,
    JsonPipe,
  ]
})
export class HomeComponent {
  protected language = input<string>();

  protected readonly settings = signal<Settings>({});

  constructor(protected l10nService: L10nService) {
    effect(() => (l10nService.language as WritableSignal<string>).set(this.language()!));
  }
}
