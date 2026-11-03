import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RequestStatus } from '../../core/models';
import { statusLabel } from './format';

@Component({
  selector: 'jhub-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge-' + tone()">{{ label() }}</span>`,
  styles: [`:host { display: inline-flex; }`]
})
export class StatusBadgeComponent {
  readonly status = input.required<RequestStatus | string>();

  protected readonly tone = () => String(this.status()).toLowerCase();
  protected readonly label = () => statusLabel(this.status());
}
