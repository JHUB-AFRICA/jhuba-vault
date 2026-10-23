import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, Subject } from 'rxjs';
import { AdminDashboard, AdminRequestCounts, AdminService, RequestService } from '../core/api.service';
import { Asset, AssetRequest, RequestStatus, Role, User } from '../core/models';

const DEFAULT_PAGE_SIZE = 8;
const PAGE_SIZES = [8, 16, 32] as const;
type TrendStatus = 'total' | 'pending' | 'approved' | 'rejected' | 'overdue';
interface CreateRequestItem { assetId: string; quantity: number; }
interface CreateRequestForm {
  innovatorId: string;
  projectName: string;
  projectAbstract: string;
  loanDays: number;
  startDate: string;
}

@Component({
  selector: 'jhub-admin-requests-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="content">
      <div class="page-meta">
        <p class="eyebrow">ADMINISTRATION / REQUESTS</p>
        <div class="system-meta">
          <span class="date-chip"><i class="pi pi-calendar"></i>{{ today | date:'EEEE, MMMM d, y' }}</span>
          <span class="online-chip" [class.offline]="pageError()" [class.checking]="!statusCounts() && !pageError()"><i></i>{{ pageError() ? 'System Offline' : statusCounts() ? 'System Online' : 'Connecting…' }}</span>
        </div>
      </div>

      <section class="page-heading">
        <div>
          <h1><span>Request</span> <em>Management</em></h1>
          <p>Review and manage asset requests from innovators. Approve, reject or view detailed information.</p>
        </div>
        <button type="button" class="primary-button add-button" (click)="openCreate()"><i class="pi pi-plus"></i> Add Request</button>
      </section>

      @if (historyError()) {
        <p class="history-error" role="status">Monthly request trends are unavailable. {{ historyError() }}</p>
      }
      @if (createError()) {
        <p class="page-message error" role="alert">{{ createError() }}</p>
      }

          <section class="metric-grid" aria-label="Request statistics">
            <button type="button" class="metric-card total-card" [class.selected]="status() === ''" [attr.aria-pressed]="status() === ''" (click)="setStatus('')">
              <span class="metric-icon"><i class="pi pi-file"></i></span>
              <span class="metric-copy"><small>Total Requests</small><strong>{{ totalRequests() ?? '—' }}</strong></span>
              <small class="metric-note">All request statuses @if (trendLabel('total'); as trend) { · {{ trend }} }</small>
            </button>
            <button type="button" class="metric-card pending-card" [class.selected]="status() === RequestStatus.PENDING" [attr.aria-pressed]="status() === RequestStatus.PENDING" (click)="setStatus(RequestStatus.PENDING)">
              <span class="metric-icon"><i class="pi pi-clock"></i></span>
              <span class="metric-copy"><small>Pending</small><strong>{{ countFor(RequestStatus.PENDING) }}</strong></span>
              <small class="metric-note">Awaiting review @if (trendLabel('pending'); as trend) { · {{ trend }} }</small>
            </button>
            <button type="button" class="metric-card approved-card" [class.selected]="status() === RequestStatus.APPROVED" [attr.aria-pressed]="status() === RequestStatus.APPROVED" (click)="setStatus(RequestStatus.APPROVED)">
              <span class="metric-icon"><i class="pi pi-check-circle"></i></span>
              <span class="metric-copy"><small>Approved</small><strong>{{ countFor(RequestStatus.APPROVED) }}</strong></span>
              <small class="metric-note">Approved requests @if (trendLabel('approved'); as trend) { · {{ trend }} }</small>
            </button>
            <button type="button" class="metric-card rejected-card" [class.selected]="status() === RequestStatus.REJECTED" [attr.aria-pressed]="status() === RequestStatus.REJECTED" (click)="setStatus(RequestStatus.REJECTED)">
              <span class="metric-icon"><i class="pi pi-times-circle"></i></span>
              <span class="metric-copy"><small>Rejected</small><strong>{{ countFor(RequestStatus.REJECTED) }}</strong></span>
              <small class="metric-note">Rejected requests @if (trendLabel('rejected'); as trend) { · {{ trend }} }</small>
            </button>
            <button type="button" class="metric-card overdue-card" [class.selected]="status() === RequestStatus.OVERDUE" [attr.aria-pressed]="status() === RequestStatus.OVERDUE" (click)="setStatus(RequestStatus.OVERDUE)">
              <span class="metric-icon"><i class="pi pi-calendar-plus"></i></span>
              <span class="metric-copy"><small>Overdue</small><strong>{{ countFor(RequestStatus.OVERDUE) }}</strong></span>
              <small class="metric-note">Past expected return @if (trendLabel('overdue'); as trend) { · {{ trend }} }</small>
            </button>
          </section>
          <section class="requests-panel" aria-labelledby="requests-title">
            <div class="panel-heading"><h2 id="requests-title">Requests</h2></div>
            <div class="filter-toolbar">
              <div class="status-filters" role="group" aria-label="Filter requests by status">
                <button type="button" [class.selected]="status() === ''" [attr.aria-pressed]="status() === ''" (click)="setStatus('')">All <span>({{ totalRequests() ?? '—' }})</span></button>
                @for (value of statuses; track value) {
                  <button type="button" [class.selected]="status() === value" [attr.aria-pressed]="status() === value" (click)="setStatus(value)"><i [class]="statusDotClass(value)"></i>{{ statusLabel(value) }} <span>({{ countFor(value) }})</span></button>
                }
              </div>
              <label class="table-search"><i class="pi pi-search"></i><input aria-label="Search by project, innovator, or request ID" maxlength="100" placeholder="Search by project, innovator, or request ID" [ngModel]="search()" (ngModelChange)="onSearch($event)"></label>
              <button class="filter-button" type="button" (click)="toggleFilterMenu()" [attr.aria-expanded]="filterMenuOpen()"><i class="pi pi-filter"></i> Filter</button>
              @if (filterMenuOpen()) {
                <div class="filter-popover">
                  <label for="status-select">Request status</label>
                  <select id="status-select" [ngModel]="status()" (ngModelChange)="setStatus($event, false)">
                    <option value="">All statuses</option>
                    @for (value of statuses; track value) { <option [value]="value">{{ statusLabel(value) }}</option> }
                  </select>
                  <label for="date-from">Requested from</label>
                  <input id="date-from" type="date" [ngModel]="dateFrom()" (ngModelChange)="dateFrom.set($event)" [max]="dateTo() || null">
                  <label for="date-to">Requested to</label>
                  <input id="date-to" type="date" [ngModel]="dateTo()" (ngModelChange)="dateTo.set($event)" [min]="dateFrom() || null">
                  <div class="filter-actions">
                    <button type="button" class="clear-filter" (click)="clearFilters()">Clear</button>
                    <button type="button" (click)="applyDateFilters()">Apply</button>
                  </div>
                </div>
              }
            </div>

            <div class="table-scroll">
              <div class="table-head request-grid">
                <label class="selection-checkbox"><input type="checkbox" aria-label="Select all requests on this page" [checked]="allOnPageSelected()" [indeterminate]="someOnPageSelected() && !allOnPageSelected()" (change)="togglePageSelection($event)"></label><span>Request ID</span><span>Project</span><span>Innovator</span><span>Assets</span><span>Loan Period</span><span>Requested On</span><span>Status</span><span>Actions</span>
              </div>
              @if (loading()) {
                <div class="table-state">Loading requests…</div>
              } @else if (pageError()) {
                <div class="table-state error" role="alert">{{ pageError() }} <button type="button" (click)="loadPage()">Try again</button></div>
              } @else if (!requests().length) {
                <div class="table-state">{{ totalRequests() === 0 ? 'There are no requests yet.' : 'No requests match the current filters.' }}</div>
              } @else {
                @for (request of requests(); track request.id) {
                  <article class="request-row request-grid">
                    <label class="selection-checkbox"><input type="checkbox" [attr.aria-label]="'Select request ' + request.id" [checked]="isSelected(request.id)" (change)="toggleSelection(request.id, $event)"></label>
                    <a class="request-id" [routerLink]="['/app/requests', request.id]">REQ-{{ request.id.slice(-4) | uppercase }}</a>
                    <a class="project-cell" [routerLink]="['/app/requests', request.id]"><strong>{{ request.projectName }}</strong><small>{{ request.projectAbstract }}</small></a>
                    <span class="innovator-cell">
                      <span class="avatar initials-avatar">{{ initials(request.innovator?.fullName) }}</span>
                      <span><strong>{{ request.innovator?.fullName || 'Unknown innovator' }}</strong><small>{{ request.innovator?.identificationId || '—' }}</small></span>
                    </span>
                    <span class="assets-cell">
                      @for (item of request.requestItems; track item.id || item.assetId) {
                        <span>{{ item.asset.name }} <small>× {{ item.quantity }}</small></span>
                      }
                    </span>
                    <span class="loan-cell">{{ request.loanDays }}<small>days</small></span>
                    <span class="date-cell">{{ request.createdAt | date:'MMM d, y' }}<small>{{ request.createdAt | date:'h:mm a' }}</small></span>
                    <span class="status-cell"><span class="status-pill" [class]="'status-pill ' + request.status.toLowerCase()"><i class="pi" [class]="statusIcon(request.status)"></i>{{ statusLabel(request.status) }}</span></span>
                    <div class="row-actions">
                      <a class="action-button view-button" [routerLink]="['/app/requests', request.id]"><i class="pi pi-eye"></i><span>View</span></a>
                      @if (request.status === RequestStatus.PENDING) {
                        <button class="action-button approve-button" type="button" [disabled]="busyId() === request.id" (click)="approve(request)"><i class="pi pi-check-circle"></i><span>Approve</span></button>
                        <button class="action-button reject-button" type="button" [disabled]="busyId() === request.id" (click)="reject(request)"><i class="pi pi-times"></i><span>Reject</span></button>
                      } @else if (request.status === RequestStatus.APPROVED) {
                        <button class="action-button approve-button" type="button" [disabled]="busyId() === request.id" (click)="checkout(request)"><i class="pi pi-sign-out"></i><span>Check Out</span></button>
                      } @else if (request.status === RequestStatus.CHECKED_OUT) {
                        <button class="action-button return-button" type="button" [disabled]="busyId() === request.id" (click)="returnRequest(request)"><i class="pi pi-replay"></i><span>Mark Returned</span></button>
                      }
                    </div>
                  </article>
                }
              }
            </div>
            @if (!loading() && !pageError()) {
              <footer class="table-footer">
                <span>Showing <strong>{{ pageStart() }}–{{ pageEnd() }}</strong> of <strong>{{ filteredTotal() }}</strong> requests</span>
                <div class="table-footer-controls">
                  <label class="page-size-control">Rows
                    <select aria-label="Requests per page" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
                      @for (size of pageSizes; track size) { <option [ngValue]="size">{{ size }}</option> }
                    </select>
                    per page
                  </label>
                  <nav class="pagination" aria-label="Request pages">
                    <button type="button" aria-label="Previous page" [disabled]="page() <= 1" (click)="goToPage(page() - 1)"><i class="pi pi-angle-left"></i></button>
                    @for (pageNumber of pageNumbers(); track pageNumber) {
                      <button type="button" [class.current]="page() === pageNumber" [attr.aria-current]="page() === pageNumber ? 'page' : null" [attr.aria-label]="'Page ' + pageNumber" (click)="goToPage(pageNumber)">{{ pageNumber }}</button>
                    }
                    <button type="button" aria-label="Next page" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)"><i class="pi pi-angle-right"></i></button>
                  </nav>
                </div>
              </footer>
            }
            @if (message()) { <p class="feedback" [class.error]="messageType() === 'error'" role="status">{{ message() }}</p> }
          </section>
    </main>

    @if (createDialogOpen()) {
      <div class="modal-backdrop" (click)="closeCreate()">
        <section class="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-request-title" (click)="$event.stopPropagation()">
          <header class="dialog-heading">
            <div><p class="eyebrow">ADMINISTRATION / REQUESTS</p><h2 id="create-request-title">Add Request</h2></div>
            <button type="button" class="dialog-close" aria-label="Close dialog" [disabled]="creating()" (click)="closeCreate()">×</button>
          </header>
          @if (createLoading()) {
            <p class="dialog-message">Loading innovators and available assets…</p>
          } @else if (!createError() || innovators().length || availableAssets().length) {
            <form class="create-form" (ngSubmit)="createRequest()">
              <label>Innovator
                <select name="innovatorId" [(ngModel)]="createForm.innovatorId" required>
                  <option value="" disabled>Select an innovator</option>
                  @for (innovator of innovators(); track innovator.id) {
                    <option [value]="innovator.id">{{ innovator.fullName }} · {{ innovator.identificationId }}</option>
                  }
                </select>
              </label>
              @if (!innovators().length) { <p class="dialog-message">No innovator accounts are available.</p> }
              <label>Project name
                <input name="projectName" [(ngModel)]="createForm.projectName" maxlength="120" required>
              </label>
              <label>Project details
                <textarea name="projectAbstract" [(ngModel)]="createForm.projectAbstract" rows="3" minlength="20" maxlength="2000" required></textarea>
              </label>
              <div class="create-fields">
                <label>Loan period (days)
                  <input name="loanDays" type="number" min="1" max="365" [(ngModel)]="createForm.loanDays" required>
                </label>
                <label>Start date
                  <input name="startDate" type="date" [(ngModel)]="createForm.startDate" required>
                </label>
              </div>
              <fieldset class="create-assets">
                <legend>Requested assets</legend>
                @for (asset of availableAssets(); track asset.id) {
                  <label class="create-asset-option">
                    <input type="checkbox" [checked]="isCreateAssetSelected(asset.id)" (change)="toggleCreateAsset(asset.id, $event)">
                    <span><strong>{{ asset.name }}</strong><small>{{ asset.assetTag }} · {{ asset.availableQty }} available</small></span>
                    @if (isCreateAssetSelected(asset.id)) {
                      <input class="asset-quantity" type="number" min="1" [max]="asset.availableQty" [attr.aria-label]="'Quantity for ' + asset.name" [ngModel]="createQuantity(asset.id)" (ngModelChange)="setCreateQuantity(asset.id, $event)" [name]="'quantity-' + asset.id">
                    }
                  </label>
                } @empty {
                  <p class="dialog-message">No assets are currently available to request.</p>
                }
              </fieldset>
              @if (createError()) { <p class="dialog-error" role="alert">{{ createError() }}</p> }
              <footer class="dialog-actions">
                <button type="button" class="secondary-button" [disabled]="creating()" (click)="closeCreate()">Cancel</button>
                <button type="submit" class="primary-button" [disabled]="creating() || !innovators().length || !availableAssets().length">
                  {{ creating() ? 'Creating…' : 'Create Request' }}
                </button>
              </footer>
            </form>
          } @else {
            <div class="dialog-message error" role="alert">{{ createError() }} <button type="button" (click)="loadCreateOptions()">Try again</button></div>
          }
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#172033; }
    .content { width:100%; max-width:1720px; margin:0 auto; padding:34px clamp(24px,4vw,64px) 52px; }
    .page-meta { min-height:32px; display:flex; justify-content:space-between; align-items:center; gap:16px; }
    .eyebrow { margin:0; color:#3ea945; font-size:10px; font-weight:800; letter-spacing:1.6px; }
    .system-meta { display:flex; align-items:center; gap:9px; }
    .date-chip,.online-chip { min-height:30px; display:inline-flex; align-items:center; gap:7px; padding:0 12px; border:1px solid #e0e7f0; border-radius:7px; background:#fff; color:#52647d; white-space:nowrap; font-size:11px; }
    .date-chip i { color:#3978ef; font-size:12px; }
    .avatar { width:30px; height:30px; flex:0 0 30px; display:inline-grid; place-items:center; border:1px solid #d2dce9; border-radius:50%; background:#d9e7f2; color:#17334d; font-size:10px; font-weight:700; }
    .online-chip { border-color:#c9f1dd; border-radius:12px; background:#edfff6; color:#07834e; font-weight:600; }
    .online-chip i { width:7px; height:7px; border-radius:50%; background:#08b879; }
    .online-chip.offline { color:#b4232c; border-color:#ffd1d4; background:#fff4f4; }
    .online-chip.offline i { background:#e33e4c; }
    .online-chip.checking { color:#7b8797; border-color:#e0e7f0; background:#f8fafc; }
    .online-chip.checking i { background:#93a0b0; }
    .page-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin:14px 0 28px; }
    .page-heading h1 { margin:0; color:#262571; font:400 clamp(38px,4vw,54px)/1.08 Georgia,serif; letter-spacing:-.5px; }
    .page-heading h1 em { color:#3ea945; font-weight:400; }
    .page-heading p { max-width:690px; margin:10px 0 0; color:#667083; font-size:14px; line-height:1.5; }
    .add-button { flex:none; display:inline-flex; align-items:center; gap:8px; min-height:42px; padding:0 18px; border:0; border-radius:5px; background:#2a4695; color:#fff; font-size:13px; font-weight:700; }
    .add-button:hover { background:#262571; }
    .history-error,.page-message { margin:0 0 14px; padding:10px 13px; border:1px solid #e6e8ee; background:#fff; color:#667083; font-size:12px; }
    .page-message.error,.history-error { border-color:#ffd1d4; background:#fff6f6; color:#a51f20; }
    .metric-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:14px; margin-bottom:24px; }
    .metric-card { min-width:0; width:100%; min-height:112px; display:grid; grid-template-columns:44px 1fr; grid-template-rows:1fr auto; align-items:center; column-gap:12px; padding:16px; border:1px solid #e6e8ee; border-radius:8px; background:#fff; color:inherit; text-align:left; cursor:pointer; transition:border-color .15s,box-shadow .15s; }
    .metric-card:hover,.metric-card.selected { border-color:#262571; box-shadow:0 0 0 1px #2625711a; }
    .metric-card:focus-visible { outline:3px solid #89be32; outline-offset:2px; }
    .metric-icon { grid-row:1; width:42px; height:42px; display:grid; place-items:center; border-radius:8px; background:#eef5ff; color:#2a4695; }
    .metric-icon i { font-size:18px; }
    .metric-copy { display:grid; gap:4px; }
    .metric-copy small { color:#667083; font-size:12px; }
    .metric-copy strong { color:#262571; font:30px/1 Georgia,serif; }
    .metric-note { grid-column:1 / -1; align-self:end; padding-top:8px; color:#8795a9; font-size:11px; line-height:1.4; }
    .metric-note i { margin-right:4px; font-size:10px; }
    .metric-note.growth { color:#13a875; }
    .metric-note.decline { color:#eb4652; }
    .metric-note.overdue-growth { color:#a43bdd; }
    .metrics-error { margin:-5px 0 12px; color:#b4232c; font-size:9px; }
    .metrics-error button { margin-left:5px; padding:3px 7px; border:1px solid #e2c6c8; border-radius:5px; background:#fff; color:#a51f20; font-size:8px; }
    .pending-card .metric-icon { background:#fff8e7; color:#ed9900; }
    .approved-card .metric-icon { background:#eafbf4; color:#0c9a64; }
    .rejected-card .metric-icon { background:#fff0f0; color:#e6292a; }
    .overdue-card .metric-icon { background:#f8efff; color:#8b42b5; }
    .requests-panel { position:relative; overflow:visible; border:1px solid #e6e8ee; border-radius:8px; background:#fff; box-shadow:0 1px 2px #20324c08; }
    .panel-heading { min-height:58px; display:flex; align-items:center; padding:0 20px; }
    .panel-heading h2 { margin:0; color:#262571; font:24px Georgia,serif; }
    .filter-toolbar { position:relative; display:flex; align-items:center; flex-wrap:wrap; gap:10px; padding:0 18px 16px; }
    .status-filters { flex:1 1 100%; min-height:42px; display:flex; align-content:flex-start; align-items:center; flex-wrap:wrap; gap:5px 8px; padding:5px; border:1px solid #e6e8ee; border-radius:6px; background:#f8fafc; }
    .status-filters button { min-height:30px; display:inline-flex; align-items:center; gap:6px; padding:0 11px; border:0; border-radius:5px; background:transparent; color:#394b63; white-space:nowrap; font-size:12px; }
    .status-filters button.selected { background:#262571; color:#fff; }
    .status-filters button span { opacity:.82; }
    .status-dot { width:7px; height:7px; display:inline-block; border-radius:50%; background:#f2a900; }
    .approved-dot,.returned-dot { background:#3ea945; }
    .rejected-dot { background:#e6292a; }
    .overdue-dot { background:#8b42b5; }
    .checked-out-dot { background:#2a4695; }
    .table-search { flex:1 1 280px; height:40px; margin-top:0; border-radius:5px; }
    .table-search input { font-size:12px; }
    .filter-button { height:40px; display:flex; align-items:center; gap:7px; padding:0 14px; border:1px solid #dce0e8; border-radius:5px; background:#fff; color:#262571; white-space:nowrap; font-size:12px; }
    .filter-button .pi { color:#262571; font-size:13px; }
    .filter-popover { position:absolute; z-index:8; top:48px; right:18px; width:260px; display:grid; gap:9px; padding:16px; border:1px solid #dce0e8; border-radius:6px; background:#fff; box-shadow:0 8px 24px #162a441f; }
    .filter-popover label { color:#52647d; font-size:12px; }
    .filter-popover select,.filter-popover input { width:100%; min-height:36px; padding:7px 9px; border:1px solid #dce0e8; border-radius:4px; color:#263850; background:#fff; font-size:12px; }
    .filter-popover button { justify-self:end; padding:8px 13px; border:0; border-radius:4px; background:#262571; color:#fff; font-size:12px; }
    .filter-actions { display:flex; justify-content:flex-end; gap:6px; }
    .filter-popover .clear-filter { border:1px solid #dce0e8; background:#fff; color:#52647d; }
    .table-scroll { overflow-x:auto; }
    .request-grid { display:grid; grid-template-columns:24px 86px minmax(210px,1.45fr) minmax(160px,1fr) minmax(150px,1fr) 82px 105px 110px minmax(240px,1.35fr); column-gap:10px; align-items:center; }
    .table-head { min-height:52px; padding:0 18px; border-top:1px solid #edf0f4; border-bottom:1px solid #e6e8ee; background:#f8fafc; color:#586174; font-size:11px; line-height:1.35; font-weight:700; letter-spacing:.35px; text-transform:uppercase; }
    .request-row { position:relative; min-height:94px; padding:12px 18px; border-bottom:1px solid #edf0f4; }
    .request-row:last-child { border-bottom:0; }
    .selection-checkbox { display:grid; place-items:center; width:20px; height:24px; cursor:pointer; }
    .selection-checkbox input { width:15px; height:15px; margin:0; accent-color:#262571; cursor:pointer; }
    .selection-checkbox input:focus-visible { outline:2px solid #3ea945; outline-offset:2px; }
    .request-id { color:#262571; text-decoration:none; font-size:12px; line-height:1.35; overflow-wrap:anywhere; }
    .project-cell,.innovator-cell,.assets-cell,.date-cell,.loan-cell { min-width:0; color:#2b394d; }
    .project-cell,.project-cell strong,.project-cell small,.innovator-cell strong,.innovator-cell small,.assets-cell>span,.assets-cell>small,.loan-cell small,.date-cell small { display:block; }
    .project-cell { text-decoration:none; }
    .project-cell strong { display:-webkit-box; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:3; color:#262571; font-size:13px; line-height:1.35; font-weight:650; }
    .project-cell small { display:-webkit-box; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:3; margin-top:4px; color:#667083; font-size:11px; line-height:1.4; }
    .innovator-cell { display:flex; align-items:center; gap:8px; }
    .initials-avatar { width:30px; height:30px; flex-basis:30px; border-color:#edf0f4; font-size:10px; }
    .innovator-cell strong { display:-webkit-box; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:2; color:#2d3a4e; font-size:12px; line-height:1.3; font-weight:600; }
    .innovator-cell small { overflow:hidden; text-overflow:ellipsis; margin-top:4px; color:#7c8492; font-size:10px; }
    .assets-cell { color:#35455b; font-size:11px; line-height:1.5; }
    .assets-cell>span { display:-webkit-box; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:2; line-height:1.3; }
    .assets-cell small { color:#7c8492; font-size:10px; }
    .loan-cell { font-size:12px; }
    .loan-cell small { color:#71819a; font-size:10px; }
    .date-cell { white-space:nowrap; font-size:11px; }
    .date-cell small { padding-top:4px; color:#7c8492; font-size:10px; }
    .status-pill { width:max-content; max-width:100%; min-width:76px; min-height:27px; display:inline-flex; align-items:center; justify-content:center; gap:5px; padding:4px 9px; border:1px solid #ffe09b; border-radius:14px; background:#fffaf0; color:#b87300; font-size:10px; line-height:1.2; }
    .status-pill .pi { font-size:6px; }
    .status-pill.approved { border-color:#b6f0d5; background:#effdf6; color:#078a58; }
    .status-pill.returned { border-color:#ddc8f7; background:#f7f1ff; color:#7844a5; }
    .status-pill.rejected { border-color:#ffc8ce; background:#fff2f3; color:#de3448; }
    .status-pill.checked_out { max-width:100%; min-height:27px; flex-wrap:wrap; border-color:#c8d9ff; background:#f1f6ff; color:#2360e8; }
    .status-pill.overdue { border-color:#e3c8ff; background:#faf3ff; color:#9b3bd0; }
    .row-actions { display:flex; align-items:center; justify-content:flex-start; flex-wrap:wrap; gap:6px; min-width:0; }
    .action-button { min-width:0; height:30px; display:inline-flex; align-items:center; justify-content:center; gap:5px; padding:0 9px; border:1px solid #d2e3ff; border-radius:4px; background:#f7faff; color:#2a4695; white-space:nowrap; text-decoration:none; font-size:11px; }
    .action-button i { font-size:12px; }
    .approve-button { border-color:#a8e9ce; background:#f2fff9; color:#0c7b51; }
    .reject-button { border-color:#ffc3c8; background:#fff7f7; color:#c92832; }
    .return-button { border-color:#c8d9ff; background:#f1f6ff; color:#2360e8; }
    .action-button:disabled { cursor:not-allowed; border-color:#e2e7ed; background:#f8fafc; color:#a9b5c5; }
    .table-state { min-height:180px; display:flex; justify-content:center; align-items:center; gap:10px; padding:24px; color:#667083; font-size:14px; }
    .table-state.error { color:#b4232c; }
    .table-state button { padding:8px 12px; border:1px solid #dce0e8; border-radius:4px; background:#fff; color:#262571; font-size:12px; }
    .table-footer { min-height:54px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 18px; border-top:1px solid #edf0f4; color:#667083; font-size:11px; }
    .table-footer strong { color:#3b4d65; font-weight:600; }
    .table-footer-controls { display:flex; align-items:center; gap:14px; }
    .page-size-control { display:flex; align-items:center; gap:4px; white-space:nowrap; }
    .page-size-control select { min-height:30px; padding:3px 7px; border:1px solid #dce0e8; border-radius:4px; background:#fff; color:#50617a; font-size:11px; }
    .pagination { display:flex; align-items:center; gap:4px; }
    .pagination button { min-width:30px; height:30px; padding:0 8px; border:1px solid #dce0e8; border-radius:4px; background:#fff; color:#50617a; font-size:11px; }
    .pagination button.current { border-color:#262571; background:#262571; color:#fff; }
    .pagination button:disabled { cursor:not-allowed; color:#b2bdcc; }
    .feedback { margin:10px 18px; color:#078a58; font-size:12px; }
    .feedback.error { color:#b4232c; }
    .create-dialog { width:min(660px,100%); max-height:90vh; overflow:auto; padding:24px; border-radius:8px; background:#fff; box-shadow:0 20px 60px #17203340; }
    .dialog-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .dialog-heading h2 { margin:6px 0 0; color:#262571; font:26px Georgia,serif; }
    .dialog-close { width:30px; height:30px; border:0; background:transparent; color:#687284; font-size:24px; }
    .dialog-close:disabled { cursor:not-allowed; opacity:.5; }
    .create-form { display:grid; gap:13px; }
    .create-form>label,.create-fields label { display:grid; gap:6px; color:#52647d; font-size:12px; font-weight:600; }
    .create-form input:not([type=checkbox]),.create-form select,.create-form textarea { width:100%; min-height:38px; padding:8px 10px; border:1px solid #dce0e8; border-radius:4px; background:#fff; color:#263850; font-size:13px; }
    .create-form textarea { resize:vertical; }
    .create-fields { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .create-assets { max-height:220px; overflow:auto; margin:0; padding:12px; border:1px solid #e6e8ee; border-radius:5px; }
    .create-assets legend { padding:0 5px; color:#52647d; font-size:12px; font-weight:700; }
    .create-asset-option { min-height:50px; display:flex; align-items:center; gap:10px; padding:7px 4px; border-bottom:1px solid #edf0f4; cursor:pointer; }
    .create-asset-option:last-of-type { border-bottom:0; }
    .create-asset-option>input[type=checkbox] { accent-color:#262571; }
    .create-asset-option>span { flex:1; min-width:0; }
    .create-asset-option strong,.create-asset-option small { display:block; }
    .create-asset-option strong { color:#262571; font-size:12px; }
    .create-asset-option small { margin-top:3px; color:#7c8492; font-size:10px; }
    .create-form input.asset-quantity { width:72px; min-height:32px; }
    .dialog-message { color:#667083; font-size:13px; }
    .dialog-message.error,.dialog-error { color:#a51f20; font-size:12px; }
    .dialog-message button { margin-left:8px; border:0; background:transparent; color:#262571; text-decoration:underline; }
    .dialog-actions { display:flex; justify-content:flex-end; gap:9px; padding-top:5px; }
    .dialog-actions button { min-height:38px; padding:0 14px; border:1px solid #dce0e8; border-radius:4px; background:#fff; color:#52647d; font-size:12px; }
    .dialog-actions .primary-button { border-color:#2a4695; background:#2a4695; color:#fff; }
    .dialog-actions button:disabled { cursor:not-allowed; opacity:.55; }
    .secondary-button { color:#52647d; }
    .modal-backdrop { position:fixed; z-index:40; inset:0; display:grid; place-items:center; padding:20px; background:#17203380; }
    .feedback { margin:10px 18px; color:#078a58; font-size:12px; }
    .feedback.error { color:#b4232c; }
    @media (max-width:1100px) {
      .metric-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
      .request-grid { min-width:1320px; }
    }
    @media (max-width:700px) {
      .content { padding:24px 14px 32px; }
      .page-heading { align-items:flex-start; flex-direction:column; }
      .add-button { align-self:flex-start; }
      .metric-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }
      .metric-card:last-child { grid-column:span 2; }
      .page-meta { align-items:flex-start; flex-direction:column; padding:3px 0 6px; }
      .system-meta { flex-wrap:wrap; }
      .filter-toolbar { align-items:flex-start; }
      .status-filters { min-width:100%; }
      .table-search { flex:1 1 180px; }
      .table-scroll { padding-bottom:3px; }
      .request-grid { min-width:1320px; }
      .table-footer { align-items:flex-start; flex-direction:column; padding:9px 10px; }
      .table-footer-controls { width:100%; justify-content:space-between; gap:5px; }
      .pagination { align-self:flex-end; }
      .create-dialog { padding:18px; }
    }
    @media (max-width:390px) {
      .date-chip,.online-chip { min-height:28px; padding:0 8px; font-size:10px; }
      .page-heading > div { width:100%; min-width:0; }
      .page-heading h1 { font-size:clamp(28px,8.5vw,34px); }
      .page-heading p { max-width:100%; }
      .metric-card { padding:12px; }
      .metric-copy small { font-size:11px; }
      .metric-note { white-space:normal; }
      .create-fields { grid-template-columns:1fr; }
    }
  `]
})
export class AdminRequestsPageComponent {
  private readonly service = inject(RequestService);
  private readonly adminService = inject(AdminService);
  private readonly searchChanges = new Subject<string>();
  protected readonly statuses = Object.values(RequestStatus);
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly RequestStatus = RequestStatus;
  protected readonly today = new Date();
  protected readonly requests = signal<AssetRequest[]>([]);
  protected readonly loading = signal(true);
  protected readonly pageError = signal<string | null>(null);
  protected readonly statusCounts = signal<AdminRequestCounts | null>(null);
  protected readonly requestActivity = signal<AdminDashboard['requestActivity']>([]);
  protected readonly historyError = signal<string | null>(null);
  private readonly legacyBackend = signal(false);
  protected readonly search = signal('');
  protected readonly status = signal<RequestStatus | ''>('');
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly filteredTotal = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly busyId = signal<string | null>(null);
  protected readonly filterMenuOpen = signal(false);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error'>('success');
  protected readonly createDialogOpen = signal(false);
  protected readonly createLoading = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly innovators = signal<User[]>([]);
  protected readonly inventoryAssets = signal<Asset[]>([]);
  protected readonly availableAssets = computed(() => this.inventoryAssets().filter(asset => asset.availableQty > 0));
  protected readonly createItems = signal<CreateRequestItem[]>([]);
  protected createForm: CreateRequestForm = {
    innovatorId: '',
    projectName: '',
    projectAbstract: '',
    loanDays: 7,
    startDate: this.localDate()
  };
  protected readonly totalRequests = computed(() => this.statusCounts()?.total ?? null);
  protected readonly pageStart = computed(() => this.filteredTotal() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  protected readonly pageEnd = computed(() => Math.min(this.page() * this.pageSize(), this.filteredTotal()));
  protected readonly allOnPageSelected = computed(() => this.requests().length > 0 && this.requests().every(request => this.selectedIds().has(request.id)));
  protected readonly someOnPageSelected = computed(() => this.requests().some(request => this.selectedIds().has(request.id)));
  protected readonly pageNumbers = computed(() => {
    const count = Math.min(5, this.totalPages());
    const start = Math.max(1, Math.min(this.page() - 2, this.totalPages() - count + 1));
    return Array.from({ length: count }, (_, index) => start + index);
  });

  constructor() {
    this.searchChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.loadPage();
    });
    this.loadPage();
    this.loadRequestHistory();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    this.searchChanges.next(value);
  }

  protected setStatus(value: RequestStatus | '', closeMenu = true): void {
    this.status.set(value);
    this.page.set(1);
    if (closeMenu) this.filterMenuOpen.set(false);
    this.loadPage();
  }

  protected applyDateFilters(): void {
    this.page.set(1);
    this.filterMenuOpen.set(false);
    this.loadPage();
  }

  protected clearFilters(): void {
    this.status.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.page.set(1);
    this.filterMenuOpen.set(false);
    this.loadPage();
  }

  protected toggleFilterMenu(): void {
    this.filterMenuOpen.update(open => !open);
  }

  protected openCreate(): void {
    this.createDialogOpen.set(true);
    this.createError.set(null);
    this.createForm = {
      innovatorId: '',
      projectName: '',
      projectAbstract: '',
      loanDays: 7,
      startDate: this.localDate()
    };
    this.createItems.set([]);
    this.loadCreateOptions();
  }

  protected closeCreate(): void {
    if (this.creating()) return;
    this.createDialogOpen.set(false);
    this.createError.set(null);
  }

  protected loadCreateOptions(): void {
    this.createLoading.set(true);
    this.createError.set(null);
    forkJoin({
      users: this.adminService.users(),
      assets: this.adminService.inventory()
    }).subscribe({
      next: ({ users, assets }) => {
        this.innovators.set(users.filter(user => user.role === Role.INNOVATOR));
        this.inventoryAssets.set(assets);
        this.createLoading.set(false);
      },
      error: (error: unknown) => {
        this.createError.set(this.apiErrorMessage(error, 'Unable to load innovators and available assets.'));
        this.createLoading.set(false);
      }
    });
  }

  protected isCreateAssetSelected(assetId: string): boolean {
    return this.createItems().some(item => item.assetId === assetId);
  }

  protected createQuantity(assetId: string): number {
    return this.createItems().find(item => item.assetId === assetId)?.quantity ?? 1;
  }

  protected toggleCreateAsset(assetId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!checked) {
      this.createItems.update(items => items.filter(item => item.assetId !== assetId));
      return;
    }
    const asset = this.availableAssets().find(item => item.id === assetId);
    if (asset && !this.isCreateAssetSelected(assetId)) {
      this.createItems.update(items => [...items, { assetId, quantity: 1 }]);
    }
  }

  protected setCreateQuantity(assetId: string, quantity: number): void {
    const asset = this.availableAssets().find(item => item.id === assetId);
    if (!asset) return;
    const safeQuantity = Math.min(asset.availableQty, Math.max(1, Math.trunc(Number(quantity) || 1)));
    this.createItems.update(items => items.map(item => item.assetId === assetId ? { ...item, quantity: safeQuantity } : item));
  }

  protected createRequest(): void {
    const items = this.createItems();
    if (!this.createForm.innovatorId || items.length === 0) {
      this.createError.set('Select an innovator and at least one available asset.');
      return;
    }
    this.creating.set(true);
    this.createError.set(null);
    this.service.createAdmin({
      ...this.createForm,
      items,
      teamMembers: []
    }).pipe(finalize(() => this.creating.set(false))).subscribe({
      next: () => {
        this.closeCreate();
        this.message.set('Request created successfully.');
        this.messageType.set('success');
        this.loadPage();
      },
      error: (error: unknown) => this.createError.set(this.apiErrorMessage(error, 'The request could not be created.'))
    });
  }

  private localDate(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private loadRequestHistory(): void {
    this.adminService.dashboard().subscribe({
      next: metrics => this.requestActivity.set(metrics.requestActivity),
      error: (error: unknown) => this.historyError.set(this.requestErrorMessage(error))
    });
  }

  protected setPageSize(size: number): void {
    if (!this.pageSizes.some(option => option === size)) return;
    this.pageSize.set(size);
    this.page.set(1);
    this.loadPage();
  }

  protected isSelected(requestId: string): boolean {
    return this.selectedIds().has(requestId);
  }

  protected toggleSelection(requestId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update(selected => {
      const next = new Set(selected);
      if (checked) next.add(requestId);
      else next.delete(requestId);
      return next;
    });
  }

  protected togglePageSelection(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.update(selected => {
      const next = new Set(selected);
      for (const request of this.requests()) {
        if (checked) next.add(request.id);
        else next.delete(request.id);
      }
      return next;
    });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.loadPage();
  }

  protected loadPage(): void {
    this.loading.set(true);
    this.pageError.set(null);
    this.service.listAdminPage({
      search: this.search().trim() || undefined,
      status: this.status() || undefined,
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      page: this.page(),
      limit: this.pageSize()
    }).subscribe({
      next: result => {
        if (result.statusCounts) {
          this.statusCounts.set(result.statusCounts);
        } else if (!this.statusCounts()) {
          this.loadStatusCounts();
        }
        const pageCount = Math.max(1, result.totalPages);
        if (this.page() > pageCount) {
          this.page.set(pageCount);
          this.loadPage();
          return;
        }
        this.requests.set(result.items);
        this.filteredTotal.set(result.total);
        this.totalPages.set(pageCount);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.pageError.set(this.requestErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  private loadStatusCounts(): void {
    const queries = this.statuses.map(status => this.service.listAdminPage({ status, page: 1, limit: 1 }));
    forkJoin([this.service.listAdminPage({ page: 1, limit: 1 }), ...queries]).subscribe({
      next: ([all, ...counts]) => {
        const statusCounts = Object.fromEntries(this.statuses.map((status, index) => [status, counts[index].total])) as Record<RequestStatus, number>;
        this.statusCounts.set({ ...statusCounts, total: all.total });
      },
      error: (error: unknown) => this.pageError.set(this.requestErrorMessage(error))
    });
  }

  private requestErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Sign in with an administrator account to view requests.';
    }
    if (error instanceof HttpErrorResponse && error.status === 403) return 'Your account is not allowed to manage requests.';
    return 'Live request data is unavailable. Check the backend connection and try again.';
  }

  private action(request: AssetRequest, operation: (id: string) => ReturnType<RequestService['approve']>, success: string): void {
    if (!confirm(`${success}?`)) return;
    this.busyId.set(request.id);
    this.message.set('');
    operation(request.id).pipe(finalize(() => this.busyId.set(null))).subscribe({
      next: () => {
        this.message.set(`${success}.`);
        this.messageType.set('success');
        this.loadPage();
      },
      error: () => {
        this.message.set('The request could not be updated.');
        this.messageType.set('error');
      }
    });
  }

  protected approve(request: AssetRequest): void { this.action(request, id => this.service.approve(id), 'Request approved'); }
  protected reject(request: AssetRequest): void {
    const reason = window.prompt('Enter a reason for rejecting this request.')?.trim();
    if (!reason) return;
    this.action(request, id => this.service.reject(id, reason), 'Request rejected');
  }
  protected checkout(request: AssetRequest): void { this.action(request, id => this.service.checkout(id), 'Request checked out'); }
  protected returnRequest(request: AssetRequest): void { this.action(request, id => this.service.returnAsset(id), 'Request marked returned'); }

  protected initials(name?: string | null): string {
    return name?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'AD';
  }

  protected statusLabel(status: string): string {
    return status.toLowerCase().split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  protected countFor(status: RequestStatus): number | '—' {
    return this.statusCounts()?.[status] ?? '—';
  }

  protected trendLabel(status: TrendStatus): string | null {
    const currentMonth = this.monthKey(new Date());
    const previousDate = new Date();
    previousDate.setUTCDate(1);
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    const previousMonth = this.monthKey(previousDate);
    const activity = this.requestActivity();
    const current = activity.find(entry => entry.month === currentMonth);
    const previous = activity.find(entry => entry.month === previousMonth);
    if (!current && !previous) return null;
    const change = (current?.[status] ?? 0) - (previous?.[status] ?? 0);
    const indicator = change > 0 ? '↑' : change < 0 ? '↓' : '→';
    return `${indicator} ${change > 0 ? '+' : ''}${change} vs last month`;
  }

  private monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object' && 'message' in error.error && typeof error.error.message === 'string') {
      return error.error.message;
    }
    return fallback;
  }

  protected statusDotClass(status: RequestStatus): string {
    return `status-dot ${status.toLowerCase().replace('_', '-')}-dot`;
  }

  protected statusIcon(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.PENDING: return 'pi-clock';
      case RequestStatus.APPROVED: return 'pi-check-circle';
      case RequestStatus.REJECTED: return 'pi-times-circle';
      case RequestStatus.CHECKED_OUT: return 'pi-exclamation-circle';
      case RequestStatus.RETURNED: return 'pi-replay';
      case RequestStatus.OVERDUE: return 'pi-calendar-plus';
    }
  }
}
