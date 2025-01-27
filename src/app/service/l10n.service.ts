import {Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {Router} from '@angular/router';

@Injectable({providedIn: 'root'})
export class L10nService {
  static readonly LANGUAGES: { tag: string, text: string }[] = [
    {tag: 'fr', text: 'Français'},
    {tag: 'en', text: 'English'},
  ];

  readonly #language!: WritableSignal<string>;

  constructor(private router: Router) {
    this.#language = signal<string>(this.resolveLanguage());
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
