import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'jhub-asset-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (showImage()) { <img [src]="url()" [alt]="alt()" [style.object-fit]="fit()" [attr.loading]="loading()" decoding="async" (error)="markUnavailable()"> } @else { <span class="asset-fallback" aria-hidden="true">⌁</span> }`,
  styles: [`:host{display:grid;place-items:center;width:100%;height:100%;min-height:140px;background:#e8f1e9;overflow:hidden}.asset-fallback{font:76px Georgia,serif;color:#3ea945}img{display:block;width:100%;height:100%;object-fit:cover}`]
})
export class AssetImageComponent {
  readonly url = input<string | null | undefined>();
  readonly alt = input('JHUB Africa asset');
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly loading = input<'eager' | 'lazy'>('lazy');

  private readonly unavailableUrl = signal<string | null>(null);
  protected readonly showImage = computed(() => Boolean(this.url()) && this.unavailableUrl() !== this.url());

  protected markUnavailable(): void {
    this.unavailableUrl.set(this.url() ?? null);
  }
}
