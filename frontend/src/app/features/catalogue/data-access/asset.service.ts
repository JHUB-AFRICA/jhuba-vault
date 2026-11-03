import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL, ApiResponse } from '../../../core/http/api-response';
import { Asset, AssetCategory } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);

  list(filters?: { search?: string; category?: AssetCategory; availability?: string }): Observable<Asset[]> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.availability) params = params.set('availability', filters.availability);
    return this.http.get<ApiResponse<Asset[]>>(`${API_URL}/assets`, { params }).pipe(map(response => response.data));
  }

  getById(id: string): Observable<Asset> {
    return this.http.get<ApiResponse<Asset>>(`${API_URL}/assets/${id}`).pipe(map(response => response.data));
  }

  create(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'imagePublicId'>): Observable<Asset> {
    return this.http.post<ApiResponse<Asset>>(`${API_URL}/assets`, asset).pipe(map(response => response.data));
  }

  update(id: string, asset: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'imagePublicId'>>): Observable<Asset> {
    return this.http.patch<ApiResponse<Asset>>(`${API_URL}/assets/${id}`, asset).pipe(map(response => response.data));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/assets/${id}`);
  }
}
