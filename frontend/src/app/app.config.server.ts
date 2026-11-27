import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE_URL } from './core/api.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: API_BASE_URL, useValue: process.env['BACKEND_URL'] ? `${process.env['BACKEND_URL']}/api` : 'http://localhost:3000/api' }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
