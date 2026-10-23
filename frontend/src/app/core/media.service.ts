import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Asset, User } from './models';

<<<<<<< HEAD
export interface MediaUpload { url: string; publicId: string; asset?: Asset; user?: User; }
export interface UploadProgress { percent: number; result?: MediaUpload; }

type MediaResponse = {
  secureUrl?: string;
  url?: string;
  publicId: string;
  asset?: Asset;
  user?: User;
};
=======
export interface MediaUpload { url: string; asset?: Asset; }
export interface UploadProgress { percent: number; result?: MediaUpload; }

type MediaResponse = Asset | { url: string; user: User };
>>>>>>> 96e22bab77eedbbcf837e3844a54b220ca1a6f7c

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  upload(file: File, folder: 'profile' | 'assets', assetId?: string): Observable<UploadProgress> {
    const data = new FormData();
    data.append('file', file);
    const endpoint = folder === 'assets' && assetId ? `/api/uploads/assets/${assetId}/image` : `/api/uploads/${folder}`;
<<<<<<< HEAD

    return this.http.post<{ success: boolean; data: MediaResponse }>(endpoint, data, {
      observe: 'events',
      reportProgress: true
    }).pipe(map((event: HttpEvent<{ success: boolean; data: MediaResponse }>) => {
      if (event.type === HttpEventType.UploadProgress) {
        return { percent: event.total ? Math.round((event.loaded / event.total) * 100) : 0 };
      }
      if (event.type !== HttpEventType.Response) return { percent: 0 };

      const response = event.body?.data;
      const url = response?.secureUrl ?? response?.url ?? response?.asset?.imageUrl;
      if (!response || !url || !response.publicId) {
        throw new Error('Media API returned an incomplete image upload response.');
      }

      return {
        percent: 100,
        result: {
          url,
          publicId: response.publicId,
          ...(response.asset ? { asset: response.asset } : {}),
          ...(response.user ? { user: response.user } : {})
        }
      };
=======
    return this.http.post<{ success: boolean; data: MediaResponse }>(endpoint, data, { observe: 'events', reportProgress: true }).pipe(map((event: HttpEvent<{ success: boolean; data: MediaResponse }>) => {
      if (event.type === HttpEventType.UploadProgress) return { percent: event.total ? Math.round((event.loaded / event.total) * 100) : 0 };
      if (event.type !== HttpEventType.Response) return { percent: 0 };
      const response = event.body?.data;
      if (!response) throw new Error('Media API returned an empty response.');
      return 'assetTag' in response
        ? { percent: 100, result: { url: response.imageUrl ?? '', asset: response } }
        : { percent: 100, result: { url: response.url } };
>>>>>>> 96e22bab77eedbbcf837e3844a54b220ca1a6f7c
    }));
  }

  removeAssetImage(assetId: string): Observable<void> {
    return this.http.delete<void>(`/api/uploads/assets/${assetId}/image`);
  }
}
