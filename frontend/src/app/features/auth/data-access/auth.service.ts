import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL, ApiResponse } from '../../../core/http/api-response';
import { User } from '../../../core/models';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends AuthCredentials {
  fullName: string;
  phoneNumber: string;
  identificationId: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_URL}/auth/login`, credentials).pipe(map(response => response.data));
  }

  register(data: RegistrationData): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${API_URL}/auth/register`, data).pipe(map(response => response.data));
  }

  me(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${API_URL}/auth/me`).pipe(map(response => response.data));
  }
}
