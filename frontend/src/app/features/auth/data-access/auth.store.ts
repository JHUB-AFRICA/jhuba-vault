import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Observable, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { Role, User } from '../../../core/models';
import { AuthCredentials, AuthService, RegistrationData } from './auth.service';

interface AuthState { user: User | null; loading: boolean; error: string | null; hydrated: boolean; hydrating: boolean; }
<<<<<<< HEAD
=======

const AUTH_USER_CACHE_KEY = 'jhub_auth_user';

const setSharedSessionCookie = (token: string): void => {
  document.cookie = `jhub_access_token=${encodeURIComponent(token)}; path=/; max-age=86400; sameSite=Lax`;
};

const clearSharedSessionCookie = (): void => {
  document.cookie = 'jhub_access_token=; path=/; max-age=0; sameSite=Lax';
};

const readCachedUser = (): User | null => {
  try {
    const value = localStorage.getItem(AUTH_USER_CACHE_KEY);
    return value ? JSON.parse(value) as User : null;
  } catch {
    return null;
  }
};

const cacheUser = (user: User | null): void => {
  if (user) localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_USER_CACHE_KEY);
};

>>>>>>> 83af3b4 (Updated Support Hub features)
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>({ user: null, loading: false, error: null, hydrated: false, hydrating: false }),
  withComputed(({ user, hydrated, hydrating }) => ({ isAuthenticated: computed(() => user() !== null), isAdmin: computed(() => user()?.role === Role.ADMIN), isHydrated: computed(() => hydrated()), isHydrating: computed(() => hydrating()) })),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => {
    let hydration$: Observable<User | null> | null = null;
    const hydrate = (): Observable<User | null> => {
      if (store.hydrated()) return of(store.user());
      if (hydration$) return hydration$;
      const token = localStorage.getItem('jhub_access_token');
      if (!token) {
        patchState(store, { hydrated: true, hydrating: false, user: null });
        return of(null);
      }
      patchState(store, { hydrating: true, loading: true, error: null });
      hydration$ = authService.me().pipe(
        tap(user => { cacheUser(user); patchState(store, { user }); }),
        catchError((error: unknown) => {
          const cachedUser = readCachedUser();
          if (error instanceof HttpErrorResponse && error.status === 401) {
            localStorage.removeItem('jhub_access_token');
            clearSharedSessionCookie();
            cacheUser(null);
            patchState(store, { user: null });
          } else {
            // Preserve the visible session and current route during backend/network outages.
            patchState(store, { user: cachedUser });
          }
          return of(cachedUser);
        }),
        finalize(() => { patchState(store, { hydrated: true, hydrating: false, loading: false }); hydration$ = null; }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      return hydration$;
    };
    return {
      hydrate,
<<<<<<< HEAD
      signIn(credentials: AuthCredentials | Role): void { if (typeof credentials === 'string') { patchState(store, { loading: false, error: 'Use the sign-in form to authenticate with your account.' }); return; } patchState(store, { loading: true, error: null }); authService.login(credentials).subscribe({ next: response => { localStorage.setItem('jhub_access_token', response.token); patchState(store, { user: response.user, hydrated: true, hydrating: false, loading: false, error: null }); void router.navigateByUrl(response.user.role === Role.ADMIN ? '/admin/dashboard' : '/app/dashboard'); }, error: error => patchState(store, { loading: false, error: this.errorMessage(error) }) }); },
      register(data: RegistrationData): void { patchState(store, { loading: true, error: null }); authService.register(data).subscribe({ next: response => { localStorage.setItem('jhub_access_token', response.token); patchState(store, { user: response.user, hydrated: true, hydrating: false, loading: false, error: null }); void router.navigateByUrl('/app/profile'); }, error: error => patchState(store, { loading: false, error: this.errorMessage(error) }) }); },
      signOut(): void { patchState(store, { user: null, hydrated: true, hydrating: false, loading: false, error: null }); localStorage.removeItem('jhub_access_token'); void router.navigateByUrl('/'); },
      expireSession(): void { localStorage.removeItem('jhub_access_token'); patchState(store, { user: null, hydrated: true, hydrating: false, loading: false, error: 'Your session has expired. Sign in again to continue.' }); void router.navigateByUrl('/auth/login'); },
=======
      signIn(credentials: AuthCredentials | Role): void { if (typeof credentials === 'string') { patchState(store, { loading: false, error: 'Use the sign-in form to authenticate with your account.' }); return; } patchState(store, { loading: true, error: null }); authService.login(credentials).subscribe({ next: response => { localStorage.setItem('jhub_access_token', response.token); setSharedSessionCookie(response.token); cacheUser(response.user); patchState(store, { user: response.user, hydrated: true, hydrating: false, loading: false, error: null }); void router.navigateByUrl(response.user.role === Role.ADMIN ? '/admin/dashboard' : '/app/dashboard'); }, error: error => patchState(store, { loading: false, error: this.errorMessage(error) }) }); },
      register(data: RegistrationData): void { patchState(store, { loading: true, error: null }); authService.register(data).subscribe({ next: response => { localStorage.setItem('jhub_access_token', response.token); setSharedSessionCookie(response.token); cacheUser(response.user); patchState(store, { user: response.user, hydrated: true, hydrating: false, loading: false, error: null }); void router.navigateByUrl('/app/profile'); }, error: error => patchState(store, { loading: false, error: this.errorMessage(error) }) }); },
      signOut(): void { cacheUser(null); patchState(store, { user: null, hydrated: true, hydrating: false, loading: false, error: null }); localStorage.removeItem('jhub_access_token'); clearSharedSessionCookie(); void router.navigateByUrl('/'); },
      expireSession(): void { cacheUser(null); localStorage.removeItem('jhub_access_token'); clearSharedSessionCookie(); patchState(store, { user: null, hydrated: true, hydrating: false, loading: false, error: 'Your session has expired. Sign in again to continue.' }); },
>>>>>>> 83af3b4 (Updated Support Hub features)
      clearError(): void { patchState(store, { error: null }); },
      updateUser(user: User): void { cacheUser(user); patchState(store, { user }); },
      errorMessage(error: unknown): string { if (error instanceof HttpErrorResponse) return error.error?.message ?? 'Authentication request failed.'; return 'Authentication request failed.'; }
    };
  })
);
