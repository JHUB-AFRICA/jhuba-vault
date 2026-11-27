import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from '../features/auth/data-access/auth.store';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const token = localStorage.getItem('jhub_access_token');

  if (!token) return router.createUrlTree(['/auth/login']);

  return auth.hydrate().pipe(map(user => {
    if (user) return true;
    if (token) return true;
    return router.createUrlTree(['/auth/login']);
  }));
};
export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const token = localStorage.getItem('jhub_access_token');
  if (!token) return router.createUrlTree(['/auth/login']);
  return auth.hydrate().pipe(map(user => {
    if (user) return user.role === role ? true : router.createUrlTree(['/']);
    return true;
  }));
};
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const token = localStorage.getItem('jhub_access_token');
  return auth.hydrate().pipe(map(user => {
    if (user) return router.createUrlTree([user.role === Role.ADMIN ? '/admin/dashboard' : '/app/dashboard']);
    return token ? false : true;
  }));
};
