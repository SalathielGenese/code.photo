import {Component, effect, Inject, PLATFORM_ID, untracked} from '@angular/core';
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
    meta.addTag({name: 'og:type', content: 'website'});
    meta.addTag({name: 'og:card', content: 'summary'});
    meta.addTag({name: 'twitter:site', content: '@SalathielGenese'});
    ['og:image', 'twitter:image']
      .forEach(name => meta.addTag({name, content: 'https://code.photo/favicon.ico'}));

    effect(() => {
      const cache = l10nService.cache();

      title.setTitle(cache['meta.title']);
      ['og:title', 'twitter:title']
        .forEach(name => meta.addTag({name, content: cache['meta.title']}));
      ['description', 'og:description', 'twitter:description']
        .forEach(name => meta.addTag({name, content: cache['meta.description']}));
      meta.addTag({name: 'og:url', content: `https://code.photo/${untracked(l10nService.language)}`});

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
