import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthStore } from '../state/auth.store';
import { Role } from '../core/models';
import { BrandLogoComponent } from '../shared/brand-logo.component';

@Component({
  selector: 'jhub-auth-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BrandLogoComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="auth-page" [class.login-only]="mode() !== 'register'">
      <section class="intro-card" aria-label="About the JHUB Africa Vault">
        <div class="brand-row">
          <jhub-brand-logo logo="jhub" variant="auth" />
        </div>

        <div class="intro-copy">
          <h1>JHUB Africa Vault</h1>
          <h2>Hardware Vault</h2>
          <p>Access technology, IoT components and equipment to build your innovations.</p>
        </div>

        <ul class="benefits">
          <li>
            <span class="benefit-icon pi pi-briefcase" aria-hidden="true"></span>
            <span><strong>Innovators &amp; Researchers</strong><small>Access the tools you need</small></span>
          </li>
          <li>
            <span class="benefit-icon pi pi-shield" aria-hidden="true"></span>
            <span><strong>Secure &amp; Accountable</strong><small>Track, manage and return resources</small></span>
          </li>
          <li>
            <span class="benefit-icon pi pi-lightbulb" aria-hidden="true"></span>
            <span><strong>Building Innovation</strong><small>Together for a better tomorrow</small></span>
          </li>
        </ul>

        <div class="workshop-art" role="img" aria-label="Illustration of electronics and tools in an innovation workshop">
          <div class="workshop-shelf"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="workbench">
            <span class="meter"><i></i><b></b></span>
            <span class="scope"><i></i><b></b><b></b><b></b></span>
            <span class="board"><i></i><i></i><i></i><i></i><i></i><i></i></span>
            <span class="laptop"><i></i></span>
          </div>
          <span class="art-caption">IDEAS IN ACTION</span>
          <span class="art-shape"></span>
        </div>
      </section>

      <section class="login-card" aria-label="Sign in">
        <div class="brand-row">
          <jhub-brand-logo logo="jhub" variant="auth" />
        </div>

        <div class="login-heading">
          <h1>{{ mode() === 'register' ? 'Create Account' : mode() === 'admin' ? 'Administrator Sign In' : 'Sign In' }}</h1>
          @if (mode() === 'register') {
            <p>Create your innovator account to request and track JHUB assets.</p>
          }
        </div>

        @if (auth.error()) {
          <div class="form-alert error" role="alert">{{ auth.error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (mode() === 'register') {
            <label>
              Full name <span class="required-mark">*</span>
              <input type="text" formControlName="fullName" placeholder="Your full name" autocomplete="name" />
              @if (invalid('fullName')) { <small>Full name is required.</small> }
            </label>
          }

          <label>
            Email <span class="required-mark">*</span>
            <span class="input-wrap">
              <i class="pi pi-envelope" aria-hidden="true"></i>
              <input type="email" formControlName="email" placeholder="Email address" autocomplete="email" />
            </span>
            @if (invalid('email')) { <small>Enter a valid email address.</small> }
          </label>

          @if (mode() === 'register') {
            <label>
              Phone number <span class="required-mark">*</span>
              <span class="phone-input">
                <span class="country-code">+254</span>
                <input type="tel" formControlName="phoneNumber" placeholder="712345678" maxlength="9" inputmode="numeric" autocomplete="tel-national" />
              </span>
              <span class="phone-help">Enter the 9 digits after +254, starting with 7 or 1.</span>
              @if (invalid('phoneNumber')) { <small>Enter a valid Kenyan phone number (e.g. 712345678). Do not include the leading 0.</small> }
            </label>

            <label>
              Identification / student number <span class="required-mark">*</span>
              <input type="text" formControlName="identificationId" placeholder="Your ID or student number" />
              @if (invalid('identificationId')) { <small>This field is required.</small> }
            </label>
          }

          <label>
            Password <span class="required-mark">*</span>
            <span class="input-wrap">
              <i class="pi pi-lock" aria-hidden="true"></i>
              <input [type]="passwordVisible() ? 'text' : 'password'" formControlName="password" [placeholder]="mode() === 'register' ? 'At least 8 characters' : 'Enter your password'" autocomplete="current-password" />
              @if (mode() !== 'register') {
                <button class="password-toggle" type="button" (click)="passwordVisible.update(visible => !visible)" [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'">
                  <i [class]="passwordVisible() ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true"></i>
                </button>
              }
            </span>
            @if (invalid('password')) { <small>Password must be at least 8 characters.</small> }
          </label>

          <button class="primary-button submit-button" type="submit" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Working…' : mode() === 'register' ? 'Create innovator account' : 'Sign In' }}
            <span class="pi pi-arrow-right" aria-hidden="true"></span>
          </button>
        </form>

        <p class="form-foot">
          {{ mode() === 'register' ? 'Already have an account?' : 'Don’t have an account?' }}
          <a [routerLink]="mode() === 'register' ? '/auth/login' : '/auth/register'">{{ mode() === 'register' ? 'Sign in' : 'Register' }}</a>
        </p>

      </section>
    </main>
  `,

  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--paper);
    }

    .auth-page {
      width: min(1120px, calc(100% - 56px));
      min-height: 100vh;
      margin-inline: auto;
      padding: 28px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 28px;
    }

    .auth-page.login-only {
      width: min(576px, calc(100% - 40px));
      grid-template-columns: minmax(0, 1fr);
      align-content: center;
      justify-content: center;
      padding: 40px 0;
    }

    .login-only .intro-card {
      display: none;
    }

    .intro-card,
    .login-card {
      min-width: 0;
      overflow: hidden;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 14px 28px #17203318;
    }

    .intro-card {
      min-height: 704px;
      display: flex;
      flex-direction: column;
      padding: 38px 36px 0;
    }

    .login-card {
      padding: 42px;
    }

    .login-only .login-card {
      width: 100%;
      padding: 34px 64px 40px;
    }

    .login-only .brand-row {
      justify-content: center;
      min-height: 90px;
    }

    .login-only .brand-row jhub-brand-logo {
      width: 240px;
      justify-content: center;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 18px;
      min-height: 46px;
    }

    .brand-row jhub-brand-logo {
      width: 180px;
      max-width: 100%;
      justify-content: flex-start;
    }

    .intro-copy {
      margin-top: 40px;
    }

    .intro-copy h1,
    .login-heading h1 {
      margin: 0;
      color: var(--navy);
      font-weight: 750;
      letter-spacing: -.04em;
    }

    .intro-copy h1 {
      font-size: clamp(28px, 3vw, 35px);
      line-height: 1.15;
    }

    .intro-copy h2 {
      margin: 6px 0 14px;
      color: var(--navy);
      font-size: 21px;
      letter-spacing: -.02em;
    }

    .intro-copy p,
    .login-heading p {
      margin: 0;
      color: #667083;
      font-size: 14px;
      line-height: 1.55;
    }

    .intro-copy p {
      max-width: 400px;
    }

    .benefits {
      display: grid;
      gap: 14px;
      margin: 24px 0 24px;
      padding: 0;
      list-style: none;
    }

    .benefits li {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #303c50;
      font-size: 12px;
    }

    .benefit-icon {
      display: grid;
      flex: 0 0 36px;
      width: 36px;
      height: 36px;
      place-items: center;
      color: var(--blue);
      background: #f0f4ff;
      border: 1px solid #dce7ff;
      border-radius: 9px;
      font-size: 15px;
    }

    .benefits strong,
    .benefits small {
      display: block;
    }

    .benefits strong {
      font-size: 12px;
    }

    .benefits small {
      margin-top: 3px;
      color: #78849a;
      font-size: 11px;
    }

    .workshop-art {
      position: relative;
      min-height: 225px;
      flex: 1;
      overflow: hidden;
      margin: auto -36px 0;
      background:
        linear-gradient(180deg, transparent 35%, #1720338c 100%),
        linear-gradient(135deg, #d8e2df 0 24%, #a6b1a9 24% 31%, #45535d 31% 33%, #d4d0c5 33% 100%);
    }

    .workshop-art::before {
      position: absolute;
      inset: 0 0 42% 0;
      content: "";
      background:
        repeating-linear-gradient(90deg, transparent 0 50px, #38444c 51px 55px),
        repeating-linear-gradient(0deg, transparent 0 25px, #38444c 26px 30px),
        linear-gradient(90deg, #929b94, #d0cfc0 40%, #6d7775);
      opacity: .88;
    }

    .workshop-shelf {
      position: absolute;
      top: 14px;
      left: 28%;
      width: 60%;
      height: 70px;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
      padding: 8px;
      background: #27313b;
      box-shadow: 0 4px 9px #17203355;
    }

    .workshop-shelf i {
      border: 2px solid #747b7b;
      border-radius: 2px;
      background: repeating-linear-gradient(0deg, #161e25 0 8px, #a3a292 9px 11px);
    }

    .workbench {
      position: absolute;
      right: 0;
      bottom: 34px;
      left: 0;
      height: 62px;
      background: linear-gradient(180deg, #6e7471 0 9px, #282f36 10px 100%);
      box-shadow: 0 9px 18px #17203350;
    }

    .meter,
    .scope,
    .board,
    .laptop {
      position: absolute;
      bottom: 35px;
      display: block;
      border: 3px solid #414a4c;
      border-radius: 4px;
      background: #d7d4c9;
      box-shadow: 0 3px 5px #17203355;
    }

    .meter { left: 9%; width: 40px; height: 66px; }
    .meter i { display: block; height: 24px; margin: 7px 5px; background: #a9c2a1; }
    .meter b { display: block; width: 20px; height: 4px; margin: 0 auto; background: #323b40; }
    .scope { left: 30%; width: 82px; height: 53px; }
    .scope i { display: block; width: 36px; height: 21px; margin: 8px auto; border: 2px solid #536c66; background: repeating-linear-gradient(90deg, #b8d6bc 0 3px, #d7d4c9 4px 7px); }
    .scope b { position: absolute; bottom: 5px; width: 4px; height: 9px; background: #4c5354; }
    .scope b:nth-of-type(1) { left: 13px; }
    .scope b:nth-of-type(2) { left: 37px; }
    .scope b:nth-of-type(3) { right: 13px; }
    .board { left: 50%; width: 100px; height: 44px; background: repeating-linear-gradient(0deg, #315447 0 3px, #659269 4px 5px); }
    .board i { display: inline-block; width: 9px; height: 9px; margin: 7px 2px; background: #d3b74c; }
    .laptop { right: 8%; width: 105px; height: 66px; transform: skewY(-8deg); }
    .laptop i { display: block; height: 42px; margin: 5px; background: #849c9c; }
    .art-caption {
      position: absolute;
      z-index: 1;
      bottom: 18px;
      left: 28px;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    .art-shape {
      position: absolute;
      bottom: -36px;
      left: 14px;
      width: 110px;
      height: 110px;
      border-radius: 18px;
      background: #2a4695c9;
      transform: rotate(35deg);
    }

    .login-heading {
      margin: 38px 0 26px;
    }

    .login-heading h1 {
      font-size: 27px;
      line-height: 1.2;
    }

    .login-heading p {
      margin-top: 6px;
      font-size: 13px;
    }

    .login-card form {
      display: grid;
      gap: 17px;
    }

    .login-card label {
      display: block;
      color: #4f5c70;
      font-size: 11px;
      font-weight: 650;
    }

    .required-mark {
      color: var(--green);
    }

    .login-card input {
      width: 100%;
      height: 42px;
      padding: 0 13px;
      color: var(--ink);
      border: 1px solid #dce2eb;
      border-radius: 10px;
      outline-color: var(--blue);
      font-size: 12px;
    }

    .login-card input::placeholder {
      color: #9aa8bf;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      margin-top: 7px;
    }

    .input-wrap > i {
      position: absolute;
      left: 14px;
      z-index: 1;
      color: #91a1bb;
      font-size: 14px;
    }

    .input-wrap input {
      padding-left: 39px;
    }

    .password-toggle {
      position: absolute;
      right: 8px;
      display: grid;
      width: 30px;
      height: 30px;
      place-items: center;
      color: #91a1bb;
      border: 0;
      background: transparent;
    }

    .password-toggle + input,
    .input-wrap:has(.password-toggle) input {
      padding-right: 42px;
    }

    .login-card small {
      display: block;
      margin-top: 5px;
      color: #e6292a;
      font-size: 10px;
    }

    .phone-input {
      display: flex;
      margin-top: 7px;
    }

    .country-code {
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: var(--navy);
      background: #f3f5f7;
      border: 1px solid #dce2eb;
      border-right: 0;
      border-radius: 8px 0 0 8px;
      font-size: 12px;
    }

    .phone-input input {
      border-radius: 0 8px 8px 0;
    }

    .phone-help {
      display: block;
      margin-top: 5px;
      color: #8d95a3;
      font-size: 10px;
      font-weight: 400;
    }

    .submit-button {
      width: 100%;
      min-height: 44px;
      justify-content: center;
      gap: 10px;
      margin-top: 1px;
      color: #fff;
      background: var(--blue);
      border: 0;
      border-radius: 10px;
      box-shadow: 0 3px 5px #1720332b;
      font-size: 13px;
      font-weight: 650;
    }

    .submit-button:disabled {
      opacity: .6;
      cursor: wait;
    }

    .form-alert {
      padding: 12px;
      margin-bottom: 18px;
      font-size: 12px;
    }

    .form-alert.error {
      color: #a51f20;
      background: #fff0f0;
      border-left: 3px solid #e6292a;
    }

    .form-foot {
      margin: 27px 0 30px;
      color: #78849a;
      font-size: 11px;
      text-align: center;
    }

    .form-foot a {
      margin-left: 5px;
      color: var(--blue);
      font-weight: 750;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 18px;
      color: #91a0b7;
      border-top: 1px solid #edf0f4;
      font-size: 10px;
    }

    .card-footer > span,
    .powered-by {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    @media (max-width: 760px) {
      .auth-page {
        width: min(100% - 32px, 540px);
        grid-template-columns: 1fr;
        gap: 18px;
        padding: 16px 0;
      }

      .auth-page.login-only {
        width: min(100% - 32px, 576px);
        min-height: 100vh;
        align-content: center;
        padding: 24px 0;
      }

      .intro-card {
        min-height: 0;
        padding: 28px 24px 0;
      }

      .workshop-art {
        min-height: 180px;
        margin-inline: -24px;
      }

      .login-card {
        padding: 30px 24px;
      }

      .login-only .login-card {
        padding: 30px 40px;
      }
    }

    @media (max-width: 420px) {
      .auth-page {
        width: min(100% - 20px, 540px);
      }

      .intro-card {
        padding-inline: 20px;
      }

      .workshop-art {
        margin-inline: -20px;
      }

      .login-card {
        padding: 26px 20px;
      }

      .login-only .login-card {
        padding: 26px 24px;
      }

      .brand-row {
        gap: 12px;
      }

      .brand-row jhub-brand-logo {
        width: 160px;
      }

      .card-footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `]
})
export class AuthPageComponent {

  protected readonly auth = inject(AuthStore);

  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  protected readonly Role = Role;
  protected readonly passwordVisible = signal(false);

  protected readonly mode = computed(() => {
    const url = this.router.url;

    if (url.includes('register')) {
      return 'register';
    }

    if (url.includes('/admin/')) {
      return 'admin';
    }

    return 'login';
  });

  protected readonly form = this.fb.nonNullable.group({

    fullName: [
      '',
      [
        Validators.required,
        Validators.minLength(2)
      ]
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    phoneNumber: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[17]\d{8}$/)
      ]
    ],

    identificationId: [
      '',
      Validators.required
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ]

  });

  protected invalid(field: string): boolean {

    const control =
      this.form.controls[
        field as keyof typeof this.form.controls
      ];

    return control.invalid &&
      (control.dirty || control.touched);
  }

  protected submit(): void {

    this.form.markAllAsTouched();

    const values = this.form.getRawValue();

    /*
     * Login only needs email + password.
     *
     * This is important because registration-only
     * validators must never block login.
     */
    const loginInvalid =
      this.form.controls.email.invalid ||
      this.form.controls.password.invalid;

    if (
      this.mode() === 'register'
        ? this.form.invalid
        : loginInvalid
    ) {
      return;
    }

    if (this.mode() === 'register') {

      this.auth.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phoneNumber: this.toInternationalPhone(values.phoneNumber),
        identificationId: values.identificationId
      });

    } else {

      this.auth.signIn({
        email: values.email,
        password: values.password
      });

    }
  }

  private toInternationalPhone(phone: string): string {
    return `+254${phone}`;
  }
}