import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Role } from './core/models';
import { AuthStore } from './features/auth/data-access/auth.store';
import { RequestStore } from './features/requests/data-access/request.store';
import { GlobalSearchComponent } from './shared/ui/global-search.component';
import { OverlayHostComponent } from './shared/ui/overlay-host.component';
import { BrandLogoComponent } from './shared/ui/brand-logo.component';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  also?: string[];
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

type Layout = 'bare' | 'public' | 'app';

const ADMIN_NAV: NavGroup[] = [
  { items: [{ label: 'Dashboard', icon: 'pi-th-large', link: '/admin/dashboard' }] },
  {
    heading: 'Operations',
    items: [
      { label: 'Requests', icon: 'pi-inbox', link: '/admin/requests', also: ['/requests'] },
      { label: 'Assets', icon: 'pi-tags', link: '/admin/assets' },
      { label: 'Inventory', icon: 'pi-database', link: '/admin/inventory' }
    ]
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Users', icon: 'pi-users', link: '/admin/users' },
      { label: 'Audit log', icon: 'pi-history', link: '/admin/audit-log' },
      { label: 'Settings', icon: 'pi-cog', link: '/admin/settings' }
    ]
  }
];

const INNOVATOR_NAV: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: 'pi-th-large', link: '/app/dashboard' },
      { label: 'Catalogue', icon: 'pi-box', link: '/catalogue', also: ['/assets/'] }
    ]
  },
  {
    heading: 'My work',
    items: [
      { label: 'My requests', icon: 'pi-inbox', link: '/app/requests', also: ['/app/cart', '/app/requests/'] },
      { label: 'Active loans', icon: 'pi-clock', link: '/app/loans' }
    ]
  },
  { heading: 'Account', items: [{ label: 'Profile', icon: 'pi-user', link: '/app/profile' }] }
];

@Component({
  selector: 'jhub-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, GlobalSearchComponent, OverlayHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly cart = inject(RequestStore);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly Role = Role;
  protected readonly year = new Date().getFullYear();
  protected readonly menuOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly path = computed(() => this.url().split(/[?#]/)[0].replace(/(.)\/$/, '$1'));
  protected readonly isAdmin = computed(() => this.auth.user()?.role === Role.ADMIN);
  protected readonly isAuthRoute = computed(() => ['/auth/login', '/auth/register', '/admin/login'].includes(this.path()));
  protected readonly navGroups = computed(() => this.isAdmin() ? ADMIN_NAV : INNOVATOR_NAV);
  protected readonly layout = computed<Layout>(() => {
    const path = this.path();
    if (path.startsWith('/auth/') || path === '/admin/login') return 'bare';
    if (path.startsWith('/app/') || path.startsWith('/admin/') || path === '/requests') return 'app';
    if (this.auth.user() && (path === '/catalogue' || path.startsWith('/assets/'))) return 'app';
    return 'public';
  });

  constructor() {
    this.auth.hydrate().subscribe();
    effect(() => {
      this.url();
      this.menuOpen.set(false);
      this.userMenuOpen.set(false);
    });
  }

  protected dashboardLink(): string {
    return this.isAdmin() ? '/admin/dashboard' : '/app/dashboard';
  }

  protected homeLink(): string {
    return this.auth.user() ? this.dashboardLink() : '/';
  }

  protected isActive(item: NavItem): boolean {
    const path = this.path();
    if (path === item.link) return true;
    return (item.also ?? []).some(prefix => prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix) ||
      (item.link !== '/admin/dashboard' && item.link !== '/app/dashboard' && path.startsWith(item.link + '/'));
  }

  protected initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';
  }

  protected signOut(): void {
    this.userMenuOpen.set(false);
    this.auth.signOut();
  }

  protected onDocumentClick(event: MouseEvent): void {
    const menu = this.host.nativeElement.querySelector('.user-menu');
    if (menu && !menu.contains(event.target as Node)) this.userMenuOpen.set(false);
  }
}
