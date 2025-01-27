import {computed, DestroyRef, Inject, Injectable, PLATFORM_ID, Signal, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, map, mergeMap, tap} from 'rxjs';
import {isPlatformBrowser} from '@angular/common';
import {HttpClient} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class L10nService {
  static readonly LANGUAGES: { tag: string, text: string }[] = [
    {tag: 'fr', text: 'Français'},
    {tag: 'en', text: 'English'},
  ];

  readonly #cache = signal<{ [language in string]?: Record<string, string> }>({});
  readonly #loading = {} as { [language in string]?: boolean };
  readonly #language!: WritableSignal<string>;
  readonly cache!: Signal<Record<string, string>>;

  constructor(http: HttpClient,
              destroyRef: DestroyRef,
              private router: Router,
              @Inject(PLATFORM_ID) platformId: Object) {
    this.#language = signal<string>(this.resolveLanguage());
    this.cache = computed(() => this.#cache()[this.#language()] ?? {});
    toObservable(this.#language)
      .pipe(filter(() => isPlatformBrowser(platformId)))
      .pipe(filter(language => !this.#loading[language]))
      .pipe(tap(language => this.#loading[language] = true))
      .pipe(mergeMap(language => http
        .get<Record<string, string>>(`/l10n/${language}.json`)
        .pipe(map(content => ({[language]: content})))))
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(content => this.#cache.set({...this.#cache(), ...content}));
  }

  setLanguage(language: string) {
    void this.router.navigate([language].filter(_ => _), {
      queryParamsHandling: "preserve",
      preserveFragment: true,
      relativeTo: null,
    });
  }

  get language(): Signal<string> {
    return this.#language;
  }

  resolveLanguage() {
    // TODO: Resolve a hierarchical language
    return 'en';
  }
}
