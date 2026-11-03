import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import { AdminService } from '../core/api.service';
import { User } from '../core/models';

@Component({
  selector: 'jhub-admin-users-page',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="users-page page-width">

      <!-- HEADER -->
      <div class="heading">

        <div>

          <p class="eyebrow">
            ADMINISTRATION / USERS
          </p>

          <h1>
            Innovator <em>directory.</em>
          </h1>

          <p>
            Accounts currently registered with the Vault.
          </p>

        </div>

      </div>


      <!-- LOADING -->
      @if (loading()) {

        <div class="state">
          Loading users…
        </div>

      }

      <!-- ERROR -->
      @else if (error()) {

        <div
          class="state error"
          role="alert">

          {{ error() }}

        </div>

      }

      <!-- EMPTY -->
      @else if (!users().length) {

        <div class="state">

          No users are registered yet.

        </div>

      }

      <!-- USERS -->
      @else {

        <section class="user-list">

          <!-- HEADER ROW -->
          <div class="user-header">

            <span>
              USER
            </span>

            <span>
              ROLE
            </span>

            <span>
              REGISTERED
            </span>

          </div>


          <!-- USER ROWS -->
          @for (
            user of users();
            track user.id
          ) {

            <article class="user-row">

              <div class="user-details">

                <strong>
                  {{ user.fullName }}
                </strong>

                <small>
                  {{ user.email }}
                </small>

                <small>
                  ID: {{ user.identificationId }}
                </small>

              </div>


              <span
                class="role"
                [class.admin]="user.role === 'ADMIN'"
                [class.innovator]="user.role === 'INNOVATOR'">

                {{ user.role }}

              </span>


              <span class="date">

                {{ user.createdAt | date:'d MMM yyyy' }}

              </span>

            </article>

          }

        </section>

      }

    </main>
  `,

  styles: [`

    :host {
      display: block;
    }


    /* PAGE */

    .page-width {
      width: min(
        1100px,
        calc(100% - 48px)
      );

      margin: 0 auto;
    }


    .users-page {
      padding: 60px 0 110px;
    }


    /* HEADER */

    .heading {
      margin-bottom: 32px;
    }


    .eyebrow {
      color: #3ea945;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 2px;
      margin: 0 0 16px;
    }


    .heading h1 {
      font:
        400
        clamp(42px, 5vw, 60px)
        / 1.05
        Georgia,
        serif;

      color: #262571;
      margin: 0;
    }


    .heading h1 em {
      color: #3ea945;
      font-style: italic;
    }


    .heading p:last-child {
      color: #667083;
      font-size: 13px;
      margin-top: 12px;
    }


    /* STATES */

    .state {
      background: #fff;
      border: 1px solid #e6e8ee;
      padding: 35px;
      color: #667083;
      font-size: 12px;
    }


    .state.error {
      color: #a51f20;
      border-color: #efd0d0;
      background: #fffafa;
    }


    /* USER LIST */

    .user-list {
      background: #fff;
      border: 1px solid #e6e8ee;
    }


    /* HEADER */

    .user-header {
      display: grid;

      grid-template-columns:
        2fr
        1fr
        1fr;

      gap: 20px;

      padding: 13px 24px;

      background: #f7f8fa;

      border-bottom:
        1px solid
        #e6e8ee;

      color: #7c8492;

      font-size: 9px;

      font-weight: 800;

      letter-spacing: 1.5px;
    }


    /* USER */

    .user-row {
      display: grid;

      grid-template-columns:
        2fr
        1fr
        1fr;

      align-items: center;

      gap: 20px;

      padding: 20px 24px;

      border-bottom:
        1px solid
        #edf0f4;

      font-size: 12px;

      color: #667083;
    }


    .user-row:last-child {
      border-bottom: 0;
    }


    /* DETAILS */

    .user-details {
      min-width: 0;
    }


    .user-details strong {
      display: block;

      color: #262571;

      font-size: 14px;

      font-weight: 700;

      margin-bottom: 6px;
    }


    .user-details small {
      display: block;

      color: #7c8492;

      font-size: 10px;

      line-height: 1.5;
    }


    /* ROLE */

    .role {
      display: inline-block;

      width: fit-content;

      padding: 6px 9px;

      background: #f1f2f6;

      color: #667083;

      font-size: 9px;

      font-weight: 800;

      letter-spacing: 1px;
    }


    .role.innovator {
      background: #edf8ee;
      color: #3ea945;
    }


    .role.admin {
      background: #eeeeff;
      color: #262571;
    }


    /* DATE */

    .date {
      color: #667083;

      font-size: 11px;
    }


    /* MOBILE */

    @media (max-width: 700px) {

      .page-width {
        width:
          calc(100% - 30px);
      }


      .users-page {
        padding:
          40px 0 80px;
      }


      .user-header {
        display: none;
      }


      .user-row {
        grid-template-columns: 1fr;

        gap: 12px;

        padding: 18px;
      }


      .role {
        width: fit-content;
      }


      .date {
        font-size: 10px;
      }

    }

  `]
})
export class AdminUsersPageComponent {

  private readonly service =
    inject(AdminService);


  protected readonly users =
    signal<User[]>([]);


  protected readonly loading =
    signal(true);


  protected readonly error =
    signal<string | null>(null);


  constructor() {

    this.loadUsers();

  }


  private loadUsers(): void {

    this.loading.set(true);

    this.error.set(null);


    this.service
      .users()
      .subscribe({

        next: users => {

          this.users.set(users);

          this.loading.set(false);

        },


        error: error => {

          console.error(
            'Unable to load users:',
            error
          );

          this.error.set(
            'Unable to load the user directory.'
          );

          this.loading.set(false);

        }

      });

  }

}