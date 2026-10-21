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
    <header class="topbar">
        <a class="brand" routerLink="/" aria-label="JHUB Africa Vault home">
          <jhub-brand-logo logo="jhub-africa" variant="vault-header"></jhub-brand-logo>
          <span><strong>AFRICA VAULT</strong><small>ASSET TRACKING</small></span>
        </a>
        <button class="menu-toggle" type="button" aria-label="Toggle navigation"
                [attr.aria-expanded]="menuOpen()" (click)="menuOpen.update(open => !open)">☰</button>
        <nav class="desktop-nav" [class.mobile-open]="menuOpen()" aria-label="Primary navigation"
             (click)="menuOpen.set(false)">
          @if (auth.user()?.role === Role.ADMIN) {
            <a routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
            <a routerLink="/admin/requests" routerLinkActive="active">Requests</a>
            <a routerLink="/admin/assets" routerLinkActive="active">Assets</a>
            <a routerLink="/admin/inventory" routerLinkActive="active">Inventory</a>
            <a routerLink="/admin/users" routerLinkActive="active">Users</a>
            <a routerLink="/admin/audit-log" routerLinkActive="active">Audit Log</a>
            <a routerLink="/admin/settings" routerLinkActive="active">Settings</a>
          } @else if (auth.user()) {
            <a routerLink="/app/dashboard">Dashboard</a>
            <a routerLink="/catalogue">Catalogue</a>
            <a routerLink="/app/requests">My Requests</a>
            <a routerLink="/app/loans">Active Loans</a>
          } @else {
            <a routerLink="/catalogue">Catalogue</a>
            <a href="#how-it-works">How it works</a>
            <a href="#categories">Categories</a>
          }
        </nav>
        <div class="nav-actions">
          @if (auth.user()) {
            <a class="user-chip" [routerLink]="auth.isAdmin() ? '/admin/dashboard' : '/app/dashboard'">
              {{ auth.user()?.fullName }}
            </a>
            <button class="text-button" type="button" (click)="auth.signOut()">Sign out</button>
          } @else {
            <a class="text-button" routerLink="/auth/login">Sign in</a>
            <a class="primary-button compact" routerLink="/auth/register">Create account</a>
          }
        </div>
    </header>

    <!-- upstream main sections (home, catalogue, auth, admin, dashboard shell) -->
    <!-- … unchanged content … -->
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
  styles: [`
    :host { display:block; }
    .topbar { position:sticky; top:0; z-index:20; min-height:76px; display:flex; align-items:center; justify-content:space-between; gap:22px; padding:0 clamp(20px,3vw,48px); background:#fff; border-bottom:1px solid #e5eaf1; }
    .brand { flex:none; display:flex; align-items:center; gap:6px; color:#262571; text-decoration:none; }
    .brand jhub-brand-logo { width:132px; height:64px; flex:none; }
    .brand span { display:grid; gap:2px; }
    .brand strong { color:#262571; font-size:11px; letter-spacing:.6px; white-space:nowrap; }
    .brand small { color:#65738a; font-size:7px; letter-spacing:1px; white-space:nowrap; }
    .desktop-nav { flex:1; display:flex; justify-content:center; align-items:center; gap:clamp(10px,1.6vw,26px); }
    .desktop-nav a { padding:10px 1px; color:#54647b; font-size:13px; text-decoration:none; white-space:nowrap; }
    .desktop-nav a:hover,.desktop-nav a.active { color:#262571; }
    .desktop-nav a.active { font-weight:700; box-shadow:inset 0 -2px #2a4695; }
    .nav-actions { flex:none; display:flex; align-items:center; gap:16px; }
    .user-chip { max-width:180px; overflow:hidden; color:#263850; font-size:12px; font-weight:600; text-decoration:none; text-overflow:ellipsis; white-space:nowrap; }
    .text-button { border:0; background:transparent; color:#2a4695; font-size:12px; font-weight:600; text-decoration:none; white-space:nowrap; }
    .primary-button.compact { padding:9px 12px; border-radius:4px; background:#262571; color:#fff; font-size:11px; text-decoration:none; }
    .menu-toggle { display:none; }
    @media (max-width:900px) {
      .topbar { min-height:68px; gap:12px; padding:0 18px; }
      .brand jhub-brand-logo { width:112px; height:54px; }
      .menu-toggle { display:block; margin-left:auto; border:1px solid #dce0e8; border-radius:4px; background:#fff; color:#262571; padding:7px 10px; }
      .desktop-nav { display:none; }
      .desktop-nav.mobile-open { position:absolute; top:100%; left:0; right:0; display:flex; align-items:stretch; flex-direction:column; gap:0; padding:8px 18px; background:#fff; border-bottom:1px solid #e6e8ee; box-shadow:0 10px 18px #17203318; }
      .desktop-nav.mobile-open a { padding:12px 8px; border-bottom:1px solid #edf0f4; }
    }
    @media (max-width:480px) {
      .topbar { gap:8px; padding:0 12px; }
      .brand { gap:5px; }
      .brand jhub-brand-logo { width:100px; height:49px; }
      .brand strong { font-size:9px; }
      .brand small { font-size:6px; }
      .nav-actions { gap:8px; }
      .user-chip { max-width:100px; font-size:10px; }
      .text-button { font-size:10px; }
    }
    @media (max-width:380px) {
      .brand { gap:4px; }
      .brand jhub-brand-logo { width:88px; height:43px; }
      .brand strong { font-size:8px; }
      .brand small { font-size:6px; }
      .user-chip { max-width:78px; }
      .nav-actions { gap:4px; }
      .primary-button.compact { padding:6px 7px; font-size:9px; }
      .menu-toggle { padding:5px 7px; }
    }
  `]
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
  protected readonly innovatorRequests = signal<AssetRequest[]>([]);

  constructor() {
    this.auth.hydrate().subscribe();
    this.assetStore.load();
    effect(() => {
      const user = this.auth.user();
      const url = this.navigationUrl();
      if (!user || (url !== '/admin/dashboard' && url !== '/app/dashboard')) return;
      this.loadDashboard(user.role);
    });
  }

  protected readonly Role = Role;
  private readonly navigationUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isHome = computed(() => this.navigationUrl() === '/' || this.navigationUrl() === '/landing');
  protected readonly isCatalogue = computed(() => false);
  protected readonly isAuth = computed(() => false);
  protected readonly isRegister = computed(() => this.navigationUrl().includes('register'));
  protected readonly isAdminLogin = computed(() => this.navigationUrl() === '/admin/login');
  protected readonly isAdmin = computed(() => false);
  protected readonly isDashboardShell = computed(() => false);

  protected readonly categories = [
    { label: 'IoT & Prototyping', value: AssetCategory.IOT_PROTOTYPING, icon: '⌁' },
    { label: 'Computing Peripherals', value: AssetCategory.COMPUTING_PERIPHERALS, icon: '▣' },
    { label: 'Networking Infrastructure', value: AssetCategory.NETWORKING_INFRASTRUCTURE, icon: '⌘' },
    { label: 'AV & Presentation', value: AssetCategory.AV_PRESENTATION, icon: '◉' },
    { label: 'Office Supplies', value: AssetCategory.OFFICE_SUPPLIES, icon: '▤' },
    { label: 'Furniture', value: AssetCategory.FURNITURE, icon: '⌂' }
  ];

  protected readonly featuredAsset = computed(() => this.assetStore.assets()[0]);
  protected readonly categoryTotal = computed(() => new Set(this.assetStore.assets().map(asset => asset.category)).size);
  protected readonly assets: Array<{ name: string; tag: string; category: AssetCategory; available: number; total: number; accent: string; icon: string }> = [];

  protected readonly activeRequestCount = computed(() =>
    this.innovatorRequests().filter(request => request.status === RequestStatus.PENDING || request.status === RequestStatus.APPROVED).length
  );
  protected readonly activeLoanCount = computed(() =>
    this.innovatorRequests().filter(request => request.status === RequestStatus.CHECKED_OUT || request.status === RequestStatus.OVERDUE).length
  );
  protected readonly returnedRequestCount = computed(() =>
    this.innovatorRequests().filter(request => request.status === RequestStatus.RETURNED).length
  );

  protected categoryCount(category: AssetCategory): number {
    return this.assetStore.assets().filter(asset => asset.category === category).length;
  }

  private loadDashboard(role: Role): void {
    this.dashboardLoading.set(true);
    this.dashboardError.set(null);
    if (role === Role.ADMIN) {
      forkJoin({ metrics: this.adminService.dashboard(), audit: this.adminService.auditLog() }).subscribe({
        next: result => {
          this.adminMetrics.set(result.metrics);
          this.auditLogs.set(result.audit);
          this.dashboardLoading.set(false);
        },
        error: () => {
          this.dashboardLoading.set(false);
          this.dashboardError.set('Unable to load the administration dashboard.');
        }
      });
      return;
    }
    this.requestService.listMine().subscribe({
      next: requests => {
        this.innovatorRequests.set(requests);
        this.dashboardLoading.set(false);
      },
      error: () => {
        this.dashboardLoading.set(false);
        this.dashboardError.set('Unable to load your workspace dashboard.');
      }
    });
  }
}
