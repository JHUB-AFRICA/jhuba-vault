import { Role } from './models';
import { assistantRouteFor } from './assistant-navigation';

describe('assistantRouteFor', () => {
  it('resolves known intents to existing routes', () => {
    expect(assistantRouteFor('catalogue', Role.INNOVATOR)).toBe('/catalogue');
    expect(assistantRouteFor('dashboard', Role.ADMIN)).toBe('/admin/dashboard');
    expect(assistantRouteFor('dashboard', Role.INNOVATOR)).toBe('/app/dashboard');
  });

  it('does not resolve admin routes for innovators', () => {
    expect(assistantRouteFor('admin_requests', Role.INNOVATOR)).toBeNull();
    expect(assistantRouteFor('admin_inventory', Role.INNOVATOR)).toBeNull();
  });

  it('does not expose innovator-only request routes to administrators', () => {
    expect(assistantRouteFor('request_cart', Role.ADMIN)).toBeNull();
    expect(assistantRouteFor('my_requests', Role.ADMIN)).toBeNull();
  });
});
