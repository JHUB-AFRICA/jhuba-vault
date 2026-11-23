import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AssetService } from '../core/api.service';
import { Asset, AssetCategory } from '../core/models';

interface AssetState { assets: Asset[]; search: string; category: AssetCategory | 'ALL'; availability: 'ALL' | 'IN_STOCK' | 'CHECKED_OUT' | 'UNDER_MAINTENANCE'; loading: boolean; loaded: boolean; error: string | null; page: number; total: number; totalPages: number; paginated: boolean; }
export const AssetStore = signalStore(
  { providedIn: 'root' },
  withState<AssetState>({ assets: [], search: '', category: 'ALL', availability: 'ALL', loading: false, loaded: false, error: null, page: 1, total: 0, totalPages: 1, paginated: false }),
  withComputed(({ assets, search, category, availability }) => ({
    filteredAssets: computed(() => assets().filter(asset => {
      const query = search().trim().toLowerCase();
      const matchesSearch = !query || `${asset.name} ${asset.assetTag} ${asset.description} ${Object.values(asset.specifications ?? {}).join(' ')}`.toLowerCase().includes(query);
      const selectedCategory = category();
      const assetCategory = String(asset.category).trim().toUpperCase();
      const matchesCategory = selectedCategory === 'ALL' || assetCategory === selectedCategory;
      const matchesAvailability = availability() === 'ALL' || (availability() === 'IN_STOCK' ? asset.availableQty > 0 : availability() === 'CHECKED_OUT' ? asset.availableQty === 0 : false);
      return matchesSearch && matchesCategory && matchesAvailability;
    })),
    selectedCount: computed(() => assets().length)
  })),
  withMethods((store, assetService = inject(AssetService)) => {
    let activeRequestKey: string | null = null;
    let requestSequence = 0;

    return {
    load(force = false, paginated = false): void {
      if (!force && (store.loading() || store.loaded())) return;
      const key = JSON.stringify({
        paginated,
        page: store.page(),
        search: store.search().trim(),
        category: store.category(),
        availability: store.availability()
      });
      if (activeRequestKey === key) return;
      activeRequestKey = key;
      const sequence = ++requestSequence;
      patchState(store, { loading: true, error: null });
      if (paginated) {
        const category = store.category();
        const availability = store.availability();
        assetService.listPage({ search: store.search().trim() || undefined, category: category === 'ALL' ? undefined : category, availability: availability === 'ALL' ? undefined : availability, page: store.page(), limit: 24 }).subscribe({
          next: response => { if (sequence === requestSequence) patchState(store, { assets: response.items, loading: false, loaded: true, paginated: true, total: response.total, totalPages: Math.max(1, response.totalPages), page: response.page }); },
          error: () => { if (sequence === requestSequence) patchState(store, { loading: false, loaded: false, error: 'Unable to load catalogue assets.' }); if (activeRequestKey === key) activeRequestKey = null; },
          complete: () => { if (activeRequestKey === key) activeRequestKey = null; }
        });
        return;
      }
      assetService.list().subscribe({
        next: assets => { if (sequence === requestSequence) patchState(store, { assets, loading: false, loaded: true, paginated: false, total: assets.length, totalPages: 1, page: 1 }); },
        error: () => { if (sequence === requestSequence) patchState(store, { loading: false, loaded: false, error: 'Unable to load catalogue assets.' }); if (activeRequestKey === key) activeRequestKey = null; },
        complete: () => { if (activeRequestKey === key) activeRequestKey = null; }
      });
    },
    loadPage(page = 1): void { patchState(store, { page }); this.load(true, true); },
    setSearch(search: string): void { patchState(store, { search, page: 1 }); },
    setCategory(category: AssetCategory | 'ALL'): void { patchState(store, { category, page: 1 }); },
    setAvailability(availability: AssetState['availability']): void { patchState(store, { availability, page: 1 }); },
    clearFilters(): void { patchState(store, { search: '', category: 'ALL', availability: 'ALL', page: 1 }); }
    };
  })
);
