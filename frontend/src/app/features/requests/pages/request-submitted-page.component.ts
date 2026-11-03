import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestStore } from '../data-access/request.store';
import { ReqRefPipe } from '../../../shared/ui/req-ref.pipe';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { RequestStatus } from '../../../core/models';

@Component({
  selector: 'jhub-request-submitted-page',
  standalone: true,
  imports: [RouterLink, ReqRefPipe, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-submitted-page.component.html',
  styleUrl: './request-submitted-page.component.css'
})
export class RequestSubmittedPageComponent {
  protected readonly request = inject(RequestStore);
  protected readonly RequestStatus = RequestStatus;
}
