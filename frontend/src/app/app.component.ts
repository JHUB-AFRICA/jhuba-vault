import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { filter, forkJoin, map, startWith } from 'rxjs';
import { AssetCategory, AssetRequest, AuditLog, RequestStatus, Role } from './core/models';
import { AdminDashboard, AdminService, RequestService } from './core/api.service';
import { AuthStore } from './state/auth.store';
import { AssetStore } from './state/asset.store';
import { BrandLogoComponent } from './shared/brand-logo.component';

@Component({
  selector: 'jhub-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, BrandLogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isAdminRequests()) {
      <router-outlet></router-outlet>
    } @else {
      <!-- header, main sections, etc. -->
    }
    <router-outlet></router-outlet>
    <footer class="footer">
      <div class="page-width">
        <a class="brand footer-brand" routerLink="/">
          <jhub-brand-logo logo="jhub" variant="footer"></jhub-brand-logo>
        </a>
        <p>
          A shared infrastructure for ambitious ideas.<br>
          Jomo Kenyatta University of Agriculture and Technology.
        </p>
        <span>© 2026 JHUB Africa</span>
      </div>
    </footer>
  `,
  styles: [/* your styles unchanged */]
})
export class AppComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly router = inject(Router);
  protected readonly menuOpen = signal(false);
  private readonly adminService = inject(AdminService);
  private readonly requestService = inject(RequestService);
  protected readonly assetStore = inject(AssetStore);
  protected readonly dashboardLoading = signal(false);
  protected readonly dashboardError = signal<string | null>(null);
  protected readonly adminMetrics = signal<AdminDashboard | null>(null);
  protected readonly auditLogs = signal<AuditLog[]>([]);
  protected readonly innovatorRequests = signal<AssetRequest[]>