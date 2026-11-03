import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL, ApiResponse } from '../../../core/http/api-response';
import { Asset, AssetCategory } from '../../../core/models';

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

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);

  previewImport(file: File): Observable<HttpEvent<ApiResponse<AssetImportPreview>>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<AssetImportPreview>>(`${API_URL}/assets/import/preview`, form, { observe: 'events', reportProgress: true });
  }

  confirmImport(file: File, confirmation: {
    previewToken: string;
    approveZeroPrice: boolean;
    rows: Array<{ rowNumber: number; name: string; description: string; quantity: number; category: AssetCategory; price: number; warningsApproved: boolean }>;
  }): Observable<HttpEvent<ApiResponse<AssetImportResult>>> {
    const form = new FormData();
    form.append('file', file);
    form.append('confirmation', JSON.stringify(confirmation));
    return this.http.post<ApiResponse<AssetImportResult>>(`${API_URL}/assets/import/confirm`, form, { observe: 'events', reportProgress: true });
  }

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
