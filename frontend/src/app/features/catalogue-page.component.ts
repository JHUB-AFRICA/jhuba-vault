import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Asset, AssetCategory } from '../core/models';
import { AssetStore } from '../state/asset.store';
import { RequestStore } from '../state/request.store';
import { AssetImageComponent } from '../shared/asset-image.component';
import { EmptyStateComponent } from '../shared/empty-state.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { CATEGORY_META, CATEGORY_ORDER, categoryLabel, categoryShort, stockTone } from '../shared/format';

@Component({
  selector: 'jhub-catalogue-page',
  standalone: true,
  styleUrls: ['./catalogue-page.component.css'],
  templateUrl: './catalogue-page.component.html',
  imports: [FormsModule, RouterLink, AssetImageComponent, EmptyStateComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CataloguePageComponent {
  protected readonly assets = inject(AssetStore);
  protected readonly request = inject(RequestStore);
  protected readonly categories = CATEGORY_ORDER;
  protected readonly meta = CATEGORY_META;
  protected readonly categoryShort = categoryShort;
  protected readonly stockTone = stockTone;
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];
  protected readonly label = categoryLabel;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const category = params.get('category');
      if (category && (Object.values(AssetCategory) as string[]).includes(category)) {
        this.assets.setCategory(category as AssetCategory);
      } else {
        this.assets.setCategory('ALL');
      }
      this.assets.load(true);
    });
  }

  protected countIn(category: AssetCategory): number {
    return this.assets.assets().filter(asset => String(asset.category).trim().toUpperCase() === category).length;
  }

  protected inRequest(assetId: string): number {
    return this.request.draft().items.find(item => item.assetId === assetId)?.quantity ?? 0;
  }

  protected add(asset: Asset): void {
    this.request.addAsset(asset);
  }

  protected change(asset: Asset, delta: number): void {
    const next = this.inRequest(asset.id) + delta;
    if (next <= 0) this.request.removeAsset(asset.id);
    else this.request.setQuantity(asset.id, next);
  }

  protected hasFilters(): boolean {
    return !!this.assets.search() || this.assets.category() !== 'ALL' || this.assets.availability() !== 'ALL';
  }

  protected emptyTitle(): string {
    return this.assets.category() === 'ALL'
      ? (this.hasFilters() ? 'No assets match your filters' : 'The catalogue is empty')
      : `No ${categoryLabel(this.assets.category())} assets found`;
  }

  protected emptyText(): string {
    return this.assets.category() === 'ALL'
      ? (this.hasFilters() ? 'Try a different search term or clear the filters to see everything.' : 'Assets will appear here once the Vault administrators add them.')
      : 'Try another category or clear the filters to browse every asset in the Vault.';
  }

  protected setSearch(value: string): void { this.assets.setSearch(value); }
  protected setCategory(value: AssetCategory | 'ALL'): void {
    this.assets.setCategory(value);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: value === 'ALL' ? {} : { category: value }
    });
  }
  protected setAvailability(value: 'ALL' | 'IN_STOCK' | 'CHECKED_OUT'): void { this.assets.setAvailability(value); }
  protected clearFilters(): void {
    this.assets.clearFilters();
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
  protected goToPage(page: number): void { if (page >= 1 && page <= this.assets.totalPages()) this.assets.loadPage(page); }
}
