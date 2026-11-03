import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type BrandLogo = 'jkuat' | 'jhub' | 'jhub-africa';

@Component({
  selector: 'jhub-brand-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!assetUnavailable()) {
      <img [src]="assetPath()" [alt]="altText()" [class]="variant()" (error)="markUnavailable()">
    } @else {
      <span class="logo-unavailable" role="img" [attr.aria-label]="altText()">{{ fallbackText() }}</span>
    }
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; min-width: 0; }
    img { display: block; width: auto; max-width: 100%; height: auto; object-fit: contain; }
    .header { max-width: 148px; max-height: 48px; }
    .vault-header { width: 100%; max-width: 150px; max-height: 72px; }
    .footer { max-width: 170px; max-height: 54px; }
    .auth { max-width: 240px; max-height: 90px; }
    .sidebar-logo { max-width: 56px; max-height: 26px; }
    .logo-unavailable { color: #262571; font: 700 13px/1.2 Georgia, serif; letter-spacing: .08em; }
  `]
})
export class BrandLogoComponent {
  readonly logo = input<BrandLogo>('jhub-africa');
  readonly variant = input('header');

  private readonly unavailableLogo = signal<BrandLogo | null>(null);
  protected readonly assetUnavailable = computed(() => this.unavailableLogo() === this.logo());
  protected readonly assetPath = computed(() => `/assets/logos/${this.logo()}.png`);
  protected readonly altText = computed(() => {
    switch (this.logo()) {
      case 'jkuat': return 'Jomo Kenyatta University of Agriculture and Technology logo';
      case 'jhub': return 'JHUB Innovations for Transformation logo';
      default: return 'JHUB Africa Innovations for Transformation logo';
    }
  });
  protected readonly fallbackText = computed(() => {
    switch (this.logo()) {
      case 'jkuat': return 'JKUAT';
      case 'jhub': return 'JHUB';
      default: return 'JHUB AFRICA';
    }
  });

  protected markUnavailable(): void {
    this.unavailableLogo.set(this.logo());
  }
}
