import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RequestService } from '../core/api.service';
import { AssetRequest, RequestStatus } from '../core/models';

@Component({
  selector: 'jhub-admin-requests-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="admin-requests page-width"><div class="heading"><div><p class="eyebrow">ADMINISTRATION / REQUESTS</p><h1>Request <em>queue.</em></h1><p>Review, approve, and close innovator requests.</p></div><a class="arrow-link" routerLink="/admin/dashboard">Dashboard ↗</a></div><div class="toolbar"><input aria-label="Search requests" placeholder="Search project or requester" [ngModel]="search()" (ngModelChange)="search.set($event); load()"><select aria-label="Filter by status" [ngModel]="status()" (ngModelChange)="status.set($event); load()"><option value="">All statuses</option>@for (value of statuses; track value) {<option [value]="value">{{ value }}</option>}</select></div>@if (loading()) {<div class="state">Loading requests…</div>} @else if (error()) {<div class="state error" role="alert">{{ error() }}</div>} @else if (!requests().length) {<div class="state">No requests match the current filters.</div>} @else {<section class="request-list">@for (request of requests(); track request.id) {<article class="request-row"><a [routerLink]="['/app/requests', request.id]"><strong>{{ request.projectName }}</strong><small>{{ request.innovator?.fullName || 'Unknown requester' }} · {{ request.id }}</small></a><span><small>Submitted</small>{{ request.createdAt | date:'d MMM yyyy' }}</span><span class="status" [class]="request.status.toLowerCase()">{{ request.status }}</span><div class="actions">@if (request.status === RequestStatus.PENDING) {<button [disabled]="busyId() === request.id" (click)="approve(request)">Approve</button><button class="danger" [disabled]="busyId() === request.id" (click)="reject(request)">Reject</button>} @else if (request.status === RequestStatus.APPROVED) {<button [disabled]="busyId() === request.id" (click)="checkout(request)">Check out</button>} @else if (request.status === RequestStatus.CHECKED_OUT) {<button [disabled]="busyId() === request.id" (click)="returnRequest(request)">Mark returned</button>}</div></article>}</section>}@if (message()) {<p class="feedback" [class.error]="messageType() === 'error'" role="status">{{ message() }}</p>}</main>
  `,
  styles: [`:host{display:block}.page-width{width:min(1100px,calc(100% - 48px));margin:auto}.admin-requests{padding:60px 0 110px}.heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:30px}.eyebrow{color:#3ea945;font-size:10px;font-weight:800;letter-spacing:2px;margin:0 0 16px}.heading h1{font:400 clamp(42px,5vw,60px)/1.05 Georgia,serif;color:#262571;margin:0}.heading h1 em{color:#3ea945}.heading p:last-child{color:#667083;font-size:13px}.arrow-link{color:#262571;text-decoration:none;font-size:12px;font-weight:700}.toolbar{display:flex;gap:10px;margin-bottom:18px}.toolbar input,.toolbar select{border:1px solid #dce0e8;padding:12px;font-size:12px}.toolbar input{flex:1}.request-list{background:#fff;border:1px solid #e6e8ee}.request-row{display:grid;grid-template-columns:2fr 1fr auto 1.5fr;align-items:center;gap:20px;padding:20px 24px;border-bottom:1px solid #edf0f4}.request-row:last-child{border-bottom:0}.request-row a{color:#262571;text-decoration:none}.request-row strong,.request-row small{display:block}.request-row strong{font-size:14px}.request-row small{font-size:10px;color:#7c8492;margin-top:5px}.status{font-size:10px;font-weight:800;letter-spacing:1px}.pending{color:#b17b19}.approved{color:#3ea945}.rejected,.overdue{color:#e6292a}.checked_out{color:#2a4695}.returned{color:#667083}.actions{display:flex;justify-content:flex-end;gap:8px}.actions button{border:0;background:transparent;color:#3ea945;font-size:11px;font-weight:700}.actions .danger{color:#e6292a}.actions button:disabled{opacity:.45}.state{background:#fff;border:1px solid #e6e8ee;padding:35px;color:#667083;font-size:12px}.state.error,.feedback.error{color:#a51f20}.feedback{font-size:12px;color:#26742b}@media(max-width:760px){.heading{display:block}.heading .arrow-link{display:inline-block;margin-top:20px}.toolbar{display:block}.toolbar select{width:100%;margin-top:8px}.request-list{overflow:auto}.request-row{min-width:760px}}`]
})
export class AdminRequestsPageComponent {
  private readonly service = inject(RequestService);
  protected readonly statuses = Object.values(RequestStatus);
  protected readonly RequestStatus = RequestStatus;
  protected readonly requests = signal<AssetRequest[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly busyId = signal<string | null>(null);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error'>('success');
  constructor() { this.load(); }
  protected load(): void { this.loading.set(true); this.error.set(null); this.service.listAdmin({ search: this.search(), status: this.status() }).subscribe({ next: requests => { this.requests.set(requests); this.loading.set(false); }, error: () => { this.error.set('Unable to load the request queue.'); this.loading.set(false); } }); }
  private action(request: AssetRequest, operation: (id: string) => ReturnType<RequestService['approve']>, success: string): void { if (!confirm(`${success}?`)) return; this.busyId.set(request.id); this.message.set(''); operation(request.id).subscribe({ next: updated => { this.requests.update(items => items.map(item => item.id === updated.id ? updated : item)); this.message.set(success + '.'); this.messageType.set('success'); }, error: () => { this.message.set('The request could not be updated.'); this.messageType.set('error'); }, complete: () => this.busyId.set(null) }); }
  protected approve(request: AssetRequest): void { this.action(request, id => this.service.approve(id), 'Request approved'); }
  protected reject(request: AssetRequest): void { this.action(request, id => this.service.reject(id, 'Rejected by administrator'), 'Request rejected'); }
  protected checkout(request: AssetRequest): void { this.action(request, id => this.service.checkout(id), 'Request checked out'); }
  protected returnRequest(request: AssetRequest): void { this.action(request, id => this.service.returnAsset(id), 'Request marked returned'); }
}
