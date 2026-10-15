import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { User } from '../core/models';
import { ProfileService } from '../core/api.service';

interface ProfileState { profile: User | null; loading: boolean; saving: boolean; error: string | null; success: string | null; }
export const ProfileStore = signalStore(
  { providedIn: 'root' },
  withState<ProfileState>({ profile: null, loading: false, saving: false, error: null, success: null }),
  withMethods((store, profileService = inject(ProfileService)) => ({
    load(profile: User): void { patchState(store, { profile, error: null }); },
    beginSave(): void { patchState(store, { saving: true, error: null, success: null }); },
    save(profile: User, onSuccess?: (user: User) => void): void { profileService.updateMine(profile).subscribe({ next: user => { patchState(store, { profile: user, saving: false, success: 'Profile details saved successfully.' }); onSuccess?.(user); }, error: (error: unknown) => patchState(store, { saving: false, error: error instanceof HttpErrorResponse ? error.error?.message ?? 'Unable to save profile details.' : 'Unable to save profile details.' }) }); },
    fail(message: string): void { patchState(store, { saving: false, error: message }); },
    clearMessage(): void { patchState(store, { error: null, success: null }); }
  }))
);
