import {computed, DestroyRef, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, map, mergeMap, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class L10nService {
  static readonly LANGUAGES: { tag: string, meta: string, text: string }[] = [
    {tag: 'fr', meta: 'french', text: 'Français'},
    {tag: 'en', meta: 'english', text: 'English'},
  ];

  readonly cache!: Signal<Record<string, string>>;

  readonly #cache = signal<{ [language in string]?: Record<string, string> }>({});
  readonly #loading = {} as { [language in string]?: boolean };
  readonly #language!: WritableSignal<string>;

  constructor(http: HttpClient,
              destroyRef: DestroyRef,
              private router: Router) {
    this.#language = signal<string>(this.resolveLanguage());
    this.cache = computed(() => this.#cache()[this.#language()] ?? {});

    toObservable(this.#language)
      .pipe(filter(language => !this.#loading[language]))
      .pipe(tap(language => this.#loading[language] = true))
      .pipe(mergeMap(language => http
        .get<Record<string, string>>(`@host/l10n/${language}.json`)
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
