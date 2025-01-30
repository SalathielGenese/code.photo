import {computed, DestroyRef, Inject, Injectable, Optional, Signal, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, map, mergeMap, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {GET_COOKIE, SET_COOKIE} from '../tokens/cookie.token';
import {SYSTEM_LANGUAGES} from '../tokens/system-languages.token';

@Injectable({providedIn: 'root'})
export class L10nService {
  static readonly LANGUAGES: { tag: string, meta: string, text: string }[] = [
    {tag: 'fr', meta: 'french', text: 'Français'},
    {tag: 'en', meta: 'english', text: 'English'},
    {tag: 'es', meta: 'spanish', text: 'Español'},
    {tag: 'af', meta: 'afrikaans', text: 'Afrikaans'},
    {tag: 'nl', meta: 'dutch', text: 'Nederlands'},
    {tag: 'de', meta: 'german', text: 'Deutsch'},
    {tag: 'ru', meta: 'russian', text: 'Русский'},
    {tag: 'ja', meta: 'japanese', text: '日本語'},
    {tag: 'zh', meta: 'chinese', text: '中文'},
    {tag: 'mr', meta: 'hindu', text: 'हिंदू'},
    {tag: 'ar', meta: 'arabic', text: 'اَلْعَرَبِيَّةُ'},
    {tag: 'pt', meta: 'portuguese', text: 'Português'},
    {tag: 'ln', meta: 'lingala', text: 'Lingála'},
    {tag: 'sw', meta: 'swahili', text: 'Kiswahili'},
    {tag: 'wo', meta: 'wolof', text: 'Wolof làkk'},
  ];

  readonly cache!: Signal<Record<string, string>>;

  readonly #cache = signal<{ [language in string]?: Record<string, string> }>({});
  readonly #loading = {} as { [language in string]?: boolean };
  readonly #language!: WritableSignal<string>;
  readonly #LANGUAGE_COOKIE = 'X-PREFERRED-LANGUAGE';

  constructor(http: HttpClient,
              destroyRef: DestroyRef,
              private readonly router: Router,
              @Optional() @Inject(SET_COOKIE) private readonly setCookie?: {
                (name: string, value: string, options?: {
                  sameSite?: 'strict' | 'lax' | 'none';
                  partitioned?: boolean;
                  domain?: string
                }): void
              },
              @Optional() @Inject(SYSTEM_LANGUAGES) private readonly systemLanguages?: string[],
              @Optional() @Inject(GET_COOKIE) private readonly getCookie?: { (name: string): string | undefined }) {
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

  setLanguage(language: string, updateCookie = false) {
    updateCookie && this.setCookie?.(this.#LANGUAGE_COOKIE, language);
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
    const cookie = this.getCookie?.(this.#LANGUAGE_COOKIE);
    if (L10nService.LANGUAGES.some(({tag}) => cookie === tag)) return cookie!;

    let resolved: string;
    for (const language of this.systemLanguages ?? []) {
      if (L10nService.LANGUAGES.some(({tag}) => language === tag)) {
        resolved = language;
        break;
      }
    }
    resolved ??= 'en';
    this.setCookie?.(this.#LANGUAGE_COOKIE, resolved);
    return resolved;
  }
}
