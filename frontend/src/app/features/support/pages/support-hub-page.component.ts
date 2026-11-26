import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../../core/api.service';
import { Role, SupportCategory, SupportProject, SupportRequest, SupportStatus, SupportUpdateKind, SupportUpdateVisibility } from '../../../core/models';
import { AuthStore } from '../../auth/data-access/auth.store';

interface SupportTopic {
  id: string;
  category: SupportCategory;
  icon: string;
  title: string;
  description: string;
  examples: string;
}

interface SupportQuestion {
  id: number;
  topicId: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'jhub-support-hub-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './support-hub-page.component.html',
  styleUrl: './support-hub-page.component.css'
})
export class SupportHubPageComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly supportService = inject(SupportService);
  protected readonly isAdmin = computed(() => this.auth.isAdmin());

  protected readonly topics: SupportTopic[] = [
    { id: 'compute-ai', category: SupportCategory.COMPUTE_AI, icon: 'pi-bolt', title: 'Compute & AI', description: 'Plan the computing power and tools for your work.', examples: 'Workloads, frameworks, CPU or GPU needs, storage and duration' },
    { id: 'data-research', category: SupportCategory.DATA_RESEARCH, icon: 'pi-database', title: 'Data & Research', description: 'Get help planning research questions and data needs.', examples: 'Data formats, volume estimates, privacy and consent' },
    { id: 'mentorship', category: SupportCategory.MENTORSHIP, icon: 'pi-users', title: 'Mentorship & Expertise', description: 'Connect with technical or business expertise.', examples: 'Domain questions, review sessions and mentorship format' },
    { id: 'field-validation', category: SupportCategory.FIELD_VALIDATION, icon: 'pi-map-marker', title: 'Field Validation', description: 'Prepare to test an idea with people in the field.', examples: 'Target locations, participants, research goals and logistics' },
    { id: 'technical-development', category: SupportCategory.TECHNICAL_DEVELOPMENT, icon: 'pi-code', title: 'Technical Development', description: 'Work through a development blocker with a specialist.', examples: 'Tech stack, reproduction steps, code links and blockers' },
    { id: 'product-business', category: SupportCategory.PRODUCT_BUSINESS, icon: 'pi-chart-line', title: 'Product & Business', description: 'Shape your product direction and business case.', examples: 'Problem validation, value proposition and target outcomes' }
  ];

  protected readonly questions: SupportQuestion[] = [
    { id: 1, topicId: 'compute-ai', question: 'What should I include in a compute or AI support request?', answer: 'Describe what you want to run, the framework or tools you plan to use, your expected CPU or GPU needs, storage estimate and how long you expect the work to take.' },
    { id: 2, topicId: 'data-research', question: 'Can I ask for help with research data planning?', answer: 'Yes. Explain your research question, the data format and approximate volume, and any privacy, consent or access requirements that may apply.' },
    { id: 3, topicId: 'mentorship', question: 'What kind of mentorship can I request?', answer: 'You can describe the technical or business area where you need guidance, the questions you want to discuss and whether you prefer a one-to-one session or another format.' },
    { id: 4, topicId: 'field-validation', question: 'What details help plan a field validation activity?', answer: 'Include the location or community you want to reach, what you want to learn, the number of participants and any practical logistics you already know about.' },
    { id: 5, topicId: 'technical-development', question: 'How can I make a technical support request easier to review?', answer: 'Share the technology stack, what you expected to happen, what happened instead, steps to reproduce the issue and a code link if it is safe to share.' },
    { id: 6, topicId: 'product-business', question: 'What should I prepare for product or business support?', answer: 'Summarize the problem you are solving, who experiences it, what you have learned so far, your current validation stage and the outcome you want help reaching.' },
    { id: 7, topicId: 'technical-development', question: 'Should I include passwords or private keys in a code link?', answer: 'No. Remove passwords, access tokens, private keys and personal data before sharing code or evidence.' },
    { id: 8, topicId: 'mentorship', question: 'Can one request cover more than one kind of support?', answer: 'Choose the topic that best matches your main goal, then describe any related needs in the request details so the team can understand the full context.' }
  ];

  protected readonly requests = signal<SupportRequest[]>([]);
  protected readonly projects = signal<SupportProject[]>([]);
  protected readonly activeRequest = signal<SupportRequest | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly search = signal('');
  protected readonly selectedTopic = signal<string | null>(null);
  protected readonly openQuestion = signal<number | null>(null);
  protected readonly adminSearch = signal('');
  protected readonly adminStatusFilter = signal('');
  protected readonly adminCategoryFilter = signal('');
  protected readonly statusDraft = signal<SupportStatus>(SupportStatus.UNDER_REVIEW);
  protected readonly declineReason = signal('');
  protected readonly deferReason = signal('');
  protected readonly deliverySummary = signal('');
  protected readonly actualOutcome = signal('');

  protected draft = {
    category: SupportCategory.TECHNICAL_DEVELOPMENT,
    projectId: '',
    title: '',
    description: '',
    context: ''
  };
  protected replyText = '';
  protected internalOnly = false;

  protected readonly SupportCategory = SupportCategory;
  protected readonly SupportStatus = SupportStatus;
  protected readonly Role = Role;
  protected readonly categoryOptions = this.topics;
  protected readonly statusOptions = Object.values(SupportStatus);

  protected readonly visibleTopics = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) return this.topics;
    return this.topics.filter(topic => `${topic.title} ${topic.description} ${topic.examples}`.toLowerCase().includes(query));
  });

  protected readonly visibleQuestions = computed(() => {
    const query = this.search().trim().toLowerCase();
    const selectedTopic = this.selectedTopic();
    return this.questions.filter(question => {
      const matchesTopic = !selectedTopic || question.topicId === selectedTopic;
      const matchesQuery = !query || `${question.question} ${question.answer}`.toLowerCase().includes(query);
      return matchesTopic && matchesQuery;
    });
  });

  protected readonly visibleRequests = computed(() => {
    const query = this.adminSearch().trim().toLowerCase();
    const status = this.adminStatusFilter();
    const category = this.adminCategoryFilter();
    return this.requests().filter(request => {
      const matchesSearch = !query || `${request.reference} ${request.title} ${request.project.name} ${request.requester.fullName} ${request.requester.email}`.toLowerCase().includes(query);
      return matchesSearch && (!status || request.status === status) && (!category || request.category === category);
    });
  });

  protected readonly newCount = computed(() => this.requests().filter(request => request.status === SupportStatus.SUBMITTED).length);
  protected readonly waitingCount = computed(() => this.requests().filter(request => request.status === SupportStatus.NEEDS_INFORMATION).length);
  protected readonly activeCount = computed(() => this.requests().filter(request => [SupportStatus.IN_PROGRESS, SupportStatus.ASSIGNED].includes(request.status)).length);

  ngOnInit(): void {
    this.loadRequests();
    if (!this.isAdmin()) this.loadProjects();
  }

  protected loadProjects(): void {
    this.supportService.listProjects().subscribe({
      next: projects => {
        this.projects.set(projects);
        if (!projects.some(project => project.id === this.draft.projectId)) this.draft.projectId = projects[0]?.id ?? '';
      },
      error: () => this.error.set('Your active projects could not be loaded. Refresh the page or contact the Vault administrator.')
    });
  }

  protected loadRequests(): void {
    this.loading.set(true);
    this.error.set('');
    const request$ = this.isAdmin() ? this.supportService.listAdmin() : this.supportService.listMine();
    request$.subscribe({
      next: requests => {
        this.requests.set(requests);
        const active = this.activeRequest();
        if (active) this.activeRequest.set(requests.find(request => request.id === active.id) ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Support requests could not be loaded. Check that the server is running and try again.');
        this.loading.set(false);
      }
    });
  }

  protected submitRequest(event: Event): void {
    event.preventDefault();
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    this.supportService.create({
      category: this.draft.category,
      projectId: this.draft.projectId,
      title: this.draft.title.trim(),
      description: this.draft.description.trim(),
      details: this.draft.context.trim() ? { categoryContext: this.draft.context.trim() } : {}
    }).subscribe({
      next: request => {
        this.draft = { category: SupportCategory.TECHNICAL_DEVELOPMENT, projectId: this.projects()[0]?.id ?? '', title: '', description: '', context: '' };
        this.requests.update(requests => [request, ...requests]);
        this.activeRequest.set(request);
        this.notice.set(`Request ${request.reference} was sent to the JHUB support team.`);
        this.busy.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'Your request could not be sent. Please try again.');
        this.busy.set(false);
      }
    });
  }

  protected selectRequest(request: SupportRequest): void {
    this.activeRequest.set(request);
    this.statusDraft.set(request.status);
    this.declineReason.set(request.declineReason ?? '');
    this.deferReason.set(request.deferReason ?? '');
    this.deliverySummary.set(request.deliverySummary ?? '');
    this.actualOutcome.set(request.actualOutcome ?? '');
    this.replyText = '';
    this.notice.set('');
  }

  protected sendReply(): void {
    const request = this.activeRequest();
    const message = this.replyText.trim();
    if (!request || !message) return;
    this.busy.set(true);
    this.error.set('');
    this.supportService.reply(request.id, message, this.isAdmin() && this.internalOnly).subscribe({
      next: updated => {
        this.replaceRequest(updated);
        this.replyText = '';
        this.internalOnly = false;
        this.notice.set(this.isAdmin() ? (updated.updates.at(-1)?.visibility === SupportUpdateVisibility.INTERNAL ? 'Internal note saved.' : 'Reply sent to the innovator.') : 'Your reply was sent to the support team.');
        this.busy.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'The reply could not be sent. Please try again.');
        this.busy.set(false);
      }
    });
  }

  protected saveStatus(): void {
    const request = this.activeRequest();
    if (!request) return;
    const status = this.statusDraft();
    const declineReason = this.declineReason().trim();
    const deferReason = this.deferReason().trim();
    const deliverySummary = this.deliverySummary().trim();
    const actualOutcome = this.actualOutcome().trim();
    if (status === SupportStatus.DECLINED && !declineReason) {
      this.error.set('Add a reason before declining this request.');
      return;
    }
    if (status === SupportStatus.DEFERRED && !deferReason) { this.error.set('Add a reason before deferring this request.'); return; }
    if (status === SupportStatus.COMPLETED && (!deliverySummary || !actualOutcome)) { this.error.set('Add the delivery summary and actual outcome before completing this request.'); return; }
    this.busy.set(true);
    this.error.set('');
    this.supportService.updateStatus(request.id, {
      status,
      ...(status === SupportStatus.DECLINED ? { declineReason } : {}),
      ...(status === SupportStatus.DEFERRED ? { deferReason } : {}),
      ...(status === SupportStatus.COMPLETED ? { deliverySummary, actualOutcome } : {})
    }).subscribe({
      next: updated => {
        this.replaceRequest(updated);
        this.notice.set('Request status updated.');
        this.busy.set(false);
      },
      error: response => {
        this.error.set(response?.error?.message ?? 'The status could not be updated. Check the allowed request steps and try again.');
        this.busy.set(false);
      }
    });
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.openQuestion.set(null);
  }

  protected selectTopic(topicId: string): void { this.selectedTopic.set(topicId); this.openQuestion.set(null); }
  protected clearTopic(): void { this.selectedTopic.set(null); this.openQuestion.set(null); }
  protected toggleQuestion(id: number): void { this.openQuestion.update(current => current === id ? null : id); }
  protected clearNotice(): void { this.notice.set(''); }

  protected categoryLabel(category: SupportCategory): string {
    return this.topics.find(topic => topic.category === category)?.title ?? 'Other support';
  }

  protected statusLabel(status: SupportStatus): string {
    const labels: Record<SupportStatus, string> = {
      [SupportStatus.SUBMITTED]: 'Submitted', [SupportStatus.UNDER_REVIEW]: 'Under review', [SupportStatus.NEEDS_INFORMATION]: 'Needs information',
      [SupportStatus.APPROVED]: 'Approved', [SupportStatus.DECLINED]: 'Declined', [SupportStatus.DEFERRED]: 'Deferred', [SupportStatus.ASSIGNED]: 'Assigned',
      [SupportStatus.IN_PROGRESS]: 'In progress', [SupportStatus.COMPLETED]: 'Completed', [SupportStatus.CLOSED]: 'Closed'
    };
    return labels[status];
  }

  protected categoryPrompt(): string {
    const prompts: Record<SupportCategory, string> = {
      [SupportCategory.COMPUTE_AI]: 'Describe your workload, framework, CPU or GPU needs, storage and expected duration.',
      [SupportCategory.DATA_RESEARCH]: 'Describe the research question, data format and volume, and any privacy or consent needs.',
      [SupportCategory.MENTORSHIP]: 'Describe the domain, questions and kind of mentoring session that would help.',
      [SupportCategory.FIELD_VALIDATION]: 'Describe the target location, research goal, participant count and logistics.',
      [SupportCategory.TECHNICAL_DEVELOPMENT]: 'Describe your tech stack, blocker, steps to reproduce it and a safe code link if available.',
      [SupportCategory.PRODUCT_BUSINESS]: 'Describe the problem, value proposition, validation stage and outcome you want.'
    };
    return prompts[this.draft.category];
  }

  protected statusChoices(request: SupportRequest): SupportStatus[] {
    const transitions: Record<SupportStatus, SupportStatus[]> = {
      [SupportStatus.SUBMITTED]: [SupportStatus.UNDER_REVIEW, SupportStatus.NEEDS_INFORMATION, SupportStatus.APPROVED, SupportStatus.DECLINED, SupportStatus.DEFERRED],
      [SupportStatus.UNDER_REVIEW]: [SupportStatus.NEEDS_INFORMATION, SupportStatus.APPROVED, SupportStatus.DECLINED, SupportStatus.DEFERRED],
      [SupportStatus.NEEDS_INFORMATION]: [SupportStatus.UNDER_REVIEW, SupportStatus.APPROVED, SupportStatus.DECLINED, SupportStatus.DEFERRED],
      [SupportStatus.APPROVED]: [SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS, SupportStatus.COMPLETED],
      [SupportStatus.DEFERRED]: [SupportStatus.UNDER_REVIEW],
      [SupportStatus.ASSIGNED]: [SupportStatus.IN_PROGRESS, SupportStatus.COMPLETED],
      [SupportStatus.IN_PROGRESS]: [SupportStatus.NEEDS_INFORMATION, SupportStatus.COMPLETED],
      [SupportStatus.COMPLETED]: [SupportStatus.CLOSED],
      [SupportStatus.DECLINED]: [SupportStatus.CLOSED],
      [SupportStatus.CLOSED]: []
    };
    return [request.status, ...transitions[request.status]];
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }

  protected updateKindLabel(kind: SupportUpdateKind): string {
    const labels: Record<SupportUpdateKind, string> = {
      [SupportUpdateKind.COMMENT]: 'Message',
      [SupportUpdateKind.CLARIFICATION_REQUEST]: 'More information requested',
      [SupportUpdateKind.CLARIFICATION_RESPONSE]: 'Information provided',
      [SupportUpdateKind.STATUS_CHANGE]: 'Status update'
    };
    return labels[kind];
  }

  private replaceRequest(updated: SupportRequest): void {
    this.requests.update(requests => requests.map(request => request.id === updated.id ? updated : request));
    this.activeRequest.set(updated);
  }
}
