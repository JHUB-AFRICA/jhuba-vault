import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, map, of, switchMap } from 'rxjs';
import { AssetService } from '../core/api.service';
import { RequestStore } from '../state/request.store';
import { AssetImageComponent } from '../shared/asset-image.component';

@Component({
  selector: 'jhub-asset-details-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, AssetImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (asset()) {
      <main class="asset-details page-width">
        <a class="back-link" routerLink="/catalogue">← Back to catalogue</a>
        <section class="details-layout">
          <div class="details-visual"><jhub-asset-image [url]="asset()!.imageUrl" [alt]="asset()!.name"></jhub-asset-image></div>
          <div class="details-copy">
            <p class="eyebrow">{{ asset()!.assetTag }}</p>
            <h1>{{ asset()!.name }}</h1>
            <p class="description">{{ asset()!.description }}</p>
            <p class="price">{{ asset()!.price | currency:'USD':'symbol':'1.2-2' }}</p>
            <div class="availability" [class.unavailable]="asset()!.availableQty === 0"><strong>{{ asset()!.availableQty }}</strong><span>of {{ asset()!.totalQuantity }} available</span></div>
            @if (asset()!.availableQty > 0) {<label class="quantity">Quantity <input type="number" min="1" [max]="asset()!.availableQty" [ngModel]="quantity()" (ngModelChange)="setQuantity($event)"></label>}
            @if (feedback()) {<p class="feedback" role="alert">{{ feedback() }}</p>}
            <button class="primary-button" [disabled]="asset()!.availableQty === 0" (click)="addToRequest()">{{ asset()!.availableQty ? 'Add to request' : 'Currently unavailable' }} <span>→</span></button>
            <dl class="specifications">@for (specification of specifications(); track specification[0]) {<div><dt>{{ specification[0] }}</dt><dd>{{ specification[1] }}</dd></div>}</dl>
          </div>
        </section>
      </main>
    } @else {
      <main class="asset-details page-width"><div class="state-box"><h1>Asset not found</h1><a class="back-link" routerLink="/catalogue">Return to catalogue</a></div></main>
    }
  `,
  styles: [`:host{display:block}.page-width{width:min(1160px,calc(100% - 48px));margin:auto}.asset-details{padding:48px 0 110px}.back-link{display:inline-block;color:#262571;text-decoration:none;font-size:12px;font-weight:700;margin-bottom:35px}.details-layout{display:grid;grid-template-columns:1fr 1fr;gap:55px;align-items:start}.details-visual{height:480px;background:#e8f1e9}.details-copy{padding:15px 0}.eyebrow{color:#3ea945;font-size:10px;font-weight:800;letter-spacing:2px;margin:0 0 18px}.details-copy h1{font:400 clamp(42px,5vw,64px)/1.02 Georgia,serif;color:#262571;margin:0}.description{color:#667083;line-height:1.7;max-width:480px;margin:22px 0}.price{font:700 18px Georgia,serif;color:#262571}.availability{display:flex;align-items:baseline;gap:8px;color:#3ea945;margin:30px 0}.availability strong{font:400 36px Georgia,serif}.availability span{font-size:11px;color:#667083}.availability.unavailable,.availability.unavailable strong{color:#e6292a}.quantity{display:block;color:#667083;font-size:11px;margin-bottom:15px}.quantity input{display:block;width:100px;border:1px solid #dce0e8;padding:10px;margin-top:7px}.feedback{color:#a51f20;font-size:11px}.specifications{border-top:1px solid #e6e8ee;margin-top:35px}.specifications div{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #e6e8ee;padding:13px 0;font-size:11px}.specifications dt{color:#7c8492}.specifications dd{color:#262571;margin:0;text-align:right}.state-box{background:#fff;border:1px solid #e6e8ee;padding:35px}.state-box h1{font:400 36px Georgia,serif;color:#262571;margin:0 0 20px}@media(max-width:760px){.asset-details{padding-top:35px}.details-layout{grid-template-columns:1fr;gap:25px}.details-visual{height:300px}.details-copy{padding:0}.details-copy h1{font-size:45px}}`]
})
export class AssetDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly assetService = inject(AssetService);
  protected readonly request = inject(RequestStore);
  protected readonly quantity = signal(1);
  protected readonly feedback = signal('');
  protected readonly asset = toSignal(this.route.paramMap.pipe(map(params => params.get('id') ?? ''), switchMap(id => this.assetService.getById(id)), catchError(() => of(undefined))), { initialValue: undefined });
  protected readonly specifications = computed(() => Object.entries(this.asset()?.specifications ?? {}));
  protected setQuantity(value: number): void { const asset = this.asset(); if (!asset) return; this.quantity.set(Math.max(1, Math.min(Number(value) || 1, asset.availableQty))); }
  protected addToRequest(): void { const asset = this.asset(); if (!asset || this.quantity() > asset.availableQty) { this.feedback.set('Choose a quantity within the available stock.'); return; } this.request.addAsset(asset, this.quantity()); this.feedback.set(`${this.quantity()} item${this.quantity() === 1 ? '' : 's'} added to your request.`); }
}