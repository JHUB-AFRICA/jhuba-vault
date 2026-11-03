import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL, ApiResponse } from '../../../core/http/api-response';
import { User } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  getMine(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${API_URL}/users/me`).pipe(map(response => response.data));
  }

  updateMine(profile: Partial<User>): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${API_URL}/users/me`, profile).pipe(map(response => response.data));
  }
}
