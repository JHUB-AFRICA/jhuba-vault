import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  AdminService,
  RequestService,
  AdminDashboard
} from '../core/api.service';

import {
  AssetRequest,
  RequestStatus
} from '../core/models';

@Component({
  selector: 'jhub-admin-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="dashboard page-width">

      <!-- HEADER -->
      <div class="heading">

        <div>
          <p class="eyebrow">
            ADMINISTRATION / OVERVIEW
          </p>

          <h1>
            Vault <em>overview.</em>
          </h1>

          <p>
            Monitor inventory, requests, and active loans.
          </p>
        </div>

        <a
          class="primary-button"
          routerLink="/admin/requests"
        >
          Review requests
          <span>→</span>
        </a>

      </div>


      <!-- LOADING -->
      @if (loading()) {

        <div class="state">
          Loading administration metrics…
        </div>

      }

      <!-- ERROR -->
      @else if (error()) {

        <div
          class="state error"
          role="alert"
        >
          {{ error() }}

          <button
            type="button"
            class="retry-button"
            (click)="reload()"
          >
            Try again
          </button>
        </div>

      }

      <!-- DASHBOARD -->
      @else if (metrics(); as data) {

        <!-- METRICS -->
        <section class="metrics">

          <div class="metric-card">
            <small>TOTAL ASSETS</small>

            <strong>
              {{ data.totalAssets }}
            </strong>

            <a routerLink="/admin/assets">
              Manage assets
            </a>
          </div>


          <div class="metric-card">
            <small>AVAILABLE INVENTORY</small>

            <strong>
              {{ data.availableInventory }}
            </strong>

            <a routerLink="/admin/inventory">
              View inventory
            </a>
          </div>


          <div class="metric-card">
            <small>PENDING REQUESTS</small>

            <strong>
              {{ data.pendingRequests }}
            </strong>

            <a routerLink="/admin/requests">
              Review queue
            </a>
          </div>


          <div class="metric-card">
            <small>ACTIVE CHECKOUTS</small>

            <strong>
              {{ data.checkedOutRequests }}
            </strong>

            <a routerLink="/admin/requests">
              View checkouts
            </a>
          </div>


          <div class="metric-card">
            <small>RETURNED</small>

            <strong>
              {{ data.returnedRequests }}
            </strong>

            <a routerLink="/admin/requests">
              View returned
            </a>
          </div>


          <div class="metric-card">
            <small>OVERDUE</small>

            <strong>
              {{ data.overdueRequests }}
            </strong>

            <a routerLink="/admin/requests">
              View overdue
            </a>
          </div>

        </section>


        <!-- RECENT REQUESTS -->
        <section class="recent">

          <div class="section-heading">

            <div>
              <p class="eyebrow">
                RECENT REQUESTS
              </p>

              <h2>
                Latest activity
              </h2>
            </div>

            <a
              class="arrow-link"
              routerLink="/admin/requests"
            >
              Open queue ↗
            </a>

          </div>


          @if (!requests().length) {

            <div class="empty">
              No requests have been submitted.
            </div>

          }

          @else {

            @for (
              request of requests().slice(0, 5);
              track request.id
            ) {

              <a
                class="request-row"
                [routerLink]="[
                  '/admin/requests',
                  request.id
                ]"
              >

                <span class="request-info">

                  <strong>
                    {{ request.projectName }}
                  </strong>

                  <small>
                    {{ request.innovator?.fullName || 'Unknown requester' }}

                    ·

                    {{ request.createdAt | date:'d MMM yyyy' }}
                  </small>

                </span>


                <span
                  class="status"
                  [class]="request.status.toLowerCase()"
                >
                  {{ request.status }}
                </span>


                <span class="arrow">
                  →
                </span>

              </a>

            }

          }

        </section>


        <!-- QUICK ACTIONS -->
        <section class="quick-actions">

          <p class="eyebrow">
            QUICK ACTIONS
          </p>

          <div class="quick-grid">

            <a
              routerLink="/admin/requests"
              class="quick-card"
            >
              <span>01</span>

              <strong>
                Request queue
              </strong>

              <small>
                Approve, reject and manage requests.
              </small>

              <b>→</b>
            </a>


            <a
              routerLink="/admin/assets"
              class="quick-card"
            >
              <span>02</span>

              <strong>
                Asset management
              </strong>

              <small>
                Add, edit and manage Vault assets.
              </small>

              <b>→</b>
            </a>


            <a
              routerLink="/admin/inventory"
              class="quick-card"
            >
              <span>03</span>

              <strong>
                Inventory
              </strong>

              <small>
                Monitor stock and availability.
              </small>

              <b>→</b>
            </a>

          </div>

        </section>

      }

    </main>
  `,

  styles: [`
    :host {
      display: block;
    }

    .page-width {
      width: min(
        1100px,
        calc(100% - 48px)
      );

      margin: auto;
    }

    .dashboard {
      padding: 60px 0 110px;
    }


    /* HEADER */

    .heading {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 35px;
    }

    .eyebrow {
      color: #3ea945;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      margin: 0 0 16px;
    }

    .heading h1 {
      font: 400 clamp(
        42px,
        5vw,
        60px
      )/1.05 Georgia, serif;

      color: #262571;
      margin: 0;
    }

    .heading h1 em {
      color: #3ea945;
    }

    .heading p:last-child {
      color: #667083;
      font-size: 13px;
    }


    /* BUTTON */

    .primary-button {
      display: inline-flex;
      align-items: center;
      gap: 20px;

      background: #262571;
      color: #fff;

      text-decoration: none;

      padding: 14px 18px;

      font-size: 12px;
      font-weight: 700;
    }

    .primary-button:hover {
      background: #1e1e5c;
    }


    /* METRICS */

    .metrics {
      display: grid;

      grid-template-columns:
        repeat(3, 1fr);

      gap: 12px;

      margin-bottom: 30px;
    }

    .metric-card {
      background: #fff;

      border: 1px solid #e6e8ee;

      padding: 22px;
    }

    .metric-card small,
    .metric-card strong {
      display: block;
    }

    .metric-card small {
      font-size: 10px;
      color: #7c8492;
      letter-spacing: 1px;
    }

    .metric-card strong {
      font: 40px Georgia, serif;
      color: #262571;
      margin: 12px 0;
    }

    .metric-card a {
      color: #262571;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
    }

    .metric-card a:hover {
      color: #3ea945;
    }


    /* RECENT REQUESTS */

    .recent {
      background: #fff;

      border: 1px solid #e6e8ee;

      padding: 25px;
    }

    .section-heading {
      display: flex;
      align-items: end;
      justify-content: space-between;

      gap: 20px;

      margin-bottom: 16px;
    }

    .section-heading h2 {
      font: 30px Georgia, serif;
      color: #262571;
      margin: 0;
    }

    .arrow-link {
      color: #262571;
      text-decoration: none;
      font-size: 12px;
      font-weight: 700;
    }

    .arrow-link:hover {
      color: #3ea945;
    }


    /* REQUEST ROW */

    .request-row {
      display: grid;

      grid-template-columns:
        1fr
        auto
        20px;

      gap: 20px;

      align-items: center;

      padding: 17px 0;

      border-bottom: 1px solid #edf0f4;

      color: #262571;

      text-decoration: none;
    }

    .request-row:last-child {
      border-bottom: 0;
    }

    .request-row strong,
    .request-row small {
      display: block;
    }

    .request-row strong {
      font-size: 14px;
    }

    .request-row small {
      font-size: 10px;
      color: #7c8492;
      margin-top: 5px;
    }

    .request-row:hover strong {
      color: #3ea945;
    }

    .status {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
    }


    /* STATUS COLORS */

    .pending {
      color: #b17b19;
    }

    .approved {
      color: #3ea945;
    }

    .rejected {
      color: #e6292a;
    }

    .checked_out {
      color: #2a4695;
    }

    .returned {
      color: #667083;
    }

    .overdue {
      color: #e6292a;
    }


    /* STATES */

    .empty,
    .state {
      background: #fff;

      border: 1px solid #e6e8ee;

      padding: 30px;

      color: #667083;

      font-size: 12px;
    }

    .state.error {
      color: #a51f20;

      display: flex;
      align-items: center;
      justify-content: space-between;

      gap: 20px;
    }

    .retry-button {
      border: 0;

      background: #262571;
      color: #fff;

      padding: 10px 16px;

      cursor: pointer;

      font-size: 11px;
      font-weight: 700;
    }


    /* QUICK ACTIONS */

    .quick-actions {
      margin-top: 35px;
    }

    .quick-grid {
      display: grid;

      grid-template-columns:
        repeat(3, 1fr);

      gap: 12px;
    }

    .quick-card {
      position: relative;

      display: flex;
      flex-direction: column;

      min-height: 170px;

      padding: 25px;

      background: #262571;

      color: #fff;

      text-decoration: none;
    }

    .quick-card > span {
      color: #89be32;

      font-size: 10px;
      font-weight: 800;

      letter-spacing: 2px;
    }

    .quick-card strong {
      font: 25px Georgia, serif;

      margin-top: 28px;
    }

    .quick-card small {
      color: #d8d9e7;

      font-size: 11px;

      line-height: 1.5;

      margin-top: 8px;
    }

    .quick-card b {
      position: absolute;

      right: 22px;
      bottom: 20px;

      color: #89be32;
    }

    .quick-card:hover {
      background: #1e1e5c;
    }


    /* MOBILE */

    @media (max-width: 700px) {

      .heading,
      .section-heading {
        display: block;
      }

      .heading .primary-button,
      .section-heading .arrow-link {
        display: inline-flex;

        margin-top: 18px;
      }

      .metrics {
        grid-template-columns: 1fr 1fr;
      }

      .quick-grid {
        grid-template-columns: 1fr;
      }

      .request-row {
        grid-template-columns: 1fr auto;
      }

      .request-row > .arrow {
        display: none;
      }

      .state.error {
        display: block;
      }

      .retry-button {
        margin-top: 15px;
      }
    }

    @media (max-width: 480px) {

      .page-width {
        width: min(
          100% - 30px,
          1100px
        );
      }

      .metrics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardPageComponent {

  private readonly adminService =
    inject(AdminService);

  private readonly requestService =
    inject(RequestService);


  protected readonly metrics =
    signal<AdminDashboard | null>(null);


  protected readonly requests =
    signal<AssetRequest[]>([]);


  protected readonly loading =
    signal(true);


  protected readonly error =
    signal<string | null>(null);


  protected readonly RequestStatus =
    RequestStatus;


  constructor() {
    this.loadDashboard();
  }


  protected reload(): void {
    this.loadDashboard();
  }


  private loadDashboard(): void {

    this.loading.set(true);

    this.error.set(null);

    forkJoin({
      metrics: this.adminService.dashboard(),

      requests:
        this.requestService.listAdmin()
    })
    .subscribe({

      next: result => {

        this.metrics.set(
          result.metrics
        );

        this.requests.set(
          result.requests
        );

        this.loading.set(false);
      },

      error: err => {

        console.error(
          'Admin dashboard error:',
          err
        );

        this.error.set(
          err?.error?.message ||
          'Unable to load the administration dashboard.'
        );

        this.loading.set(false);
      }

    });
  }
}