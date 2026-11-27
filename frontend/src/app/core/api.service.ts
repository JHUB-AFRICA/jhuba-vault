import { InjectionToken, Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
import { Asset, AssetCategory, AssetRequest, AuditLog, RequestStatus, TeamMember, User } from './models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api'
});
interface ApiResponse<T> { success: boolean; data: T; }
export interface AssetImportRow {
  rowNumber: number;
  item: string;
  description: string;
  quantityRaw: string;
  categoryRaw: string;
  quantity: number | null;
  category: AssetCategory | null;
  assetTag: string;
  warnings: string[];
  errors: string[];
  excluded: boolean;
  warningsApproved: boolean;
}
export interface AssetImportPreview {
  fileName: string;
  sheetName: string;
  previewToken: string;
  totalPopulatedRows: number;
  validRowsReady: number;
  rowsRequiringCorrection: number;
  rowsWithWarnings: number;
  duplicatesOrPotentialDuplicates: number;
  missingQuantities: number;
  missingDescriptions: number;
  categoryMappings: Record<string, number>;
  rows: AssetImportRow[];
}
export interface AssetImportResult {
  imported: number;
  skipped: number;
  alreadyImported?: number;
  failed: number;
  failedRows: Array<{ rowNumber?: number; errors: string[] }>;
}
export interface AuthCredentials { email: string; password: string; }
export interface RegistrationData extends AuthCredentials { fullName: string; phoneNumber: string; identificationId: string; department?: string; }
export interface AuthResponse { user: User; token: string; }
export interface HealthStatus { status: 'ok'; service: string; }
export interface AdminRequestCounts extends Record<RequestStatus, number> { total: number; }
export interface AdminRequestPage { items: AssetRequest[]; page: number; limit: number; total: number; totalPages: number; statusCounts?: AdminRequestCounts; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  login(credentials: AuthCredentials): Observable<AuthResponse> { return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, credentials).pipe(map(response => response.data)); }
  register(data: RegistrationData): Observable<AuthResponse> { return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, data).pipe(map(response => response.data)); }
  me(): Observable<User> { return this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/me`).pipe(map(response => response.data)); }
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  previewImport(file: File): Observable<HttpEvent<ApiResponse<AssetImportPreview>>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<AssetImportPreview>>(`${this.apiUrl}/assets/import/preview`, form, { observe: 'events', reportProgress: true });
  }
  confirmImport(file: File, confirmation: { previewToken: string; approveZeroPrice: boolean; rows: Array<{ rowNumber: number; name: string; description: string; quantity: number; category: AssetCategory; price: number; warningsApproved: boolean }> }): Observable<HttpEvent<ApiResponse<AssetImportResult>>> {
    const form = new FormData();
    form.append('file', file);
    form.append('confirmation', JSON.stringify(confirmation));
    return this.http.post<ApiResponse<AssetImportResult>>(`${this.apiUrl}/assets/import/confirm`, form, { observe: 'events', reportProgress: true });
  }
  list(filters?: { search?: string; category?: AssetCategory; availability?: string }): Observable<Asset[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.availability) params = params.set('availability', filters.availability);
    return this.http.get<ApiResponse<Asset[]>>(`${this.apiUrl}/assets`, { params }).pipe(map(response => response.data));
  }
  getById(id: string): Observable<Asset> { return this.http.get<ApiResponse<Asset>>(`${this.apiUrl}/assets/${id}`).pipe(map(response => response.data)); }
  create(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'imagePublicId'>): Observable<Asset> { return this.http.post<ApiResponse<Asset>>(`${this.apiUrl}/assets`, asset).pipe(map(response => response.data)); }
  update(id: string, asset: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'imagePublicId'>>): Observable<Asset> { return this.http.patch<ApiResponse<Asset>>(`${this.apiUrl}/assets/${id}`, asset).pipe(map(response => response.data)); }
  remove(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/assets/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  listMine(limit?: number): Observable<AssetRequest[]> {
    const params = limit ? new HttpParams().set('limit', limit) : undefined;
    return this.http.get<ApiResponse<{ items: AssetRequest[] }>>(`${this.apiUrl}/requests`, { params }).pipe(map(response => response.data.items));
  }
  listAllMine(limit = 100): Observable<AssetRequest[]> {
    const loadPage = (page: number) => this.http.get<ApiResponse<{ items: AssetRequest[]; page: number; totalPages: number }>>(
      `${this.apiUrl}/requests`,
      { params: new HttpParams().set('page', page).set('limit', limit) }
    );
    return loadPage(1).pipe(
      expand(response => response.data.page < response.data.totalPages ? loadPage(response.data.page + 1) : EMPTY),
      map(response => response.data.items),
      reduce((allRequests, pageRequests) => [...allRequests, ...pageRequests], [] as AssetRequest[])
    );
  }
  getById(id: string): Observable<AssetRequest> { return this.http.get<ApiResponse<AssetRequest>>(`${this.apiUrl}/requests/${id}`).pipe(map(response => response.data)); }
  create(request: { projectName: string; projectAbstract: string; loanDays: number; startDate: string; items: Array<{ assetId: string; quantity: number }>; teamMembers: Array<Omit<TeamMember, 'id' | 'requestId' | 'name' | 'role'>> }): Observable<AssetRequest> { return this.http.post<ApiResponse<AssetRequest>>(`${this.apiUrl}/requests`, request).pipe(map(response => response.data)); }
  createAdmin(request: { innovatorId: string; projectName: string; projectAbstract: string; loanDays: number; startDate: string; items: Array<{ assetId: string; quantity: number }>; teamMembers: Array<Omit<TeamMember, 'id' | 'requestId' | 'name' | 'role'>> }): Observable<AssetRequest> { return this.http.post<ApiResponse<AssetRequest>>(`${this.apiUrl}/admin/requests`, request).pipe(map(response => response.data)); }
  update(id: string, request: Partial<AssetRequest>): Observable<AssetRequest> { return this.http.patch<ApiResponse<AssetRequest>>(`${this.apiUrl}/requests/${id}`, request).pipe(map(response => response.data)); }
  approve(id: string): Observable<AssetRequest> { return this.http.patch<ApiResponse<AssetRequest>>(`${this.apiUrl}/admin/requests/${id}/approve`, {}).pipe(map(response => response.data)); }
  reject(id: string, rejectionReason: string): Observable<AssetRequest> { return this.http.patch<ApiResponse<AssetRequest>>(`${this.apiUrl}/admin/requests/${id}/reject`, { rejectionReason }).pipe(map(response => response.data)); }
  checkout(id: string): Observable<AssetRequest> { return this.http.patch<ApiResponse<AssetRequest>>(`${this.apiUrl}/admin/requests/${id}/checkout`, {}).pipe(map(response => response.data)); }
  returnAsset(id: string): Observable<AssetRequest> { return this.http.patch<ApiResponse<AssetRequest>>(`${this.apiUrl}/admin/requests/${id}/return`, {}).pipe(map(response => response.data)); }
  listAdmin(filters?: { search?: string; status?: string }): Observable<AssetRequest[]> { return this.listAdminPage(filters).pipe(map(response => response.items)); }
  listAdminPage(filters?: { search?: string; status?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string }): Observable<AdminRequestPage> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<ApiResponse<AdminRequestPage>>(    `${this.apiUrl}/admin/requests`, { params }).pipe(map(response => response.data));
  }
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  getMine(): Observable<User> { return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/me`).pipe(map(response => response.data)); }
  updateMine(profile: Partial<User>): Observable<User> { return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/users/me`, profile).pipe(map(response => response.data)); }
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  dashboard(): Observable<AdminDashboard> { return this.http.get<ApiResponse<AdminDashboard>>(`${this.apiUrl}/admin/dashboard`).pipe(map(response => response.data)); }
  health(): Observable<HealthStatus> { return this.http.get<ApiResponse<HealthStatus>>(`${this.apiUrl}/health`).pipe(map(response => response.data)); }
  search(query: string): Observable<AdminSearchResult[]> { return this.http.get<ApiResponse<AdminSearchResult[]>>(`${this.apiUrl}/admin/search`, { params: { q: query } }).pipe(map(response => response.data)); }
  users(): Observable<User[]> { return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/admin/users`).pipe(map(response => response.data)); }
  updateUser(id: string, user: Pick<User, 'fullName' | 'phoneNumber' | 'department' | 'role'>): Observable<User> { return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/admin/users/${id}`, user).pipe(map(response => response.data)); }
  inventory(): Observable<Asset[]> { return this.http.get<ApiResponse<Asset[]>>(`${this.apiUrl}/admin/inventory`).pipe(map(response => response.data)); }
  auditLog(): Observable<AuditLog[]> { return this.http.get<ApiResponse<AuditLog[]>>(`${this.apiUrl}/admin/audit`).pipe(map(response => response.data)); }
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
export interface AdminSearchResult { type: 'asset' | 'request' | 'user'; id: string; label: string; detail: string; href: string; }

export type AskHubChatMessage = { role: 'user' | 'assistant'; content: string; };
export interface AskHubPreparedRequest {
  request: {
    projectName: string;
    projectAbstract: string;
    loanDays: number;
    startDate: string;
    items: Array<{ assetId: string; quantity: number }>;
    teamMembers: Array<{
      fullName: string;
      email: string;
      phoneNumber: string;
      studentOrIdNo: string;
      roleInProject: string;
    }>;
  };
  assets: Asset[];
}
export interface AskHubRequestResult {
  id: string;
  projectName: string;
  status: RequestStatus;
  createdAt: string;
  requestItems: Array<{ quantity: number; asset: Pick<Asset, 'id' | 'name' | 'assetTag'> }>;
}
export type AskHubNavigationIntent =
  | 'dashboard'
  | 'catalogue'
  | 'request_cart'
  | 'my_requests'
  | 'profile'
  | 'admin_dashboard'
  | 'admin_requests'
  | 'admin_assets'
  | 'admin_inventory'
  | 'admin_users'
  | 'admin_audit_log'
  | 'admin_settings';
export type AskHubToolResult =
  | { type: 'inventory'; items: Asset[] }
  | { type: 'requests'; items: AskHubRequestResult[] }
  | { type: 'request'; item: AskHubRequestResult }
  | { type: 'prepared_request'; item: AskHubPreparedRequest }
  | { type: 'navigation'; intent: AskHubNavigationIntent; label: string }
  | { type: 'error'; tool: string; message: string };
export interface AskHubChatResponse { reply: string; results: AskHubToolResult[]; }

@Injectable({ providedIn: 'root' })
export class AskHubService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  chat(messages: AskHubChatMessage[]): Observable<AskHubChatResponse> {
    return this.http.post<ApiResponse<AskHubChatResponse>>(`${this.apiUrl}/ai/chat`, { messages })
      .pipe(map(response => response.data));
  }
}
