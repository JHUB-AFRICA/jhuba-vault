import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService, RequestService, AdminDashboard } from '../core/api.service';
import { AssetRequest, RequestStatus } from '../core/models';

@Component({
  selector: 'jhub-admin-dashboard-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="dashboard page-width"><div class="heading"><div><p class="eyebrow">ADMINISTRATION / OVERVIEW</p><h1>Vault <em>overview.</em></h1><p>Monitor inventory, requests, and active loans.</p></div><a class="primary-button" routerLink="/admin/requests">Review requests <span>→</span></a></div>@if (loading()) {<div class="state">Loading administration metrics…</div>} @else if (error()) {<div class="state error" role="alert">{{ error() }}</div>} @else if (metrics(); as data) {<div class="metrics"><div><small>TOTAL ASSETS</small><strong>{{ data.totalAssets }}</strong><a routerLink="/admin/assets">Manage assets</a></div><div><small>AVAILABLE INVENTORY</small><strong>{{ data.availableInventory }}</strong><a routerLink="/admin/inventory">View inventory</a></div><div><small>PENDING REQUESTS</small><strong>{{ data.pendingRequests }}</strong><a routerLink="/admin/requests">Review queue</a></div><div><small>ACTIVE CHECKOUTS</small><strong>{{ data.checkedOutRequests }}</strong></div><div><small>RETURNED</small><strong>{{ data.returnedRequests }}</strong></div><div><small>OVERDUE</small><strong>{{ data.overdueRequests }}</strong></div></div><section class="recent"><div class="section-heading"><div><p class="eyebrow">RECENT REQUESTS</p><h2>Latest activity</h2></div><a class="arrow-link" routerLink="/admin/requests">Open queue ↗</a></div>@if (!requests().length) {<div class="empty">No requests have been submitted.</div>} @else {@for (request of requests().slice(0, 5); track request.id) {<a class="request-row" [routerLink]="['/app/requests', request.id]"><span><strong>{{ request.projectName }}</strong><small>{{ request.innovator?.fullName || 'Unknown requester' }} · {{ request.createdAt | date:'d MMM yyyy' }}</small></span><span class="status" [class]="request.status.toLowerCase()">{{ request.status }}</span><span>→</span></a>}}</section>}
    </main>
  `,
  styles: [`:host{display:block}.page-width{width:min(1100px,calc(100% - 48px));margin:auto}.dashboard{padding:60px 0 110px}.heading,.section-heading{display:flex;align-items:end;justify-content:space-between;gap:20px}.heading{margin-bottom:35px}.eyebrow{color:#3ea945;font-size:10px;font-weight:800;letter-spacing:2px;margin:0 0 16px}.heading h1{font:400 clamp(42px,5vw,60px)/1.05 Georgia,serif;color:#262571;margin:0}.heading h1 em{color:#3ea945}.heading p:last-child{color:#667083;font-size:13px}.primary-button{display:inline-flex;align-items:center;gap:20px;background:#262571;color:#fff;text-decoration:none;padding:14px 18px;font-size:12px;font-weight:700}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:30px}.metrics div{background:#fff;border:1px solid #e6e8ee;padding:22px}.metrics small,.metrics strong{display:block}.metrics small{font-size:10px;color:#7c8492;letter-spacing:1px}.metrics strong{font:40px Georgia,serif;color:#262571;margin:12px 0}.metrics a{color:#262571;font-size:11px;font-weight:700;text-decoration:none}.section-heading{margin-bottom:16px}.section-heading h2{font:30px Georgia,serif;color:#262571;margin:0}.arrow-link{color:#262571;text-decoration:none;font-size:12px;font-weight:700}.recent{background:#fff;border:1px solid #e6e8ee;padding:25px}.request-row{display:grid;grid-template-columns:1fr auto 20px;gap:20px;align-items:center;padding:17px 0;border-bottom:1px solid #edf0f4;color:#262571;text-decoration:none}.request-row:last-child{border-bottom:0}.request-row strong,.request-row small{display:block}.request-row strong{font-size:14px}.request-row small{font-size:10px;color:#7c8492;margin-top:5px}.status{font-size:10px;font-weight:800;letter-spacing:1px}.pending{color:#b17b19}.approved{color:#3ea945}.rejected,.overdue{color:#e6292a}.checked_out{color:#2a4695}.returned{color:#667083}.empty,.state{background:#fff;border:1px solid #e6e8ee;padding:30px;color:#667083;font-size:12px}.state.error{color:#a51f20}@media(max-width:700px){.heading,.section-heading{display:block}.heading .primary-button,.section-heading .arrow-link{display:inline-flex;margin-top:18px}.metrics{grid-template-columns:1fr 1fr}.request-row{grid-template-columns:1fr auto}}`]
})
export class AdminDashboardPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly requestService = inject(RequestService);
  protected readonly metrics = signal<AdminDashboard | null>(null);
  protected readonly requests = signal<AssetRequest[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly RequestStatus = RequestStatus;
  constructor() { forkJoin({ metrics: this.adminService.dashboard(), requests: this.requestService.listAdmin() }).subscribe({ next: result => { this.metrics.set(result.metrics); this.requests.set(result.requests); this.loading.set(false); }, error: () => { this.error.set('Unable to load the administration dashboard.'); this.loading.set(false); } }); }
}
