import {
  Component,
  computed,
  effect,
  Inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
  WritableSignal
} from '@angular/core';
import {L10nService} from '../services/l10n.service';
import {SettingsComponent} from '../components/settings.component';
import {Settings} from '../domains/settings.domain';
import {EditorComponent} from '../components/editor.component';
import {isPlatformServer} from '@angular/common';
import Prism from 'prismjs';

@Component({
  standalone: true,
  selector: 'section[appHomePage]',
  template: `
    <aside appSettings [(settings)]="settings"></aside>

    <article (sources)="editorRef()?.highlight(true)"
             [settings]="settings()"
             appEditor></article>
  `,
  providers: [
    L10nService,
  ],
  imports: [
    SettingsComponent,
    EditorComponent,
  ]
})
export class HomeComponent {
  protected language = input<string>();

  protected editorRef = viewChild(EditorComponent);
  protected readonly settings = signal<Settings>({});

  readonly #theme = computed(() => this.settings()?.theme);
  readonly #language = computed(() => this.settings()?.language);

  constructor(private l10nService: L10nService,
              @Inject(PLATFORM_ID) private readonly platformId: Object) {
    // NOTE: Update the language signal, from route parameter, to its app-wide Single Source of Truth
    effect(() => (l10nService.language as WritableSignal<string>).set(this.language()!));

    if (isPlatformServer(platformId)) return;

    // NOTE: Wait for language component to load and re-run the highlight, whenever the language changes
    effect(() => {
      if (!this.#language()) return;
      Prism.plugins['autoloader'].loadLanguages(
        this.#language(), () => this.editorRef()?.highlight(), (error: any) => console.error(error));
    });

    effect(onCleanup => {
      // TODO: Try leveraging SSR metadata when the URL contains the language details
      onCleanup(() => document.querySelector(`link[href^="/prismjs/themes/prism"]`)?.remove());
      document.head.appendChild(Object.assign(document.createElement('link'), {
        href: `/prismjs/themes/prism${this.#theme() ? `-${this.#theme()}` : ''}.min.css`,
        rel: 'stylesheet',
      }));
    });
  }
}
