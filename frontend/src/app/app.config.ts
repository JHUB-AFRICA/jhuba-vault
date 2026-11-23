
import { ApplicationConfig } from '@angular/core';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    // Application routing configuration
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),

    // HTTP client configuration
    // Enables Fetch API and preserves authentication interceptor
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )

  ]
};
