import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'jhub-asset-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (url() && !failed()) {
    <img [src]="url()" [alt]="alt()" [style.object-fit]="fit()" [attr.loading]="loading()" decoding="async" (error)="failed.set(true)" />
  } @else {
    <span class="fallback" role="img" [attr.aria-label]="alt() + ' (no photo available)'"><i class="pi pi-box" aria-hidden="true"></i></span>
  }`,
  styles: [`
    :host { display: grid; place-items: center; width: 100%; height: 100%; min-height: 140px; overflow: hidden; background: var(--surface-2); }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .fallback { display: grid; place-items: center; width: 64px; height: 64px; border-radius: var(--r-xl); background: var(--navy-50); color: var(--navy); font-size: 1.6rem; }
  `]
})
export class AssetImageComponent {
  readonly url = input<string | null>();
  readonly alt = input('JHUB Africa asset');
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly loading = input<'eager' | 'lazy'>('lazy');
  protected readonly failed = signal(false);

  private readonly resetFailureOnUrlChange = effect(() => {
    this.url();
    this.failed.set(false);
  });
}
