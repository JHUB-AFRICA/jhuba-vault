import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('jhub_access_token');

  if (!token) {
    return next(request);
  }

  const authenticatedRequest = request.clone({
    setHeaders: { Authorization: 'Bearer ' + token }
  });

  return next(authenticatedRequest).pipe(
    catchError(error => {
      return throwError(() => error);
    })
  );
};
