import { Role } from './models';
import { AskHubNavigationIntent } from './api.service';
import { routes } from '../app.routes';

const targets: Record<AskHubNavigationIntent, { path: string; role?: Role }> = {
  dashboard: { path: '/app/dashboard' },
  catalogue: { path: '/catalogue' },
  request_cart: { path: '/app/cart', role: Role.INNOVATOR },
  my_requests: { path: '/app/requests', role: Role.INNOVATOR },
  profile: { path: '/app/profile' },
  admin_dashboard: { path: '/admin/dashboard', role: Role.ADMIN },
  admin_requests: { path: '/admin/requests', role: Role.ADMIN },
  admin_assets: { path: '/admin/assets', role: Role.ADMIN },
  admin_inventory: { path: '/admin/inventory', role: Role.ADMIN },
  admin_users: { path: '/admin/users', role: Role.ADMIN },
  admin_audit_log: { path: '/admin/audit-log', role: Role.ADMIN },
  admin_settings: { path: '/admin/settings', role: Role.ADMIN }
};

export function assistantRouteFor(intent: AskHubNavigationIntent, role: Role): string | null {
  if (intent === 'dashboard') {
    const path = role === Role.ADMIN ? '/admin/dashboard' : '/app/dashboard';
    return routes.some(route => route.path === path.slice(1)) ? path : null;
  }
  const target = targets[intent];
  if (!target || (target.role && target.role !== role)) return null;
  const routePath = target.path.slice(1);
  return routes.some(route => route.path === routePath) ? target.path : null;
}
