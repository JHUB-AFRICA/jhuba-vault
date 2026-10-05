import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from '../state/auth.store';
import { Role } from './models';

export const authGuard: CanActivateFn = () => { const auth = inject(AuthStore); const router = inject(Router); return auth.hydrate().pipe(map(user => user ? true : router.createUrlTree(['/auth/login']))); };
export const roleGuard = (role: Role): CanActivateFn => () => { const auth = inject(AuthStore); const router = inject(Router); return auth.hydrate().pipe(map(user => user ? user.role === role ? true : router.createUrlTree(['/']) : router.createUrlTree(['/auth/login']))); };
export const guestGuard: CanActivateFn = () => { const auth = inject(AuthStore); const router = inject(Router); return auth.hydrate().pipe(map(user => user ? router.createUrlTree([user.role === Role.ADMIN ? '/admin/dashboard' : '/app/dashboard']) : true)); };
