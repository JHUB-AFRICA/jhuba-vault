import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { Role } from './core/models';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'JHUB Africa Vault',
    loadComponent: () => import('./features/landing/pages/landing-page.component').then(module => module.LandingPageComponent)
  },
  { path: 'landing', redirectTo: '', pathMatch: 'full' },
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/auth-page.component').then(module => module.AuthPageComponent)
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/auth-page.component').then(module => module.AuthPageComponent)
  },
  {
    path: 'admin/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/auth-page.component').then(module => module.AuthPageComponent)
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./features/catalogue/pages/catalogue-page.component').then(module => module.CataloguePageComponent)
  },
  {
    path: 'requests',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-requests-page.component').then(module => module.AdminRequestsPageComponent)
  },
  {
    path: 'assets/:id',
    loadComponent: () => import('./features/catalogue/pages/asset-details-page.component').then(module => module.AssetDetailsPageComponent)
  },
  {
    path: 'app/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/pages/innovator-dashboard-page.component').then(module => module.InnovatorDashboardPageComponent)
  },
  {
    path: 'app/requests',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/request-history-page.component').then(module => module.RequestHistoryPageComponent)
  },
  {
    path: 'app/cart',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/request-cart-page.component').then(module => module.RequestCartPageComponent)
  },
  {
    path: 'app/requests/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/request-cart-page.component').then(module => module.RequestCartPageComponent)
  },
  {
    path: 'app/requests/review',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/workspace-page.component').then(module => module.WorkspacePageComponent)
  },
  {
    path: 'app/requests/project',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/workspace-page.component').then(module => module.WorkspacePageComponent)
  },
  {
    path: 'app/requests/team',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/workspace-page.component').then(module => module.WorkspacePageComponent)
  },
  {
    path: 'app/requests/submitted',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/request-submitted-page.component').then(module => module.RequestSubmittedPageComponent)
  },
  {
    path: 'app/requests/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/request-details-page.component').then(module => module.RequestDetailsPageComponent)
  },
  {
    path: 'app/loans',
    canActivate: [authGuard],
    data: { view: 'loans' },
    loadComponent: () => import('./features/requests/pages/request-history-page.component').then(module => module.RequestHistoryPageComponent)
  },
  {
    path: 'app/profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile-page.component').then(module => module.ProfilePageComponent)
  },
  {
    path: 'app/team',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/simple-workspace-page.component').then(module => module.SimpleWorkspacePageComponent)
  },
  {
    path: 'app/settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/requests/pages/simple-workspace-page.component').then(module => module.SimpleWorkspacePageComponent)
  },
  {
    path: 'admin/dashboard',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-dashboard-page.component').then(module => module.AdminDashboardPageComponent)
  },
  {
    path: 'admin/requests',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-requests-page.component').then(module => module.AdminRequestsPageComponent)
  },
  {
    path: 'admin/assets',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-assets-page.component').then(module => module.AdminAssetsPageComponent)
  },
  {
    path: 'admin/inventory',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-inventory-page.component').then(module => module.AdminInventoryPageComponent)
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-users-page.component').then(module => module.AdminUsersPageComponent)
  },
  {
    path: 'admin/audit-log',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-audit-page.component').then(module => module.AdminAuditPageComponent)
  },
  {
    path: 'admin/settings',
    canActivate: [authGuard, roleGuard(Role.ADMIN)],
    loadComponent: () => import('./features/admin/pages/admin-settings-page.component').then(module => module.AdminSettingsPageComponent)
  },
  { path: '**', redirectTo: '' }
];
