import {ApplicationConfig, inject, provideZoneChangeDetection, REQUEST} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {HOST} from './tokens/host.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withInterceptors([
      // Replace generic targets like @host, @api, @backoffice in request URL,
      // and replace them with their actual values.
      (req, next) => {
        const target = req.url.replace(/^(@[a-zA-Z_][a-zA-Z0-9_]*).*/, '$1');
        if (target.startsWith('@')) {
          const mapping: Partial<Record<string, string>> = {
            '@host': inject(HOST),
          };
          req = req.clone({
            url: `${mapping[target] ?? target}${req.url.substring(target.length)}`
          });
        }
        return next(req);
      },
    ]) as any),
    {
      useFactory: () => inject(REQUEST, {optional: true})
          ?.url.replace(/^(https?:\/\/[^/]+).*$/, '$1')
        ?? window.location.origin,
      provide: HOST,
    },
    provideZoneChangeDetection({eventCoalescing: true}),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
  ]
};
