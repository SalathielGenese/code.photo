import {DestroyRef, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatestWith, take} from 'rxjs';

@Injectable()
export class L10nService {
  static readonly LANGUAGES: { tag: string, text: string }[] = [
    {tag: 'fr', text: 'Français'},
    {tag: 'en', text: 'English'},
  ];
  readonly #cache: Record<string, object> = {};
  #lang?: string;

  constructor(private readonly router: Router,
              private readonly destroyRef: DestroyRef,
              private readonly activatedRoute: ActivatedRoute) {
  }

  setLanguage({replaceUrl = false, language}: { language?: string, replaceUrl?: boolean } = {}) {
    language ??= this.language;

    if (this.#lang != language) {
      this.#lang = language;
      this.activatedRoute.fragment
        .pipe(combineLatestWith(this.activatedRoute.queryParams))
        .pipe(take(1))
        .subscribe(([fragment, queryParams]) => {
          void this.router.navigate([this.#lang], {
            fragment: fragment ?? undefined,
            relativeTo: null,
            queryParams,
            replaceUrl,
          });
        });
    }
  }

  get language() {
    // TODO: resolve language
    return 'en';
  }
}
