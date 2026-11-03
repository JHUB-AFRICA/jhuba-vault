import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL, ApiResponse } from '../../../core/http/api-response';
import { Asset, AssetCategory, AssetRequest, AuditLog, User } from '../../../core/models';

export interface HealthStatus {
  status: 'ok';
  service: string;
}

export interface AdminDashboard {
  totalAssets: number;
  availableInventory: number;
  checkedOutInventory: number;
  pendingRequests: number;
  approvedRequests: number;
  checkedOutRequests: number;
  returnedRequests: number;
  overdueRequests: number;
  users: number;
  categoryDistribution: Array<{ category: AssetCategory; quantity: number }>;
  requestActivity: Array<{ month: string; total: number; pending: number; approved: number; rejected: number; checkedOut: number; returned: number; overdue: number }>;
  recentRequests: AssetRequest[];
  recentActivity: AuditLog[];
}

export interface AdminSearchResult {
  type: 'asset' | 'request' | 'user';
  id: string;
  label: string;
  detail: string;
  href: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<AdminDashboard> {
    return this.http.get<ApiResponse<AdminDashboard>>(`${API_URL}/admin/dashboard`).pipe(map(response => response.data));
  }

  health(): Observable<HealthStatus> {
    return this.http.get<ApiResponse<HealthStatus>>(`${API_URL}/health`).pipe(map(response => response.data));
  }

  search(query: string): Observable<AdminSearchResult[]> {
    return this.http.get<ApiResponse<AdminSearchResult[]>>(`${API_URL}/admin/search`, { params: { q: query } }).pipe(map(response => response.data));
  }

  users(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${API_URL}/admin/users`).pipe(map(response => response.data));
  }

  updateUser(id: string, user: Pick<User, 'fullName' | 'phoneNumber' | 'department' | 'role'>): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${API_URL}/admin/users/${id}`, user).pipe(map(response => response.data));
  }

  inventory(): Observable<Asset[]> {
    return this.http.get<ApiResponse<Asset[]>>(`${API_URL}/admin/inventory`).pipe(map(response => response.data));
  }

  auditLog(): Observable<AuditLog[]> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${API_URL}/admin/audit`).pipe(map(response => response.data));
  }
}
