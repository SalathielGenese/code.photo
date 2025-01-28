import {
  Component,
  computed,
  DestroyRef,
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
  readonly #lineNumbers = computed(() => this.settings()?.lineNumbers);

  constructor(destroyRef: DestroyRef,
              l10nService: L10nService,
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

    // NOTE: Unload the previous theme and load the next, whenever the theme changes
    effect(onCleanup => {
      // TODO: Try leveraging SSR metadata when the URL contains the language details
      onCleanup(() => document.querySelector(`link[href^="/prismjs/themes/prism"]`)?.remove());
      document.head.appendChild(Object.assign(document.createElement('link'), {
        href: `/prismjs/themes/prism${this.#theme() ? `-${this.#theme()}` : ''}.min.css`,
        rel: 'stylesheet',
      }));
    });

    // NOTE: Ensure the line-numbers plugin is loaded, then highlight to reflect, whenever that setting is true
    effect(async () => {
      if (this.#lineNumbers() && !document.querySelector(`link[href^="/prismjs/plugins/line-numbers/"]`)) {
        await Promise.allSettled([
          new Promise((onload, onerror) => document.head.appendChild(Object.assign(document.createElement('link'), {
            href: `/prismjs/plugins/line-numbers/prism-line-numbers.min.css`,
            rel: 'stylesheet',
            onerror,
            onload,
          }))),
          new Promise((onload, onerror) => document.body.appendChild(Object.assign(document.createElement('script'), {
            src: `/prismjs/plugins/line-numbers/prism-line-numbers.min.js`,
            type: 'text/javascript',
            async: true,
            onerror,
            onload,
          }))),
        ]);
      }
      this.editorRef()?.highlight();
    });
  }
}
