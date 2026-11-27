import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Role } from '../../../core/models';
import { AuthStore } from '../../auth/data-access/auth.store';

@Component({
  selector: 'jhub-innovation-support-embedded-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="innovation-shell">
      <div id="root"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: calc(100dvh - 72px);
    }

    .innovation-shell {
      --font-sans: var(--font);
      --default-font-family: var(--font);
      width: 100%;
      min-height: calc(100dvh - 72px);
      background: #edf3fb;
      font-family: var(--font) !important;
    }

    :host ::ng-deep .jhub-innovator-support-card-hidden {
      display: none !important;
    }

    :host ::ng-deep .innovation-shell,
    :host ::ng-deep .innovation-shell * {
      font-family: var(--font) !important;
    }

    @media (max-width: 1024px) {
      :host ::ng-deep .innovation-shell,
      :host ::ng-deep .innovation-shell main,
      :host ::ng-deep .innovation-shell section,
      :host ::ng-deep .innovation-shell article,
      :host ::ng-deep .innovation-shell aside {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }

      :host ::ng-deep .innovation-shell [data-node-id],
      :host ::ng-deep .innovation-shell [class*='grid'],
      :host ::ng-deep .innovation-shell [class*='flex'] {
        max-width: 100% !important;
        min-width: 0 !important;
      }

      :host ::ng-deep .innovation-shell [data-node-id] {
        position: relative !important;
        left: auto !important;
        right: auto !important;
      }

      :host ::ng-deep .innovation-shell [class*='grid-cols'] {
        grid-template-columns: minmax(0, 1fr) !important;
      }

      :host ::ng-deep .innovation-shell [class*='flex'] {
        flex-wrap: wrap;
      }

      :host ::ng-deep .innovation-shell table,
      :host ::ng-deep .innovation-shell [class*='overflow-x'] {
        display: block;
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
      }
    }

    @media (max-width: 640px) {
      :host {
        min-height: calc(100dvh - 64px);
      }

      :host ::ng-deep .innovation-shell {
        min-height: calc(100dvh - 64px);
        overflow-x: hidden;
      }

      :host ::ng-deep .innovation-shell main {
        width: 100%;
        padding: 12px !important;
      }

      :host ::ng-deep .innovation-shell section,
      :host ::ng-deep .innovation-shell div[class*='rounded'] {
        min-width: 0;
      }

      :host ::ng-deep .innovation-shell h1 {
        font-size: 1.75rem !important;
        line-height: 1.15 !important;
        overflow-wrap: anywhere;
      }

      :host ::ng-deep .innovation-shell h2 {
        font-size: 1.125rem !important;
        overflow-wrap: anywhere;
      }

      :host ::ng-deep .innovation-shell header,
      :host ::ng-deep .innovation-shell nav,
      :host ::ng-deep .innovation-shell form,
      :host ::ng-deep .innovation-shell [class*='flex'] {
        width: 100%;
        min-width: 0;
        flex-wrap: wrap;
      }

      :host ::ng-deep .innovation-shell input,
      :host ::ng-deep .innovation-shell select,
      :host ::ng-deep .innovation-shell textarea,
      :host ::ng-deep .innovation-shell button {
        max-width: 100%;
      }

      :host ::ng-deep .innovation-shell button {
        white-space: normal;
        overflow-wrap: anywhere;
      }

      :host ::ng-deep .innovation-shell table {
        display: block;
        max-width: 100%;
        overflow-x: auto;
        white-space: nowrap;
      }
    }

    :host ::ng-deep .innovation-shell button[class*='bg-[#0e3d9e'],
    :host ::ng-deep .innovation-shell button[class*='bg-[#0f4fc4'],
    :host ::ng-deep .innovation-shell button[class*='bg-blue'] {
      color: #fff !important;
    }

    :host ::ng-deep .innovation-shell button[class*='bg-[#0e3d9e'] *,
    :host ::ng-deep .innovation-shell button[class*='bg-[#0f4fc4'] *,
    :host ::ng-deep .innovation-shell button[class*='bg-blue'] * {
      color: #fff !important;
    }

    :host ::ng-deep .innovation-shell header button,
    :host ::ng-deep .innovation-shell nav button {
      font-weight: 700 !important;
    }
  `
})
export class InnovationSupportEmbeddedPageComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthStore);
  private stylesheet?: HTMLLinkElement;
  private script?: HTMLScriptElement;
  private originalFetch?: typeof window.fetch;
  private observer?: MutationObserver;
  private supportRefreshChannel?: BroadcastChannel;
  private supportRefreshTimer?: number;
  private lastSupportSignature = '';

  private supportFilters: { status?: string; category?: string; priority?: string; dateFrom?: string; dateTo?: string } = {};

  ngOnInit(): void {
    window.addEventListener('jhub-support-search', this.supportSearchHandler);
    window.addEventListener('storage', this.supportStorageHandler);

    this.originalFetch = window.fetch.bind(window);
    this.setupSupportRefresh();
    const token = localStorage.getItem('jhub_access_token');

    if (token) {
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const headers = new Headers(init?.headers);
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

        let nextInput = input;
        if (url.includes('/api/innovation-hub/requests') && (!init?.method || init.method === 'GET')) {
          const separator = url.includes('?') ? '&' : '?';
          const params = new URLSearchParams();
          if (this.supportFilters.status) params.set('status', this.supportFilters.status);
          if (this.supportFilters.category) params.set('category', this.supportFilters.category);
          if (this.supportFilters.priority) params.set('priority', this.supportFilters.priority);
          if (this.supportFilters.dateFrom) params.set('dateFrom', this.supportFilters.dateFrom);
          if (this.supportFilters.dateTo) params.set('dateTo', this.supportFilters.dateTo);
          nextInput = `${url}${params.size ? separator + params.toString() : ''}`;
        }

        if (url.includes('/api/innovation-hub/requests') && init?.method === 'POST' && typeof init.body === 'string') {
          try {
            const body = JSON.parse(init.body);
            delete body.country;
            delete body.slaDeadline;
            delete body.targetDeliveryWindow;
            delete body.priority;
            delete body.urgencyReason;
            delete body.urgencyJustification;
            const categoryDetails: Record<string, string> = {};
            document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-jhub-support-field]').forEach(field => {
              if (field.value.trim()) categoryDetails[field.dataset['jhubSupportField']!] = field.value.trim();
            });
            body.categoryDetails = categoryDetails;
            init = { ...init, body: JSON.stringify(body), headers };
            return this.originalFetch!(nextInput, init).then(response => {
              if (response.ok) this.notifySupportRequestCreated();
              return response;
            });
          } catch {}
        }
        return this.originalFetch!(nextInput, { ...init, headers });
      }) as typeof window.fetch;
    }

    this.stylesheet = document.createElement('link');
    this.stylesheet.rel = 'stylesheet';
    this.stylesheet.href = '/assets/innovation-support/assets/index-DGllcl_R.css';
    document.head.appendChild(this.stylesheet);

    this.script = document.createElement('script');
    this.script.type = 'module';
    this.script.crossOrigin = 'anonymous';
    this.script.src = '/assets/innovation-support/assets/index-C7_qlAK_.js';
    this.script.onload = () => window.requestAnimationFrame(() => this.adaptInnovatorSupportView());
    document.body.appendChild(this.script);

    this.observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => this.adaptInnovatorSupportView());
    });
    this.observer.observe(document.querySelector('.innovation-shell')!, { childList: true, subtree: true });
    this.adaptInnovatorSupportView();
  }

  ngOnDestroy(): void {
    window.removeEventListener('jhub-support-search', this.supportSearchHandler);
    window.removeEventListener('storage', this.supportStorageHandler);
    if (this.supportRefreshTimer) window.clearInterval(this.supportRefreshTimer);
    this.supportRefreshChannel?.close();
    document.querySelectorAll('.jhub-innovator-support-card-hidden').forEach(element => {
      element.classList.remove('jhub-innovator-support-card-hidden');
    });
    if (this.originalFetch) window.fetch = this.originalFetch;
    this.stylesheet?.remove();
    this.script?.remove();
    this.observer?.disconnect();
  }

  private setupSupportRefresh(): void {
    if ('BroadcastChannel' in window) {
      this.supportRefreshChannel = new BroadcastChannel('jhub-support-refresh');
      this.supportRefreshChannel.onmessage = () => this.refreshAdminSupportQueue();
    }

    const role = this.auth.user()?.role;
    if (role !== Role.ADMIN) return;
    void this.checkAdminSupportQueue();
    this.supportRefreshTimer = window.setInterval(() => void this.checkAdminSupportQueue(), 10000);
  }

  private notifySupportRequestCreated(): void {
    const timestamp = String(Date.now());
    localStorage.setItem('jhub-support-request-created', timestamp);
    this.supportRefreshChannel?.postMessage({ timestamp });
  }

  private supportStorageHandler = (event: StorageEvent): void => {
    if (event.key === 'jhub-support-request-created') this.refreshAdminSupportQueue();
  };

  private refreshAdminSupportQueue(): void {
    if (this.auth.user()?.role !== Role.ADMIN) return;
    window.setTimeout(() => window.location.reload(), 150);
  }

  private async checkAdminSupportQueue(): Promise<void> {
    if (this.auth.user()?.role !== Role.ADMIN) return;
    try {
      const response = await this.originalFetch!('/api/innovation-hub/requests', { headers: { Authorization: `Bearer ${localStorage.getItem('jhub_access_token')}` } });
      if (!response.ok) return;
      const payload = await response.json();
      const requests = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      const signature = requests.map((request: { id: string; status: string; updatedAt: string }) => `${request.id}:${request.status}:${request.updatedAt}`).join('|');
      if (this.lastSupportSignature && signature !== this.lastSupportSignature) this.refreshAdminSupportQueue();
      this.lastSupportSignature = signature;
    } catch {
      // Keep the existing queue visible if a refresh check fails.
    }
  }

  private adaptInnovatorSupportView(): void {
    const shell = document.querySelector('.innovation-shell');
    if (!shell) return;

    const user = this.auth.user();
    if (user) {
      const displayName = user.fullName?.trim().split(/\s+/)[0] || user.fullName?.trim() || 'User';
      shell.querySelectorAll('h1').forEach(heading => {
        if (/^Hello,\s*.+$/i.test(heading.textContent?.trim() ?? '')) {
          heading.textContent = `Hello, ${displayName}`;
        }
      });
    }

    const role = user?.role;
    if (role === Role.ADMIN) {
      shell.querySelectorAll('button').forEach(button => {
        const text = button.textContent?.trim() ?? '';
        if (["Create request", "New request", "Create support request", "Go to create request", "Go to Create request", "Submit request"].includes(text)) {
          (button as HTMLElement).style.display = 'none';
        }
      });
      shell.querySelectorAll('h1').forEach(heading => {
        if (heading.textContent?.trim() === 'Create a support request') {
          const page = heading.closest('main');
          if (page) (page as HTMLElement).style.display = 'none';
        }
      });
    }

    this.adaptSupportFormAndQueue(shell, role);

    if (role !== Role.INNOVATOR) return;

    shell.querySelectorAll(':scope main > section > .mt-8.grid').forEach(element => {
      element.classList.add('jhub-innovator-support-card-hidden');
    });

    shell.querySelectorAll('button').forEach(button => {
      const text = button.textContent?.trim() ?? '';
      if (text === 'Overview') (button as HTMLElement).style.display = 'none';
      if (text === 'Go to overview' || text === 'Go to Overview') {
        button.textContent = 'Go to create request';
        if (!button.dataset['jhubCreateRequest']) {
          button.dataset['jhubCreateRequest'] = 'true';
          button.addEventListener('click', () => {
            const createRequestButton = Array.from(shell.querySelectorAll('button')).find(candidate => candidate.textContent?.trim() === 'Create request');
            createRequestButton?.click();
          }, true);
        }
      }
      if (text === 'Submit review') (button as HTMLElement).style.display = 'none';
    });

    shell.querySelectorAll('h1,h2,h3,p,a,span,div').forEach(element => {
      if (element.childElementCount === 0 && element.textContent?.includes('Innovation Support Hub')) {
        element.textContent = element.textContent.replaceAll('Innovation Support Hub', 'Support Hub');
      }
    });
  }

  private adaptSupportFormAndQueue(shell: Element, role: Role | undefined): void {
    shell.querySelectorAll('label').forEach(label => {
      if (/Country/i.test(label.textContent ?? '')) {
        (label as HTMLElement).style.display = 'none';
        const grid = label.closest('.grid') as HTMLElement | null;
        if (grid) grid.style.gridTemplateColumns = 'minmax(0, 1fr)';
      }
    });

    const createHeading = Array.from(shell.querySelectorAll('h1')).find(heading => heading.textContent?.trim() === 'Create a support request');
    if (createHeading) {
      const main = createHeading.closest('main');
      const selects = main ? Array.from(main.querySelectorAll<HTMLSelectElement>('select')) : [];
      const categorySelect = selects.find(select => Array.from(select.options).some(option => option.value === 'BUG_FIX_ERROR_REPORT'));
      if (categorySelect) {
        const categories = [
          ['COMPUTE_AI', 'Compute & AI'], ['DATA_RESEARCH', 'Data & Research'],
          ['MENTORSHIP_DOMAIN_EXPERTISE', 'Mentorship & Domain Expertise'], ['FIELD_VALIDATION', 'Field Validation'],
          ['TECHNICAL_DEVELOPMENT', 'Technical Development'], ['PRODUCT_BUSINESS_SUPPORT', 'Product & Business Support']
        ] as const;
        Array.from(categorySelect.options).forEach(option => {
          if (option.value && !categories.some(([value]) => value === option.value)) {
            option.remove();
          }
        });
        categories.forEach(([value, label]) => {
          if (!Array.from(categorySelect.options).some(option => option.value === value)) {
            categorySelect.add(new Option(label, value));
          }
        });

        if (!main?.querySelector('[data-jhub-category-fields]')) {
          const container = document.createElement('div');
          container.dataset['jhubCategoryFields'] = 'true';
          container.className = 'mt-4 grid gap-3 sm:grid-cols-2';
          main?.appendChild(container);
          const updateFields = () => {
            const category = categorySelect.value;
            const fieldMap: Record<string, string[]> = {
              COMPUTE_AI: ['Workload purpose', 'Framework', 'CPU/GPU requirements', 'Storage', 'Expected duration'],
              DATA_RESEARCH: ['Research questions', 'Dataset formats', 'Volume estimates', 'Privacy/consent plan'],
              MENTORSHIP_DOMAIN_EXPERTISE: ['Technical/business domain', 'Specific questions', 'Session format'],
              FIELD_VALIDATION: ['Target location', 'Research objectives', 'Participant count', 'Logistics needs'],
              TECHNICAL_DEVELOPMENT: ['Tech stack', 'Current blocker', 'Reproduction steps', 'Code links'],
              PRODUCT_BUSINESS_SUPPORT: ['Problem validation stage', 'Value proposition', 'Target outcome']
            };
            container.replaceChildren();
            (fieldMap[category] ?? []).forEach(label => {
              const wrap = document.createElement('label');
              wrap.className = 'text-sm text-slate-700';
              const span = document.createElement('span');
              span.textContent = label;
              const input = document.createElement('input');
              input.className = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2';
              input.dataset['jhubSupportField'] = label;
              wrap.append(span, input);
              container.appendChild(wrap);
            });
          };
          categorySelect.addEventListener('change', updateFields);
          updateFields();
        }
      }
    }

    if (role === Role.ADMIN) {
      const queueHeading = Array.from(shell.querySelectorAll('h1')).find(heading => heading.textContent?.trim() === 'Triage queue');
      const queueMain = queueHeading?.closest('main');
      if (queueMain && !queueMain.querySelector('[data-jhub-support-filters]')) {
        const filters = document.createElement('div');
        filters.dataset['jhubSupportFilters'] = 'true';
        filters.className = 'mb-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5';
        const makeSelect = (label: string, options: string[]) => {
          const select = document.createElement('select');
          select.setAttribute('aria-label', label);
          select.className = 'rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm';
          select.add(new Option(`All ${label.toLowerCase()}s`, ''));
          options.forEach(option => select.add(new Option(option, option.toUpperCase().replace(/ /g, '_'))));
          return select;
        };
        const status = makeSelect('Status', ['Submitted', 'Under Review', 'Needs Info', 'Approved', 'Assigned', 'In Progress', 'Completed', 'Closed', 'Deferred', 'Declined']);
        const category = makeSelect('Category', ['Compute AI', 'Data Research', 'Mentorship Domain Expertise', 'Field Validation', 'Technical Development', 'Product Business Support']);
        const priority = makeSelect('Priority', ['Urgent', 'High', 'Medium', 'Low']);
        const dateFrom = document.createElement('input'); dateFrom.type = 'date'; dateFrom.setAttribute('aria-label', 'Date from'); dateFrom.className = 'rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm';
        const dateTo = document.createElement('input'); dateTo.type = 'date'; dateTo.setAttribute('aria-label', 'Date to'); dateTo.className = 'rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm';
        filters.append(status, category, priority, dateFrom, dateTo);
        queueHeading?.parentElement?.after(filters);
        const reload = () => {
          this.supportFilters = { status: status.value || undefined, category: category.value || undefined, priority: priority.value || undefined, dateFrom: dateFrom.value || undefined, dateTo: dateTo.value || undefined };
          const input = shell.querySelector<HTMLInputElement>('input[type="search"]');
          if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
        };
        filters.querySelectorAll('select,input').forEach(control => control.addEventListener('change', reload));
      }
    }

    shell.querySelectorAll('label').forEach(label => {
      if (/Timeline\s*\/\s*Deadline|Timeline|Deadline/i.test(label.textContent ?? '')) {
        (label as HTMLElement).style.display = 'none';
      }
    });
    shell.querySelectorAll('span,div').forEach(element => {
      if (element.childElementCount === 0 && /^Add timeline or deadline$/i.test(element.textContent?.trim() ?? '')) {
        (element.closest('.flex.items-center.gap-3') as HTMLElement | null)?.remove();
      }
    });

    shell.querySelectorAll('label').forEach(label => {
      if (/Priority/i.test(label.textContent ?? '') || /Urgency Reason|Justification/i.test(label.textContent ?? '')) {
        (label as HTMLElement).style.display = 'none';
      }
    });
    shell.querySelectorAll('div').forEach(element => {
      if (element.childElementCount > 0 && /^Urgent review$/i.test(element.querySelector(':scope > div')?.textContent?.trim() ?? '')) {
        (element as HTMLElement).style.display = 'none';
      }
      if (element.childElementCount === 0 && /^Urgent review$/i.test(element.textContent?.trim() ?? '')) {
        const panel = element.closest('div.space-y-4') as HTMLElement | null;
        panel?.remove();
      }
    });

    shell.querySelectorAll('input[type="file"]').forEach(input => {
      const dropZone = input.nextElementSibling as HTMLElement | null;
      (input as HTMLElement).style.display = 'none';
      dropZone?.remove();
    });
    shell.querySelectorAll('div,span').forEach(element => {
      if (element.childElementCount === 0 && /Drag and drop files here|browse for attachments/i.test(element.textContent?.trim() ?? '')) {
        (element.closest('div[class*="cursor-pointer"]') as HTMLElement | null)?.remove();
      }
      if (element.childElementCount === 0 && /^Attach supporting files$/i.test(element.textContent?.trim() ?? '')) {
        (element.closest('.flex.items-center.gap-3') as HTMLElement | null)?.remove();
      }
    });

    shell.querySelectorAll('h2').forEach(heading => {
      if (heading.textContent?.trim() !== 'Checklist') return;
      const aside = heading.closest('aside');
      if (!aside) return;
      let number = 1;
      aside.querySelectorAll('div.flex.items-center.gap-3').forEach(row => {
        const badge = row.querySelector<HTMLElement>('span.flex.h-6.w-6');
        if (badge) {
          badge.textContent = String(number++);
        }
      });
    });

    shell.querySelectorAll('div,span,p').forEach(element => {
      if (/^Estimated triage time:\s*1 business day$/i.test(element.textContent?.trim() ?? '')) {
        const card = element.closest('div.rounded-xl') as HTMLElement | null;
        (card ?? element).remove();
      }
    });
  }

  private supportSearchHandler = (event: Event): void => {
    const detail = (event as CustomEvent<string>).detail ?? '';
    const shell = document.querySelector('.innovation-shell');
    const input = shell?.querySelector<HTMLInputElement>('input[type="search"]');
    if (!input) return;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, detail);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
}
