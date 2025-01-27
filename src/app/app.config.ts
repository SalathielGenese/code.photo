import {ApplicationConfig, inject, provideZoneChangeDetection, REQUEST} from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {HOST} from './tokens/host.token';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      useFactory: () => inject(REQUEST, {optional: true})
          ?.url.replace(/^(https?:\/\/[^/]+).*$/, '$1')
        ?? window.location.origin,
      provide: HOST,
    },
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
  ]
};
