import {
  Component,
  computed,
  effect,
  ElementRef,
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
import {Router} from '@angular/router';
import {filter, map, mergeMap, of} from 'rxjs';
import {ActionsComponent} from '../components/actions.component';

@Component({
  standalone: true,
  host: {
    class: 'flex-grow flex-col flex',
  },
  imports: [
    EditorComponent,
    ActionsComponent,
    SettingsComponent,
  ],
  selector: 'section[appHomePage]',
  template: `
    <aside class="[&_label_input.ng-invalid]:outline-red-600/50 [&_label_input]:focus-visible:outline-gray-300/50 [&_label_input]:focus-visible:outline-offset-2 [&_label_input]:focus-visible:outline-2
                  [&_label_input]:border-gray-100/10 [&_label_input]:text-gray-100/60 [&_label_input]:border-b-1  [&_label_input]:transition-all [&_label_input]:border-t-1 [&_label_input]:py-1
                  [&_label]:to-gray-700/10 [&_label]:from-transparent [&_label]:bg-linear-to-b [&_label]:rounded-sm
                  [&_label]:flex-col-reverse [&_label]:inline-flex [&_label]:gap-1 [&_label]:p-1
                  focus-within:translate-x-0 -translate-x-full -translate-x-full transition-all
                  [&_label_span]:font-bold [&_label_span]:text-sm [&_label_span]:mb-1
                  text-gray-100/90 backdrop-blur-2xl bg-stone-700/50
                  inline-flex flex-col left-0 top-0 gap-4
                  min-w-64 h-dvh fixed z-20 px-2 py-4
                  focus-within:[&_button]:opacity-0"
           [(settings)]="settings"
           tabindex="100"
           appSettings
    ></aside>

    @if (sourcesViewRef()) {
      <aside class="[&_button]:backdrop-blur-2xl [&_button]:from-stone-700/50 [&_button]:to-stone-700/60 [&_button]:bg-linear-to-b [&_button]:text-white/70
                    [&_button]:first-of-type:rounded-bl-sm [&_button]:first-of-type:rounded-tl-sm [&_button]:first-of-type:border-r
                    [&_button]:last-of-type:rounded-br-sm [&_button]:last-of-type:rounded-tr-sm
                    absolute top-0 md:mt-12  sm:mt-8 sm:ml-0 m-4"
             [sourcesViewRef]="sourcesViewRef()"
             appActions
      ></aside>
    }

    <article (sources)="editorRef()?.highlight(true); content=$event; updateUrl()"
             class="place-items-center justify-center flex-grow flex"
             (sourcesViewRef)="sourcesViewRef.set($event!)"
             [(sourcesInitialized)]="sourcesInitialized"
             [initialSources]="initialSources"
             [settings]="settings()"
             appEditor></article>
  `,
})
export class HomeComponent {
  protected q = input<string>();
  protected language = input<string>();

  protected content?: string;
  protected readonly initialSources?: string;
  protected readonly settings = signal<Settings>({});
  protected readonly sourcesInitialized = signal(false);
  protected readonly editorRef = viewChild(EditorComponent);
  protected readonly sourcesViewRef = signal<ElementRef<HTMLElement>>(void 0 as any);

  readonly #theme = computed(() => this.settings()?.theme);
  readonly #language = computed(() => this.settings()?.language);
  readonly #lineHighlight = computed(() => this.settings()?.lineHighlight);
  readonly #lineNumbersStart = computed(() => this.settings()?.lineNumbersStart);

  constructor(l10nService: L10nService,
              private readonly router: Router,
              @Inject(PLATFORM_ID) platformId: Object) {
    // // NOTE: Update the q query param with settings and content
    effect(() => this.settings() && this.sourcesInitialized() && this.updateUrl());

    // NOTE: Update the language signal, from route parameter, to its app-wide Single Source of Truth
    effect(() => (l10nService.language as WritableSignal<string>).set(this.language()!));

    if (isPlatformServer(platformId)) return;


    // NOTE: Update setting & content from the q query param
    const q = new URLSearchParams(location.search).get('q');
    if (q) {
      const {content, theme, language, lineNumbers, lineHighlight, lineNumbersStart} = JSON.parse(atob(q));
      this.settings.set({
        ...this.settings(),
        ...null === lineNumbers || undefined === lineNumbers ? {} : {lineNumbers},
        ...null === theme || undefined === theme ? {} : {theme},
        ...lineNumbersStart ? {lineNumbersStart} : {},
        ...lineHighlight ? {lineHighlight} : {},
        ...language ? {language} : {},
      });
      this.initialSources = content;
    }

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
      if (Number.isSafeInteger(this.#lineNumbersStart()) &&
        !document.querySelector(`link[href^="/prismjs/plugins/line-numbers/"]`)) {
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

    // NOTE: Track and update line numbering start
    effect(() => {
      if (Number.isSafeInteger(this.#lineNumbersStart()))
        this.editorRef()?.highlight();
    });

    // NOTE: Track and update line highlight
    effect(async () => {
      if (this.#lineHighlight()?.trim() && !document.querySelector(`link[href^="/prismjs/plugins/line-highlight/"]`)) {
        await Promise.allSettled([
          new Promise((onload, onerror) => document.head.appendChild(Object.assign(document.createElement('link'), {
            href: `/prismjs/plugins/line-highlight/prism-line-highlight.min.css`,
            rel: 'stylesheet',
            onerror,
            onload,
          }))),
          new Promise((onload, onerror) => document.body.appendChild(Object.assign(document.createElement('script'), {
            src: `/prismjs/plugins/line-highlight/prism-line-highlight.min.js`,
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

  protected updateUrl() {
    let content: string | undefined;

    of(this.content)
      .pipe(mergeMap(_ => _
        ? of(_)
        : of(this.q())
          .pipe(filter(_ => !!_))
          .pipe(map(_ => atob(_!)))
          .pipe(map(_ => JSON.parse(_)))
          .pipe(map(_ => _.content))))
      .subscribe(_ => content = _);

    void this.router.navigate([this.settings().language], {
      queryParamsHandling: 'merge',
      preserveFragment: true,
      queryParams: {
        q: btoa(JSON.stringify({...this.settings(), content})),
      },
      relativeTo: null,
    })
  };
}
