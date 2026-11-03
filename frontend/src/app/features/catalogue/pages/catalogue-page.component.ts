import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Asset, AssetCategory } from '../../../core/models';
import { AssetStore } from '../data-access/asset.store';
import { RequestStore } from '../../requests/data-access/request.store';
import { AssetImageComponent } from '../../../shared/ui/asset-image.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';
import { CATEGORY_META, CATEGORY_ORDER, categoryAccent, categoryLabel, categoryShort, stockTone } from '../../../shared/ui/format';

@Component({ selector: 'jhub-catalogue-page', standalone: true, imports: [FormsModule, RouterLink, AssetImageComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: `
<main class="catalogue-page page-width"><div class="catalogue-intro"><div><p class="eyebrow">PUBLIC CATALOGUE</p><h1>Tools for the <em>work ahead.</em></h1><p>Explore the physical assets available to JHUB Africa innovators.</p></div><label class="search-box"><span>⌕</span><input [ngModel]="assets.search()" (ngModelChange)="assets.setSearch($event)" aria-label="Search assets" placeholder="Search name, tag or specification"></label></div>
<div class="filter-row"><button [class.filter-active]="assets.category() === 'ALL'" (click)="assets.setCategory('ALL')">All assets</button>@for (category of categories; track category) {<button [class.filter-active]="assets.category() === category" (click)="assets.setCategory(category)">{{ label(category) }}</button>}<button [class.filter-active]="assets.availability() === 'IN_STOCK'" (click)="assets.setAvailability('IN_STOCK')">In stock</button><button [class.filter-active]="assets.availability() === 'CHECKED_OUT'" (click)="assets.setAvailability('CHECKED_OUT')">Checked out</button><button (click)="assets.clearFilters()">Clear filters</button></div>
@if (assets.loading()) {<div class="state-box">Loading assets…</div>} @else if (assets.error()) {<div class="state-box error" role="alert">{{ assets.error() }}</div>} @else if (!assets.filteredAssets().length) {<div class="state-box"><strong>No assets found.</strong><span>Try clearing a filter or searching for another asset.</span><button class="secondary-button" (click)="assets.clearFilters()">Clear filters</button></div>} @else {<div class="asset-grid">@for (asset of assets.filteredAssets(); track asset.id) {<article class="asset-card"><div class="asset-visual" [style.--accent]="accent(asset.category)"><jhub-asset-image [url]="asset.imageUrl" [alt]="asset.name"></jhub-asset-image><small>{{ label(asset.category) }}</small></div><div class="asset-info"><p class="asset-tag">{{ asset.assetTag }}</p><h3>{{ asset.name }}</h3><p class="asset-description">{{ asset.description }}</p><div class="asset-meta"><span class="stock" [class.unavailable]="asset.availableQty === 0" [class.low-stock]="asset.availableQty > 0 && asset.availableQty <= 2" [class.high-stock]="asset.availableQty > 2"><i></i>{{ asset.availableQty ? asset.availableQty + ' available' : 'Checked out' }}</span><span>{{ asset.totalQuantity }} total</span></div><div class="asset-actions"><a class="asset-link" [routerLink]="['/assets', asset.id]">View details <span>↗</span></a><button class="request-button" [disabled]="asset.availableQty === 0" (click)="request.addAsset(asset)">{{ asset.availableQty ? 'Add to request' : 'Unavailable' }}</button></div></div></article>}</div>}
@if (request.hasItems()) {<aside class="request-drawer" aria-label="Asset request basket"><div class="basket-heading"><div><p class="eyebrow">REQUEST BASKET</p><h2>{{ request.itemCount() }} component{{ request.itemCount() === 1 ? '' : 's' }} selected</h2></div><span class="basket-count" aria-live="polite" [attr.aria-label]="request.itemCount() + ' items in request basket'">{{ request.itemCount() }}</span></div><div class="drawer-items">@for (item of request.draft().items; track item.assetId) {<div><span>{{ item.asset.name }}</span><strong>{{ item.quantity }}</strong><button aria-label="Remove asset" (click)="request.removeAsset(item.assetId)">×</button></div>}</div><a class="primary-button" routerLink="/app/requests/new">Continue to request <span>→</span></a></aside>}</main>`,
styles: [`:host{display:block}.catalogue-page{padding:72px 0 110px}.page-width{width:min(1160px,calc(100% - 48px));margin:auto}.eyebrow{color:#3ea945;font-size:10px;font-weight:800;letter-spacing:2px;margin:0 0 18px}.catalogue-intro{display:flex;align-items:end;justify-content:space-between;gap:25px}.catalogue-intro h1{font:400 clamp(43px,5vw,58px)/1.02 Georgia,serif;color:#262571;margin:0}.catalogue-intro h1 em{color:#3ea945}.catalogue-intro p:last-child{color:#667083}.search-box{display:flex;align-items:center;background:#fff;border:1px solid #dce0e8;padding:0 15px;width:320px}.search-box input{border:0;padding:15px;width:100%;outline:0;font-size:12px}.filter-row{display:flex;gap:8px;margin:45px 0 24px;overflow:auto}.filter-row button{white-space:nowrap;border:1px solid #dce0e8;background:#fff;padding:11px 15px;color:#667083;font-size:11px}.filter-row .filter-active{background:#262571;color:#fff}.asset-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.asset-card{background:#fff;border:1px solid #e6e8ee}.asset-visual{height:170px;background:color-mix(in srgb,var(--accent) 13%,#fff);position:relative}.asset-visual jhub-asset-image{display:block;height:100%}.asset-visual small{position:absolute;top:14px;left:15px;font-size:9px;color:#667083;letter-spacing:1px}.asset-info{padding:20px}.asset-tag{margin:0;color:#3ea945;font-size:9px;letter-spacing:1px}.asset-info h3{font:22px Georgia,serif;color:#262571;margin:6px 0 10px}.asset-description{font-size:11px;color:#667083;line-height:1.5;min-height:34px}.asset-meta{display:flex;justify-content:space-between;color:#7c8492;font-size:11px;padding:15px 0;border-bottom:1px solid #edf0f4}.stock{color:#3ea945}.stock.low-stock{color:#b97812;background:#fff3da;border-radius:999px;padding:5px 8px}.stock.high-stock{color:#26753c;background:#e8f4e9;border-radius:999px;padding:5px 8px}.unavailable{color:#e6292a}.stock i{display:inline-block;width:7px;height:7px;background:currentColor;border-radius:50%;margin-right:5px}.asset-actions{display:flex;justify-content:space-between;padding-top:13px}.asset-link,.request-button{color:#262571;font-size:11px;font-weight:700;text-decoration:none;border:0;background:transparent}.request-button{color:#3ea945}.state-box{min-height:180px;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#667083}.state-box strong{font:24px Georgia,serif;color:#262571}.request-drawer{position:fixed;right:20px;bottom:20px;width:min(380px,calc(100% - 40px));background:#262571;color:#fff;padding:24px;z-index:10}.request-drawer h2{font:24px Georgia,serif;margin:0}.request-drawer .eyebrow{color:#89be32}.basket-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.basket-count{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 8px;border-radius:999px;background:#89be32;color:#262571;font-size:12px;font-weight:800}.drawer-items div{display:grid;grid-template-columns:1fr auto auto;gap:15px;padding:12px 0;border-bottom:1px solid #ffffff30;font-size:12px}.drawer-items button{background:transparent;border:0;color:#fff;font-size:20px}.primary-button{display:inline-flex;background:#262571;color:#fff;text-decoration:none;padding:14px 18px;font-weight:700;font-size:12px;margin-top:15px}@media(max-width:760px){.catalogue-intro{display:block}.search-box{width:100%;margin-top:25px}.asset-grid{grid-template-columns:1fr}.request-drawer{right:10px;bottom:10px;width:calc(100% - 20px)}}`]
})
export class CataloguePageComponent {
  protected readonly assets = inject(AssetStore);
  protected readonly request = inject(RequestStore);
  protected readonly categories = CATEGORY_ORDER;
  protected readonly meta = CATEGORY_META;
  protected readonly categoryShort = categoryShort;
  protected readonly stockTone = stockTone;
  protected readonly label = categoryLabel;
  protected readonly accent = categoryAccent;
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  constructor() {
    this.assets.load();
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const category = params.get('category');
      if (category && (Object.values(AssetCategory) as string[]).includes(category)) {
        this.assets.setCategory(category as AssetCategory);
      }
    });
  }

  protected countIn(category: AssetCategory): number {
    return this.assets.assets().filter(asset => asset.category === category).length;
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
}
