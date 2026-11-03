import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestStore } from '../data-access/request.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header.component';

/** Lightweight pages for "My team" and "Settings". */
@Component({
  selector: 'jhub-simple-workspace-page',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simple-workspace-page.component.html'
})
export class SimpleWorkspacePageComponent {
  protected readonly request = inject(RequestStore);
  protected readonly kind: 'team' | 'settings' = location.pathname.endsWith('/team') ? 'team' : 'settings';
}
