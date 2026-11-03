import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'jhub-asset-image',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (url && !failed) { <img [src]="url" [alt]="alt" (error)="failed = true"> } @else { <span class="asset-fallback" aria-hidden="true">⌁</span> }`,
  styles: [`:host{display:grid;place-items:center;width:100%;height:100%;min-height:140px;background:#e8f1e9;overflow:hidden}.asset-fallback{font:76px Georgia,serif;color:#3ea945}img{display:block;width:100%;height:100%;object-fit:cover}`]
})
export class AssetImageComponent {
  @Input() url: string | null | undefined;
  @Input() alt = 'JHUB Africa asset';
  protected failed = false;
}
