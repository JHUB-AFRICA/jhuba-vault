import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, expand, map, Observable, reduce } from 'rxjs';
import { API_URL, ApiResponse } from '../../../core/http/api-response';
import { AssetRequest, RequestStatus, TeamMember } from '../../../core/models';

export interface AdminRequestCounts extends Record<RequestStatus, number> {
  total: number;
}

export interface AdminRequestPage {
  items: AssetRequest[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusCounts?: AdminRequestCounts;
}

export interface InnovationSupportRequestSummary {
  id: string;
  referenceCode?: string;
  title: string;
  description: string;
  category: string;
  categoryDetails?: Record<string, unknown>;
  priority: string;
  country: string;
  status: string;
  declineReason?: string | null;
  clarificationPrompt?: string | null;
  assignedTo?: { id: string; fullName: string; email: string } | null;
  comments?: Array<{ id: string; content: string; visibility: 'REQUESTER_VISIBLE' | 'INTERNAL_ONLY'; author?: { fullName: string } }>;

  delivery?: { summary: string; actualOutcome: string; evidenceLinks: string[]; deliveryDate: string } | null;
  feedback?: { rating: number; comment?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string } | null;
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly http = inject(HttpClient);

  listMine(limit?: number): Observable<AssetRequest[]> {
    const params = limit ? new HttpParams().set('limit', limit) : undefined;
    return this.http.get<ApiResponse<{ items: AssetRequest[] }>>(`${API_URL}/requests`, { params }).pipe(map(response => response.data.items));
  }

  listAllMine(limit = 100): Observable<AssetRequest[]> {
    const loadPage = (page: number) => this.http.get<ApiResponse<{ items: AssetRequest[]; page: number; totalPages: number }>>(
      `${API_URL}/requests`,
      { params: new HttpParams().set('page', page).set('limit', limit) }
    );
    return loadPage(1).pipe(
      expand(response => response.data.page < response.data.totalPages ? loadPage(response.data.page + 1) : EMPTY),
      map(response => response.data.items),
      reduce((allRequests, pageRequests) => [...allRequests, ...pageRequests], [] as AssetRequest[])
    );
  }

  getById(id: string): Observable<AssetRequest> {
    return this.http.get<ApiResponse<AssetRequest>>(`${API_URL}/requests/${id}`).pipe(map(response => response.data));
  }

  create(request: {
    projectName: string;
    projectAbstract: string;
    loanDays: number;
    startDate: string;
    items: Array<{ assetId: string; quantity: number }>;
    teamMembers: Array<Omit<TeamMember, 'id' | 'requestId' | 'name' | 'role'>>;
  }): Observable<AssetRequest> {
    return this.http.post<ApiResponse<AssetRequest>>(`${API_URL}/requests`, request).pipe(map(response => response.data));
  }

  createAdmin(request: {
    innovatorId: string;
    projectName: string;
    projectAbstract: string;
    loanDays: number;
    startDate: string;
    items: Array<{ assetId: string; quantity: number }>;
    teamMembers: Array<Omit<TeamMember, 'id' | 'requestId' | 'name' | 'role'>>;
  }): Observable<AssetRequest> {
    return this.http.post<ApiResponse<AssetRequest>>(`${API_URL}/admin/requests`, request).pipe(map(response => response.data));
  }

  update(id: string, request: Partial<AssetRequest>): Observable<AssetRequest> {
    return this.http.patch<ApiResponse<AssetRequest>>(`${API_URL}/requests/${id}`, request).pipe(map(response => response.data));
  }

  approve(id: string): Observable<AssetRequest> {
    return this.http.patch<ApiResponse<AssetRequest>>(`${API_URL}/admin/requests/${id}/approve`, {}).pipe(map(response => response.data));
  }

  reject(id: string, rejectionReason: string): Observable<AssetRequest> {
    return this.http.patch<ApiResponse<AssetRequest>>(`${API_URL}/admin/requests/${id}/reject`, { rejectionReason }).pipe(map(response => response.data));
  }

  checkout(id: string): Observable<AssetRequest> {
    return this.http.patch<ApiResponse<AssetRequest>>(`${API_URL}/admin/requests/${id}/checkout`, {}).pipe(map(response => response.data));
  }

  returnAsset(id: string): Observable<AssetRequest> {
    return this.http.patch<ApiResponse<AssetRequest>>(`${API_URL}/admin/requests/${id}/return`, {}).pipe(map(response => response.data));
  }

  listAdmin(filters?: { search?: string; status?: string }): Observable<AssetRequest[]> {
    return this.listAdminPage(filters).pipe(map(response => response.items));
  }

  listAdminPage(filters?: { search?: string; status?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string }): Observable<AdminRequestPage> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<ApiResponse<AdminRequestPage>>(`${API_URL}/admin/requests`, { params }).pipe(map(response => response.data));
  }

  listInnovationSupportMine(filters?: { search?: string; status?: string; category?: string; priority?: string; dateFrom?: string; dateTo?: string }): Observable<InnovationSupportRequestSummary[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('q', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.priority) params = params.set('priority', filters.priority);
    if (filters?.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http
      .get<ApiResponse<InnovationSupportRequestSummary[]> | InnovationSupportRequestSummary[]>(`${API_URL}/innovation-hub/requests`, { params })
      .pipe(map(response => Array.isArray(response) ? response : response.data));
  }

  getInnovationSupport(id: string): Observable<InnovationSupportRequestSummary> {
    return this.http.get<ApiResponse<InnovationSupportRequestSummary>>(`${API_URL}/innovation-hub/requests/${id}`).pipe(map(response => response.data));
  }

  updateInnovationSupportStatus(id: string, status: string, options: { note?: string; declineReason?: string; clarificationPrompt?: string } = {}) {
    return this.http.patch<ApiResponse<InnovationSupportRequestSummary>>(`${API_URL}/innovation-hub/requests/${id}/status`, { status, ...options }).pipe(map(response => response.data));
  }

  assignInnovationSupport(id: string, ownerId: string) {
    return this.http.patch<ApiResponse<InnovationSupportRequestSummary>>(`${API_URL}/innovation-hub/requests/${id}/assign`, { ownerId }).pipe(map(response => response.data));
  }

  commentInnovationSupport(id: string, content: string, visibility: 'REQUESTER_VISIBLE' | 'INTERNAL_ONLY' = 'REQUESTER_VISIBLE') {
    return this.http.post<ApiResponse<unknown>>(`${API_URL}/innovation-hub/requests/${id}/comments`, { content, visibility }).pipe(map(response => response.data));
  }

  respondInnovationSupport(id: string, response: string) {
    return this.http.post<ApiResponse<InnovationSupportRequestSummary>>(`${API_URL}/innovation-hub/requests/${id}/respond`, { response }).pipe(map(result => result.data));
  }

  completeInnovationSupport(id: string, delivery: { summary: string; actualOutcome: string; deliveryDate: string; evidenceLinks: string[] }) {
    return this.http.post<ApiResponse<InnovationSupportRequestSummary>>(`${API_URL}/innovation-hub/requests/${id}/delivery`, delivery).pipe(map(result => result.data));
  }

  feedbackInnovationSupport(id: string, rating: number, comment?: string) {
    return this.http.post<ApiResponse<unknown>>(`${API_URL}/innovation-hub/requests/${id}/feedback`, { rating, comment }).pipe(map(result => result.data));
  }
}
