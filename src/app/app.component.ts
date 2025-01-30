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
    <nav class="sm:mr-0 sm:mt-0 m-4 flex">
      <hr class="opacity-0 flex-grow">
      <select class="focus-visible:outline-gray-600/30 focus-visible:outline-1 bg-gray-300/30 rounded-xs px-3 py-2"
              (change)="l10nService.setLanguage(languageRef.value)"
              [(ngModel)]="language"
              #languageRef
      >
        @for (lang of LANGUAGES; track lang) {
          <option [value]="lang.tag">{{ lang.text }}</option>
        }
      </select>
    </nav>

    <router-outlet></router-outlet>

    <footer class="justify-items-center place-items-center justify-center text-white/30 font-bold gap-1 mt-8 flex py-4">
      <div class="contents">
        <a href="https://x.com/SalathielGenese" target="_blank">
          &#64;SalathielGenese
        </a>
        <span>{{ ' © ' + year }}</span>
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
