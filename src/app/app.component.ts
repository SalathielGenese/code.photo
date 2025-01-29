import {Component, effect, Inject, PLATFORM_ID} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Meta, Title} from '@angular/platform-browser';
import {L10nService} from './services/l10n.service';
import {isPlatformBrowser} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  standalone: true,
  selector: '[appRoot]',
  imports: [RouterOutlet, FormsModule],
  template: `
    <router-outlet></router-outlet>

    <footer>
      ({{language}} vs {{l10nService.language()}})
      <select (change)="l10nService.setLanguage(languageRef.value)"
              [(ngModel)]="language"
              #languageRef
      >
        @for (lang of LANGUAGES; track lang) {
          <option [value]="lang.tag">{{ lang.text }}</option>
        }
      </select>
      <hr>
      <div>
        Salathiel Genese &copy; {{ year }}
      </div>
    </footer>
  `,
})
export class AppComponent {
  protected year?: number;
  protected language!: string;
  protected readonly LANGUAGES = L10nService.LANGUAGES;

  constructor(meta: Meta,
              title: Title,
              @Inject(PLATFORM_ID) platformId: Object,
              protected readonly l10nService: L10nService) {
    this.year = new Date().getFullYear();

    effect(() => {
      const language = l10nService.language();
      const cache = l10nService.cache();
      this.language = language;

      if (!cache['meta.title']) return;

      title.setTitle(cache['meta.title']);
      ['og:title', 'twitter:title'].forEach(name =>
        meta.addTag({name, content: cache['meta.title']}, false));
      ['description', 'og:description', 'twitter:description'].forEach(name =>
        meta.addTag({name, content: cache['meta.description']}, false));
      meta.addTag({name: 'keywords', content: cache['meta.keywords']}, false);
      meta.addTag({name: 'og:url', content: `https://code.photo/${language}`}, false);
      meta.addTag({name: 'language', content: L10nService.LANGUAGES.find(({tag}) => tag === language)?.meta!}, false);

      if (isPlatformBrowser(platformId)) {
        const script = Object.assign(document.head.querySelector('script[type$="/ld+json"]') ?? document.createElement('script'), {
          text: JSON.stringify({
            description: cache['meta.description'],
            '@context': cache['meta.context'],
            name: cache['meta.title'],
            '@type': 'WebPage',
          }),
          type: 'application/ld+json',
        });
        if (!document.head.contains(script)) document.head.appendChild(script);
      }
    });
  }
}
