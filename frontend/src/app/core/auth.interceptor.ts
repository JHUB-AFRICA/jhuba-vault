import { HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, Injector, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../state/auth.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(request);
  }
  const token = localStorage.getItem('jhub_access_token');

  if (!token) {
    return next(request);
  }

  const authenticatedRequest = request.clone({
    setHeaders: { Authorization: 'Bearer ' + token }
  });

  return next(authenticatedRequest).pipe(
    catchError(error => {
      if (error.status === 401 && !request.url.includes('/auth/')) {
        injector.get(AuthStore).expireSession();
      }
      return throwError(() => error);
    })
  );
};
