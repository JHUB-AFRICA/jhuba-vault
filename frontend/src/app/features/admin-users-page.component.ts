import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AdminService } from '../core/api.service';
import { User } from '../core/models';

@Component({
  selector: 'jhub-admin-users-page',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="users-page page-width"><div class="heading"><div><p class="eyebrow">ADMINISTRATION / USERS</p><h1>Innovator <em>directory.</em></h1><p>Accounts currently registered with the Vault.</p></div></div>@if (loading()) {<div class="state">Loading users…</div>} @else if (error()) {<div class="state error" role="alert">{{ error() }}</div>} @else if (!users().length) {<div class="state">No users are registered yet.</div>} @else {<section class="user-list">@for (user of users(); track user.id) {<article class="user-row"><div><strong>{{ user.fullName }}</strong><small>{{ user.email }} · {{ user.identificationId }}</small></div><span>{{ user.role }}</span><span>{{ user.createdAt | date:'d MMM yyyy' }}</span></article>}</section>}
    </main>
  `,
  styles: [`:host{display:block}.page-width{width:min(1100px,calc(100% - 48px));margin:auto}.users-page{padding:60px 0 110px}.eyebrow{color:#3ea945;font-size:10px;font-weight:800;letter-spacing:2px;margin:0 0 16px}.heading h1{font:400 clamp(42px,5vw,60px)/1.05 Georgia,serif;color:#262571;margin:0}.heading h1 em{color:#3ea945}.heading p:last-child{color:#667083;font-size:13px}.user-list{background:#fff;border:1px solid #e6e8ee}.user-row{display:grid;grid-template-columns:2fr 1fr 1fr;gap:20px;padding:20px 24px;border-bottom:1px solid #edf0f4;font-size:12px;color:#667083}.user-row:last-child{border-bottom:0}.user-row strong,.user-row small{display:block}.user-row strong{color:#262571;font-size:14px}.user-row small{font-size:10px;margin-top:5px}.state{background:#fff;border:1px solid #e6e8ee;padding:30px;color:#667083;font-size:12px}.state.error{color:#a51f20}@media(max-width:700px){.user-row{grid-template-columns:1fr;gap:7px}}`]
})
export class AdminUsersPageComponent {
  private readonly service = inject(AdminService);
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  constructor() { this.service.users().subscribe({ next: users => { this.users.set(users); this.loading.set(false); }, error: () => { this.error.set('Unable to load the user directory.'); this.loading.set(false); } }); }
}
