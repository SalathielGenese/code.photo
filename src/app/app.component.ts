import {Component, effect, Inject, PLATFORM_ID} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Meta, Title} from '@angular/platform-browser';
import {L10nService} from './services/l10n.service';
import {isPlatformBrowser} from '@angular/common';

@Component({
  standalone: true,
  selector: '[appRoot]',
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  constructor(meta: Meta,
              title: Title,
              l10nService: L10nService,
              @Inject(PLATFORM_ID) platformId: Object) {
    effect(() => {
      const language = l10nService.language();
      const cache = l10nService.cache();
      if (!cache['meta.title']) return;

      title.setTitle(cache['meta.title']);
      ['og:title', 'twitter:title'].forEach(name =>
        meta.addTag({name, content: cache['meta.title']}, false));
      ['description', 'og:description', 'twitter:description'].forEach(name =>
        meta.addTag({name, content: cache['meta.description']}, false));
      meta.addTag({name: 'og:url', content: `https://code.photo/${language}`}, false);

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
