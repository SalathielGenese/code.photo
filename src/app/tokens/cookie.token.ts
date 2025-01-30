import {InjectionToken} from '@angular/core';

export const GET_COOKIE = new InjectionToken<{ (name: string): string | undefined }>('GET_COOKIE');
export const SET_COOKIE = new InjectionToken<{
  (name: string, value: string, options?: { sameSite?: 'strict' | 'lax' | 'none'; partitioned?: boolean; domain?: string}): void
}>('SET_COOKIE');
