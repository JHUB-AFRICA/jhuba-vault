import { ChangeDetectionStrategy, Component, ElementRef, HostListener, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Role } from './core/models';
import { AuthStore } from './state/auth.store';
import { RequestStore } from './state/request.store';
import { GlobalSearchComponent } from './shared/global-search.component';
import { OverlayHostComponent } from './shared/overlay-host.component';
import { initials } from './shared/format';
import { AskHubComponent } from './features/ask-hub.component';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  /** Extra path prefixes that should keep this item highlighted. */
  also?: string[];
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

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

type Layout = 'bare' | 'public' | 'app';

@Component({
  selector: 'jhub-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, GlobalSearchComponent, OverlayHostComponent, AskHubComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly cart = inject(RequestStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly menuOpen = signal(false);
  protected readonly userMenuOpen = signal(false);
  protected readonly year = new Date().getFullYear();
  protected readonly initials = initials;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly path = computed(() => this.url().split(/[?#]/)[0].replace(/(.)\/$/, '$1'));

  /** True once we know (or strongly expect) the visitor is signed in. */
  private readonly hasSession = computed(
    () => !!this.auth.user() || (isPlatformBrowser(this.platformId) && !this.auth.isHydrated() && !!localStorage.getItem('jhub_access_token'))
  );

  protected readonly layout = computed<Layout>(() => {
    const path = this.path();
    if (path.startsWith('/auth/') || path === '/admin/login') return 'bare';
    if (path.startsWith('/app/') || path.startsWith('/admin/') || path === '/requests') return 'app';
    if (this.hasSession() && (path === '/catalogue' || path.startsWith('/assets/'))) return 'app';
    return 'public';
  });

  protected readonly isAdmin = computed(() => this.auth.user()?.role === Role.ADMIN || (!this.auth.user() && this.path().startsWith('/admin/')));
  protected readonly navGroups = computed(() => (this.isAdmin() ? ADMIN_NAV : INNOVATOR_NAV));
  protected readonly homeLink = computed(() => (this.isAdmin() ? '/admin/dashboard' : '/app/dashboard'));
  protected readonly dashboardLink = computed(() => (this.auth.isAdmin() ? '/admin/dashboard' : '/app/dashboard'));
  protected readonly Role = Role;

  constructor() {
    this.auth.hydrate().subscribe();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen.set(false);
      this.userMenuOpen.set(false);
    });
  }

  protected isActive(item: NavItem): boolean {
    const path = this.path();
    if (path === item.link) return true;
    return (item.also ?? []).some(prefix => (prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix)) ||
      (item.link !== '/admin/dashboard' && item.link !== '/app/dashboard' && path.startsWith(item.link + '/'));
  }

  protected signOut(): void {
    this.userMenuOpen.set(false);
    this.auth.signOut();
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    const userMenu = this.host.nativeElement.querySelector('.user-menu');
    const navigation = this.host.nativeElement.querySelector('.public-header, .sidebar');
    if (userMenu && !userMenu.contains(target)) this.userMenuOpen.set(false);
    if (navigation && !navigation.contains(target)) this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
  }
}
