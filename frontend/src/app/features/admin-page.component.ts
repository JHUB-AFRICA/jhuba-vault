import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  AssetCategory,
  RequestStatus,
  Asset
} from '../core/models';

import { AssetService } from '../core/api.service';
import { MediaService } from '../core/media.service';
import { AssetImageComponent } from '../shared/asset-image.component';

interface AssetDraft {
  assetTag: string;
  name: string;
  category: AssetCategory;
  description: string;
  price: number;
  totalQuantity: number;
  availableQty: number;
}

@Component({
  selector: 'jhub-admin-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    AssetImageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="admin-page page-width">

      <!-- HEADER -->
      <div class="admin-heading">
        <div>
          <p class="eyebrow">
            ADMINISTRATION / {{ sectionLabel() }}
          </p>

          <h1>
            {{ title() }}
            <em>{{ accent() }}</em>
          </h1>
        </div>

        <a
          class="arrow-link"
          routerLink="/admin/dashboard">
          Dashboard ↗
        </a>
      </div>


      <!-- ===================================================== -->
      <!-- ASSETS -->
      <!-- ===================================================== -->

      @if (section() === 'assets') {

        <section class="table-panel">

          <div class="toolbar">
            <strong>Asset management</strong>

            <span>
              {{ assets().length }} development records
            </span>
          </div>


          <!-- CREATE / EDIT ASSET -->
          <form
            class="asset-form"
            (ngSubmit)="saveAsset()">

            <strong>
              {{ editingId() ? 'Edit asset' : 'Create asset' }}
            </strong>

            <div class="form-grid">

              <label>
                Asset tag

                <input
                  name="assetTag"
                  [(ngModel)]="form.assetTag"
                  required>
              </label>


              <label>
                Name

                <input
                  name="name"
                  [(ngModel)]="form.name"
                  required>
              </label>


              <label>
                Category

                <select
                  name="category"
                  [(ngModel)]="form.category"
                  required>

                  @for (
                    category of categories;
                    track category
                  ) {

                    <option
                      [ngValue]="category">

                      {{ label(category) }}

                    </option>

                  }

                </select>
              </label>


              <label>
                Price

                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  [(ngModel)]="form.price"
                  required>
              </label>


              <label>
                Total quantity

                <input
                  name="totalQuantity"
                  type="number"
                  min="1"
                  step="1"
                  [(ngModel)]="form.totalQuantity"
                  required>
              </label>


              <label>
                Available quantity

                <input
                  name="availableQty"
                  type="number"
                  min="0"
                  [max]="form.totalQuantity"
                  step="1"
                  [(ngModel)]="form.availableQty"
                  required>
              </label>

            </div>


            <label>
              Description

              <textarea
                name="description"
                rows="3"
                [(ngModel)]="form.description"
                required>
              </textarea>
            </label>


            @if (message()) {

              <p
                class="feedback"
                [class.error]="error()">

                {{ message() }}

              </p>

            }


            <div class="form-actions">

              <button
                type="submit"
                [disabled]="busy()">

                {{ editingId()
                  ? 'Save changes'
                  : 'Create asset'
                }}

              </button>


              @if (editingId()) {

                <button
                  type="button"
                  class="cancel"
                  (click)="resetForm()">

                  Cancel

                </button>

              }

            </div>

          </form>


          <!-- ASSET LIST -->
          <div class="asset-management">

            @for (
              asset of assets();
              track asset.id
            ) {

              <article class="asset-editor">

                <!-- IMAGE -->
                <div class="asset-preview">

                  <jhub-asset-image
                    [url]="asset.imageUrl"
                    [alt]="asset.name">
                  </jhub-asset-image>

                </div>


                <!-- DETAILS -->
                <div class="asset-editor-info">

                  <strong>
                    {{ asset.name }}
                  </strong>


                  <small>
                    {{ asset.assetTag }}
                  </small>


                  <small>
                    {{
                      asset.price
                        | currency:'USD':'symbol':'1.2-2'
                    }}

                    ·

                    {{ asset.availableQty }}/
                    {{ asset.totalQuantity }}
                    available
                  </small>


                  <!-- EDIT -->
                  <button
                    type="button"
                    class="edit-asset"
                    (click)="edit(asset)">

                    Edit details

                  </button>


                  <!-- AVAILABILITY -->
                  <button
                    type="button"
                    class="edit-asset"
                    (click)="toggleAvailability(asset)">

                    {{
                      asset.availableQty
                        ? 'Mark unavailable'
                        : 'Mark available'
                    }}

                  </button>


                  <!-- DELETE ASSET -->
                  <button
                    type="button"
                    class="remove-image"
                    [disabled]="busy()"
                    (click)="deleteAsset(asset)">

                    Delete asset

                  </button>


                  <!-- IMAGE UPLOAD -->
                  <label class="file-button">

                    {{
                      uploadingId() === asset.id
                        ? 'Uploading ' + progress() + '%'
                        : 'Select image'
                    }}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      [disabled]="busy()"
                      (change)="upload(asset, $event)">

                  </label>


                  <!-- IMAGE DELETE -->
                  @if (asset.imageUrl) {

                    <button
                      type="button"
                      class="remove-image"
                      [disabled]="busy()"
                      (click)="remove(asset)">

                      Remove image

                    </button>

                  }


                  <!-- UPDATED TO 10MB -->
                  <small class="image-help">
                    JPG, PNG or WebP · max 10MB
                  </small>

                </div>

              </article>

            }

          </div>

        </section>

      }


      <!-- ===================================================== -->
      <!-- INVENTORY -->
      <!-- ===================================================== -->

      @else if (section() === 'inventory') {

        <section class="table-panel">

          <div class="toolbar">

            <strong>
              Inventory overview
            </strong>

          </div>


          @for (
            asset of assets();
            track asset.id
          ) {

            <div class="asset-line">

              <span>

                <strong>
                  {{ asset.name }}
                </strong>

                <small>
                  {{ asset.assetTag }}
                </small>

              </span>


              <span>
                {{ label(asset.category) }}
              </span>


              <span>
                {{ asset.totalQuantity }}
              </span>


              <span>
                {{ asset.availableQty }}
              </span>


              <span>

                {{
                  asset.availableQty
                    ? 'IN STOCK'
                    : 'CHECKED OUT'
                }}

              </span>

            </div>

          }

        </section>

      }


      <!-- ===================================================== -->
      <!-- REQUESTS -->
      <!-- ===================================================== -->

      @else if (section() === 'requests') {

        <section class="table-panel">

          <div class="toolbar">

            <strong>
              Request queue
            </strong>

          </div>


          <div class="asset-line">

            <span>

              <strong>
                AgriSense Soil Monitor
              </strong>

              <small>
                Amina Wanjiku · 4 assets
              </small>

            </span>


            <span class="status pending">

              {{ RequestStatus.PENDING }}

            </span>


            <button class="approve">
              Approve
            </button>


            <button class="reject">
              Reject
            </button>

          </div>

        </section>

      }


      <!-- ===================================================== -->
      <!-- USERS -->
      <!-- ===================================================== -->

      @else if (section() === 'users') {

        <section class="table-panel">

          <div class="toolbar">

            <strong>
              Innovator directory
            </strong>

          </div>


          <div class="asset-line">

            <span>

              <strong>
                Amina Wanjiku
              </strong>

              <small>
                JHUB-001
              </small>

            </span>


            <span>
              amina@example.com
            </span>


            <span>
              INNOVATOR
            </span>

          </div>

        </section>

      }


      <!-- ===================================================== -->
      <!-- AUDIT -->
      <!-- ===================================================== -->

      @else if (section() === 'audit-log') {

        <section class="empty-panel">

          <strong>
            No audit activity available.
          </strong>

          <span>
            Audit records appear when the API is connected.
          </span>

        </section>

      }


      <!-- ===================================================== -->
      <!-- SETTINGS -->
      <!-- ===================================================== -->

      @else {

        <section class="settings-panel">

          <p class="eyebrow">
            ADMIN SETTINGS
          </p>

          <h2>
            Vault configuration
          </h2>

          <p>
            Settings exposed by the backend will appear here.
          </p>

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

    /* FORM */

    .asset-form {
      display: grid;
      gap: 18px;
      padding: 22px 0;
      border-bottom: 1px solid #edf0f4;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .asset-form label {
      display: block;
      color: #586174;
      font-size: 11px;
    }

    .asset-form input,
    .asset-form select,
    .asset-form textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #dce0e8;
      margin-top: 7px;
      padding: 12px;
      font: inherit;
      outline-color: #3ea945;
    }

    .form-actions {
      display: flex;
      gap: 10px;
    }

    .form-actions button {
      border: 0;
      background: #262571;
      color: #fff;
      padding: 12px 18px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    .form-actions button:disabled {
      opacity: .5;
      cursor: wait;
    }

    .form-actions .cancel {
      background: #e9ebf1;
      color: #262571;
    }

    /* ASSETS */

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
      overflow: hidden;
      background: #f4f5f8;
    }

    .asset-preview jhub-asset-image {
      display: block;
      width: 100%;
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

    .image-help {
      color: #9aa1ad !important;
    }

    /* UPLOAD */

    .file-button {
      display: inline-block;
      background: #262571;
      color: #fff;
      padding: 9px;
      margin-top: 8px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .file-button input {
      display: none;
    }

    .edit-asset {
      display: block;
      border: 0;
      background: transparent;
      color: #262571;
      padding: 8px 0;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    .remove-image {
      display: block;
      border: 0;
      background: transparent;
      color: #e6292a;
      padding: 8px 0;
      font-size: 10px;
      cursor: pointer;
    }

    .remove-image:disabled {
      opacity: .5;
      cursor: wait;
    }

    /* FEEDBACK */

    .feedback {
      color: #26742b;
      font-size: 12px;
      margin: 0;
    }

    .feedback.error {
      color: #a51f20;
    }

    /* INVENTORY */

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

    /* REQUESTS */

    .approve,
    .reject {
      border: 0;
      background: transparent;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
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

    /* EMPTY */

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

    /* MOBILE */

    @media (max-width: 760px) {

      .asset-management {
        grid-template-columns: 1fr;
      }

      .form-grid {
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

  protected readonly categories =
    Object.values(AssetCategory);

  protected readonly assets =
    signal<Asset[]>([]);

  protected readonly editingId =
    signal<string | null>(null);

  protected readonly saving =
    signal(false);

  protected readonly uploadingId =
    signal<string | null>(null);

  protected readonly progress =
    signal(0);

  protected readonly message =
    signal('');

  protected readonly error =
    signal(false);

  protected form: AssetDraft =
    this.emptyForm();


  protected readonly busy =
    computed(() =>
      this.uploadingId() !== null ||
      this.saving()
    );


  protected readonly section =
    computed(() =>
      this.router.url.split('/')[2] || 'dashboard'
    );


  protected readonly sectionLabel =
    computed(() =>
      this.section()
        .replace('-', ' ')
        .toUpperCase()
    );


  protected readonly title =
    computed(() =>
      this.section() === 'audit-log'
        ? 'Audit'
        : this.section()
    );


  protected readonly accent =
    computed(() =>
      this.section() === 'requests'
        ? 'queue.'
        : 'overview.'
    );


  constructor() {
    this.loadAssets();
  }


  protected label(
    value: AssetCategory
  ): string {

    return value.replaceAll('_', ' ');
  }


  private emptyForm(): AssetDraft {

    return {
      assetTag: '',
      name: '',
      category:
        AssetCategory.COMPUTING_PERIPHERALS,
      description: '',
      price: 0,
      totalQuantity: 1,
      availableQty: 1
    };

  }


  private loadAssets(): void {

    this.assetService.list().subscribe({

      next: assets => {
        this.assets.set(assets);
      },

      error: () => {
        this.setFeedback(
          'Unable to load assets.',
          true
        );
      }

    });

  }


  private setFeedback(
    message: string,
    isError = false
  ): void {

    this.error.set(isError);
    this.message.set(message);

  }


  protected resetForm(): void {

    this.editingId.set(null);

    this.form =
      this.emptyForm();

  }


  protected edit(asset: Asset): void {

    this.editingId.set(asset.id);

    this.form = {

      assetTag: asset.assetTag,

      name: asset.name,

      category: asset.category,

      description: asset.description,

      price: Number(asset.price),

      totalQuantity:
        asset.totalQuantity,

      availableQty:
        asset.availableQty

    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  protected saveAsset(): void {

    if (
      !this.form.assetTag.trim() ||
      !this.form.name.trim() ||
      !this.form.description.trim() ||
      this.form.price < 0 ||
      this.form.totalQuantity < 1 ||
      this.form.availableQty < 0 ||
      this.form.availableQty >
        this.form.totalQuantity
    ) {

      this.setFeedback(
        'Complete all fields and keep quantities within valid limits.',
        true
      );

      return;
    }


    this.saving.set(true);

    this.setFeedback('');


    const request =
      this.editingId()

        ? this.assetService.update(
            this.editingId()!,
            this.form
          )

        : this.assetService.create({
            ...this.form,
            imageUrl: null,
            specifications: {}
          });


    request.subscribe({

      next: asset => {

        this.assets.update(
          assets =>
            this.editingId()

              ? assets.map(item =>
                  item.id === asset.id
                    ? asset
                    : item
                )

              : [...assets, asset]
        );

        this.resetForm();

        this.setFeedback(
          'Asset saved successfully.'
        );

      },

      error: () => {

        this.setFeedback(
          'Unable to save asset. Check the asset tag and field values.',
          true
        );

      },

      complete: () => {
        this.saving.set(false);
      }

    });

  }


  protected toggleAvailability(
    asset: Asset
  ): void {

    const availableQty =
      asset.availableQty
        ? 0
        : asset.totalQuantity;


    this.assetService
      .update(
        asset.id,
        { availableQty }
      )
      .subscribe({

        next: updated => {

          this.assets.update(
            assets =>
              assets.map(item =>
                item.id === updated.id
                  ? updated
                  : item
              )
          );

          this.setFeedback(
            'Asset availability updated.'
          );

        },

        error: (error: unknown) => {

          this.setFeedback(
            'Unable to update asset availability.',
            true
          );

        }

      });

  }


  protected deleteAsset(
    asset: Asset
  ): void {

    if (
      !confirm(
        `Delete ${asset.name}?`
      )
    ) {
      return;
    }


    this.assetService
      .remove(asset.id)
      .subscribe({

        next: () => {

          this.assets.update(
            assets =>
              assets.filter(
                item =>
                  item.id !== asset.id
              )
          );

          this.setFeedback(
            'Asset deleted successfully.'
          );

        },

        error: (error: unknown) => {

          this.setFeedback(
            'Unable to delete this asset. It may have request history.',
            true
          );

        }

      });

  }


  // =========================================================
  // IMAGE UPLOAD
  // =========================================================

  protected upload(
    asset: Asset,
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    /*
     * MAXIMUM IMAGE SIZE
     *
     * 10 MB
     */
    const MAX_SIZE =
      10 * 1024 * 1024;


    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];


    // FILE TYPE CHECK

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      this.error.set(true);

      this.message.set(
        'Only JPG, PNG, or WebP images are allowed.'
      );

      input.value = '';

      return;
    }


    // FILE SIZE CHECK

    if (
      file.size > MAX_SIZE
    ) {

      this.error.set(true);

      this.message.set(
        'Image must be smaller than 10MB.'
      );

      input.value = '';

      return;
    }


    // START UPLOAD

    this.error.set(false);

    this.message.set('');

    this.uploadingId.set(
      asset.id
    );

    this.progress.set(0);


    this.media
      .upload(
        file,
        'assets',
        asset.id
      )
      .subscribe({

        next: update => {

          this.progress.set(
            update.percent
          );


          /*
           * CLOUDINARY / MEDIA RESULT
           */
          if (update.result) {

            const imageUrl =
              update.result.url;


            /*
             * Save the returned URL
             * into the asset record.
             */
            this.assetService
              .update(
                asset.id,
                { imageUrl }
              )
              .subscribe({

                next: updated => {

                  this.assets.update(
                    assets =>
                      assets.map(
                        item =>
                          item.id ===
                          updated.id
                            ? updated
                            : item
                      )
                  );

                  this.message.set(
                    'Asset image uploaded successfully.'
                  );

                },

                error: () => {

                  this.error.set(true);

                  this.message.set(
                    'Image uploaded, but the asset record could not be updated.'
                  );

                }

              });

          }

        },


        error: (error: unknown) => {

          this.uploadingId.set(
            null
          );

          this.progress.set(0);

          this.error.set(true);

          const message = error instanceof HttpErrorResponse
            ? error.error?.message
            : undefined;
          this.message.set(
            message || 'Image upload failed. Please try again.'
          );

          input.value = '';

        },


        complete: () => {

          this.uploadingId.set(
            null
          );

          this.progress.set(100);

          input.value = '';

        }

      });

  }


  // =========================================================
  // REMOVE IMAGE
  // =========================================================

  protected remove(
    asset: Asset
  ): void {

    if (!asset.imageUrl) {
      return;
    }


    this.uploadingId.set(
      asset.id
    );

    this.error.set(false);

    this.message.set('');


    this.media
      .removeAssetImage(
        asset.id
      )
      .subscribe({

        next: () => {

          /*
           * Update frontend immediately.
           */
          this.assets.update(
            assets =>
              assets.map(item =>
                item.id === asset.id
                  ? {
                      ...item,
                      imageUrl: null
                    }
                  : item
              )
          );


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

          this.uploadingId.set(
            null
          );

        }

      });

  }

}