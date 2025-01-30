import {ApplicationConfig, inject, PLATFORM_ID, provideZoneChangeDetection, REQUEST} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {HOST} from './tokens/host.token';
import {isPlatformServer} from '@angular/common';
import {GET_COOKIE, SET_COOKIE} from './tokens/cookie.token';

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
      useFactory: () => {
        return isPlatformServer(inject(PLATFORM_ID))
          ? inject(REQUEST, {optional: true})?.url.replace(/^(https?:\/\/[^/]+).*$/, '$1')
          ?? `http://0.0.0.0:${process.env['PORT'] ?? 4000}`
          : window.location.origin;
      },
      provide: HOST,
    },
    ...globalThis.global === globalThis ? [] : [{
      provide: GET_COOKIE,
      useValue: ((name: string) => document.cookie.split('; ').find(_ => _.startsWith(`${name}=`))?.split('=')[1]),
    }],
    ...globalThis.global === globalThis ? [] : [{
      provide: SET_COOKIE,
      useValue: ((name: string, value: string, options?: {
        sameSite?: 'strict' | 'lax' | 'none';
        partitioned?: boolean;
        domain?: string;
      }) => document.cookie = [
        ...options?.partitioned ? ['Partitioned'] : [],
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
        ...options?.sameSite ? [`SameSite=${options.sameSite}`,] : [],
        ...options?.domain ? [`domain=${encodeURIComponent(options?.domain)}`] : [],
      ].join('; ')),
    }],
    provideZoneChangeDetection({eventCoalescing: true}),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
  ]
};
