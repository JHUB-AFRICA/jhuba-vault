

import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AssetCategory, RequestStatus, Asset } from '../core/models';
import { AssetService } from '../core/api.service';
import { MediaService } from '../core/media.service';
import { AssetImageComponent } from '../shared/asset-image.component';

interface AssetDraft { assetTag: string; name: string; category: AssetCategory; description: string; price: number; totalQuantity: number; availableQty: number; }

@Component({
  selector: 'jhub-admin-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, AssetImageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="admin-page page-width">
      <div class="admin-heading">
        <div>
          <p class="eyebrow">ADMINISTRATION / {{ sectionLabel() }}</p>
          <h1>{{ title() }} <em>{{ accent() }}</em></h1>
        </div>

        <a class="arrow-link" routerLink="/admin/dashboard">
          Dashboard ↗
        </a>
      </div>

      @if (section() === 'assets') {
        <section class="table-panel">
          <div class="toolbar">
            <strong>Asset management</strong>
            <span>{{ assets().length }} development records</span>
          </div>

          <form class="asset-form" (ngSubmit)="saveAsset()">
            <strong>{{ editingId() ? 'Edit asset' : 'Create asset' }}</strong>
            <div class="form-grid">
              <label>Asset tag<input name="assetTag" [(ngModel)]="form.assetTag" required></label>
              <label>Name<input name="name" [(ngModel)]="form.name" required></label>
              <label>Category<select name="category" [(ngModel)]="form.category" required>@for (category of categories; track category) {<option [ngValue]="category">{{ label(category) }}</option>}</select></label>
              <label>Price<input name="price" type="number" min="0" step="0.01" [(ngModel)]="form.price" required></label>
              <label>Total quantity<input name="totalQuantity" type="number" min="1" step="1" [(ngModel)]="form.totalQuantity" required></label>
              <label>Available quantity<input name="availableQty" type="number" min="0" [max]="form.totalQuantity" step="1" [(ngModel)]="form.availableQty" required></label>
            </div>
            <label>Description<textarea name="description" rows="3" [(ngModel)]="form.description" required></textarea></label>
            @if (message()) {<p class="feedback" [class.error]="error()">{{ message() }}</p>}
            <div class="form-actions"><button type="submit" [disabled]="busy()">{{ editingId() ? 'Save changes' : 'Create asset' }}</button>@if (editingId()) {<button type="button" class="cancel" (click)="resetForm()">Cancel</button>}</div>
          </form>

          <div class="asset-management">
            @for (asset of assets(); track asset.id) {
              <article class="asset-editor">
                <div class="asset-preview">
                  <jhub-asset-image
                    [url]="asset.imageUrl"
                    [alt]="asset.name">
                  </jhub-asset-image>
                </div>

                <div class="asset-editor-info">
                  <strong>{{ asset.name }}</strong>
                  <small>{{ asset.assetTag }}</small>
                  <small>{{ asset.price | currency:'USD':'symbol':'1.2-2' }} · {{ asset.availableQty }}/{{ asset.totalQuantity }} available</small>
                  <button class="edit-asset" (click)="edit(asset)">Edit details</button>
                  <button class="edit-asset" (click)="toggleAvailability(asset)">{{ asset.availableQty ? 'Mark unavailable' : 'Mark available' }}</button>
                  <button class="remove-image" [disabled]="busy()" (click)="deleteAsset(asset)">Delete asset</button>

                  <label class="file-button">
                    {{ uploadingId() === asset.id
                      ? 'Uploading ' + progress() + '%'
                      : 'Select image' }}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      [disabled]="busy()"
                      (change)="upload(asset, $event)">
                  </label>

                  @if (asset.imageUrl) {
                    <button
                      class="remove-image"
                      [disabled]="busy()"
                      (click)="remove(asset)">
                      Remove image
                    </button>
                  }

                  <small>JPEG, PNG or WebP · max 5MB</small>
                </div>
              </article>
            }
          </div>

        </section>
      }

      @else if (section() === 'inventory') {
        <section class="table-panel">
          <div class="toolbar">
            <strong>Inventory overview</strong>
          </div>

          @for (asset of assets(); track asset.id) {
            <div class="asset-line">
              <span>
                <strong>{{ asset.name }}</strong>
                <small>{{ asset.assetTag }}</small>
              </span>

              <span>{{ label(asset.category) }}</span>
              <span>{{ asset.totalQuantity }}</span>
              <span>{{ asset.availableQty }}</span>
              <span>
                {{ asset.availableQty ? 'IN STOCK' : 'CHECKED OUT' }}
              </span>
            </div>
          }
        </section>
      }

      @else if (section() === 'requests') {
        <section class="table-panel">
          <div class="toolbar">
            <strong>Request queue</strong>
          </div>

          <div class="asset-line">
            <span>
              <strong>AgriSense Soil Monitor</strong>
              <small>Amina Wanjiku · 4 assets</small>
            </span>

            <span class="status pending">
              {{ RequestStatus.PENDING }}
            </span>

            <button class="approve">Approve</button>
            <button class="reject">Reject</button>
          </div>
        </section>
      }

      @else if (section() === 'users') {
        <section class="table-panel">
          <div class="toolbar">
            <strong>Innovator directory</strong>
          </div>

          <div class="asset-line">
            <span>
              <strong>Amina Wanjiku</strong>
              <small>JHUB-001</small>
            </span>

            <span>amina@example.com</span>
            <span>INNOVATOR</span>
          </div>
        </section>
      }

      @else if (section() === 'audit-log') {
        <section class="empty-panel">
          <strong>No audit activity available.</strong>
          <span>Audit records appear when the API is connected.</span>
        </section>
      }

      @else {
        <section class="settings-panel">
          <p class="eyebrow">ADMIN SETTINGS</p>
          <h2>Vault configuration</h2>
          <p>Settings exposed by the backend will appear here.</p>
        </section>
      }
    </main>
  `,
  styles: [`
    :host {
      display: block;
    }

    .admin-page {
      padding: 65px 0 110px;
    }

    .page-width {
      width: min(1160px, calc(100% - 48px));
      margin: auto;
    }

    .eyebrow {
      color: #3ea945;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      margin: 0 0 18px;
    }

    .admin-heading {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 35px;
    }

    .admin-heading h1 {
      font: 400 clamp(42px, 5vw, 58px)/1.05 Georgia, serif;
      color: #262571;
      margin: 0;
    }

    .admin-heading em {
      color: #3ea945;
    }

    .arrow-link {
      color: #262571;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
    }

    .table-panel,
    .settings-panel,
    .empty-panel {
      background: #fff;
      border: 1px solid #e6e8ee;
      padding: 25px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 1px solid #edf0f4;
      color: #262571;
    }

    .toolbar span {
      font-size: 11px;
      color: #7c8492;
    }

    .asset-management {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      padding-top: 20px;
    }

    .asset-editor {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 15px;
      border: 1px solid #edf0f4;
      padding: 15px;
    }

    .asset-preview {
      height: 120px;
    }

    .asset-preview jhub-asset-image {
      display: block;
      height: 100%;
    }

    .asset-editor-info strong,
    .asset-editor-info small {
      display: block;
    }

    .asset-editor-info strong {
      color: #262571;
    }

    .asset-editor-info small {
      font-size: 10px;
      color: #7c8492;
      margin: 5px 0;
    }

    .file-button {
      display: inline-block;
      background: #262571;
      color: #fff;
      padding: 9px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .file-button input {
      display: none;
    }

    .remove-image {
      display: block;
      border: 0;
      background: transparent;
      color: #e6292a;
      padding: 8px 0;
      font-size: 10px;
    }

    .feedback {
      color: #26742b;
      font-size: 12px;
    }

    .feedback.error {
      color: #a51f20;
    }

    .asset-line {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: 15px;
      padding: 15px 0;
      border-bottom: 1px solid #edf0f4;
      font-size: 11px;
      color: #667083;
    }

    .asset-line strong,
    .asset-line small {
      display: block;
    }

    .asset-line strong {
      color: #262571;
    }

    .asset-line small {
      font-size: 9px;
    }

    .approve,
    .reject {
      border: 0;
      background: transparent;
      font-size: 11px;
      font-weight: 700;
    }

    .approve {
      color: #3ea945;
    }

    .reject {
      color: #e6292a;
    }

    .pending {
      color: #b17b19;
    }

    .empty-panel {
      min-height: 220px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #667083;
      gap: 10px;
    }

    .empty-panel strong,
    .settings-panel h2 {
      font: 25px Georgia, serif;
      color: #262571;
    }

    @media (max-width: 760px) {
      .asset-management {
        grid-template-columns: 1fr;
      }

      .admin-heading {
        display: block;
      }

      .asset-line {
        min-width: 650px;
      }

      .table-panel {
        overflow: auto;
      }
    }
  `]
})
export class AdminPageComponent {
  private readonly router = inject(Router);
  private readonly media = inject(MediaService);
  private readonly assetService = inject(AssetService);

  protected readonly RequestStatus = RequestStatus;
  protected readonly categories = Object.values(AssetCategory);
  protected readonly assets = signal<Asset[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected form: AssetDraft = this.emptyForm();

  protected readonly section = computed(
    () => this.router.url.split('/')[2] || 'dashboard'
  );

  protected readonly sectionLabel = computed(
    () => this.section().replace('-', ' ').toUpperCase()
  );

  protected readonly title = computed(
    () => this.section() === 'audit-log'
      ? 'Audit'
      : this.section()
  );

  protected readonly accent = computed(
    () => this.section() === 'requests'
      ? 'queue.'
      : 'overview.'
  );

  protected readonly uploadingId = signal<string | null>(null);
  protected readonly progress = signal(0);
  protected readonly message = signal('');
  protected readonly error = signal(false);

  protected readonly busy = computed(
    () => this.uploadingId() !== null || this.saving()
  );

  constructor() { this.loadAssets(); }

  protected label(value: AssetCategory): string {
    return value.replaceAll('_', ' ');
  }

  private emptyForm(): AssetDraft { return { assetTag: '', name: '', category: AssetCategory.COMPUTING_PERIPHERALS, description: '', price: 0, totalQuantity: 1, availableQty: 1 }; }
  private loadAssets(): void { this.assetService.list().subscribe({ next: assets => this.assets.set(assets), error: () => this.setFeedback('Unable to load assets.', true) }); }
  private setFeedback(message: string, isError = false): void { this.error.set(isError); this.message.set(message); }
  protected resetForm(): void { this.editingId.set(null); this.form = this.emptyForm(); }
  protected edit(asset: Asset): void { this.editingId.set(asset.id); this.form = { assetTag: asset.assetTag, name: asset.name, category: asset.category, description: asset.description, price: Number(asset.price), totalQuantity: asset.totalQuantity, availableQty: asset.availableQty }; }
  protected saveAsset(): void {
    if (!this.form.assetTag.trim() || !this.form.name.trim() || !this.form.description.trim() || this.form.price < 0 || this.form.totalQuantity < 1 || this.form.availableQty < 0 || this.form.availableQty > this.form.totalQuantity) { this.setFeedback('Complete all fields and keep quantities within valid limits.', true); return; }
    this.saving.set(true); this.setFeedback('');
    const request = this.editingId() ? this.assetService.update(this.editingId()!, this.form) : this.assetService.create({ ...this.form, imageUrl: null, specifications: {} });
    request.subscribe({ next: asset => { this.assets.update(assets => this.editingId() ? assets.map(item => item.id === asset.id ? asset : item) : [...assets, asset]); this.resetForm(); this.setFeedback('Asset saved successfully.'); }, error: () => this.setFeedback('Unable to save asset. Check the asset tag and field values.', true), complete: () => this.saving.set(false) });
  }
  protected toggleAvailability(asset: Asset): void { const availableQty = asset.availableQty ? 0 : asset.totalQuantity; this.assetService.update(asset.id, { availableQty }).subscribe({ next: updated => { this.assets.update(assets => assets.map(item => item.id === updated.id ? updated : item)); this.setFeedback('Asset availability updated.'); }, error: () => this.setFeedback('Unable to update asset availability.', true) }); }
  protected deleteAsset(asset: Asset): void { if (!confirm(`Delete ${asset.name}?`)) return; this.assetService.remove(asset.id).subscribe({ next: () => { this.assets.update(assets => assets.filter(item => item.id !== asset.id)); this.setFeedback('Asset deleted successfully.'); }, error: () => this.setFeedback('Unable to delete this asset. It may have request history.', true) }); }

  protected upload(asset: Asset, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) {
      return;
    }

    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5_000_000
    ) {
      this.error.set(true);
      this.message.set(
        'Choose a JPEG, PNG, or WebP image smaller than 5MB.'
      );
      return;
    }

    this.error.set(false);
    this.message.set('');
    this.uploadingId.set(asset.id);

    this.media.upload(file, 'assets', asset.id).subscribe({
      next: update => {
        this.progress.set(update.percent);

        if (update.result) {
          asset.imageUrl = update.result.url;
        }
      },

      error: () => {
        this.error.set(true);
        this.message.set(
          'Image upload failed. Please try again.'
        );
        this.uploadingId.set(null);
      },

      complete: () => {
        this.uploadingId.set(null);
        this.message.set(
          'Asset image uploaded successfully.'
        );
      }
    });
  }

  protected remove(asset: Asset): void {
    this.uploadingId.set(asset.id);

    this.media.removeAssetImage(asset.id).subscribe({
      next: () => {
        asset.imageUrl = null;
        this.message.set(
          'Asset image removed successfully.'
        );
      },

      error: () => {
        this.error.set(true);
        this.message.set(
          'Unable to remove the asset image.'
        );
      },

      complete: () => {
        this.uploadingId.set(null);
      }
    });
  }
}