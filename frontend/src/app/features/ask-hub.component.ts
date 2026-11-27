import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AskHubChatMessage,
  AskHubPreparedRequest,
  AskHubService,
  AskHubToolResult
} from '../core/api.service';
import { assistantRouteFor } from '../core/assistant-navigation';
import { Asset } from '../core/models';
import { AuthStore } from '../state/auth.store';
import { RequestStore } from '../state/request.store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  results?: AskHubToolResult[];
}

const GREETING = 'Hello! I’m HUB AI. I can help you navigate JHUB AFRICA VAULT, find resources, prepare and track requests, and answer questions about the platform. What would you like to do?';
const SUGGESTIONS = [
  { label: 'Find an asset', message: 'Find an in-stock laptop' },
  { label: 'Make a request', message: 'Help me prepare an equipment request' },
  { label: 'Track my requests', message: 'Show my pending requests' },
  { label: 'Explore the Vault', message: 'Open the asset catalogue' }
];

@Component({
  selector: 'jhub-ask-hub',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ask-hub.component.html',
  styleUrl: './ask-hub.component.css'
})
export class AskHubComponent {
  private readonly assistant = inject(AskHubService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private readonly request = inject(RequestStore);

  @ViewChild('transcript') private transcript?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('launcher') private launcher?: ElementRef<HTMLButtonElement>;
  protected readonly opened = signal(false);
  protected readonly busy = signal(false);
  protected readonly draft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly messages = signal<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
  protected readonly suggestions = SUGGESTIONS;

  protected toggle(): void {
    const opening = !this.opened();
    this.opened.set(opening);
    setTimeout(() => {
      (opening ? this.messageInput : this.launcher)?.nativeElement.focus();
    });
  }

  protected newConversation(): void {
    if (this.busy()) return;
    this.messages.set([{ role: 'assistant', content: GREETING }]);
    this.error.set(null);
    this.draft.set('');
  }

  protected updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected chooseSuggestion(message: string): void {
    this.draft.set(message);
    this.send(message);
  }

  protected send(message = this.draft()): void {
    const content = message.trim();
    if (!content || this.busy()) return;

    const history: AskHubChatMessage[] = this.messages()
      .slice(1)
      .slice(-19)
      .map(({ role, content: text }) => ({ role, content: text }));
    history.push({ role: 'user', content });
    this.messages.update(current => [...current, { role: 'user', content }]);
    this.draft.set('');
    this.error.set(null);
    this.busy.set(true);
    this.scrollToLatest();

    this.assistant.chat(history).subscribe({
      next: response => {
        this.messages.update(current => [...current, {
          role: 'assistant',
          content: response.reply,
          results: response.results
        }]);
        this.busy.set(false);
        this.scrollToLatest();
        const navigation = response.results.find(
          (result): result is Extract<AskHubToolResult, { type: 'navigation' }> => result.type === 'navigation'
        );
        if (navigation) void this.navigateTo(navigation.intent);
      },
      error: (requestError: unknown) => {
        this.busy.set(false);
        this.error.set(
          requestError instanceof HttpErrorResponse && typeof requestError.error?.message === 'string'
            ? requestError.error.message
            : 'Ask HUB AI could not respond. Check your connection and try again.'
        );
        this.scrollToLatest();
      }
    });
  }

  protected assetFor(prepared: AskHubPreparedRequest, assetId: string): Asset | undefined {
    return prepared.assets.find(asset => asset.id === assetId);
  }

  protected requestHasItems(): boolean {
    return this.request.hasItems();
  }

  protected async reviewPreparedRequest(prepared: AskHubPreparedRequest): Promise<void> {
    const draft = prepared.request;
    this.request.clear();
    for (const item of draft.items) {
      const asset = this.assetFor(prepared, item.assetId);
      if (asset) this.request.addAsset(asset, item.quantity);
    }
    this.request.updateProject({
      projectName: draft.projectName,
      projectAbstract: draft.projectAbstract,
      loanDays: draft.loanDays,
      startDate: draft.startDate
    });
    for (const member of draft.teamMembers) this.request.addTeamMember(member);
    const navigated = await this.router.navigateByUrl('/app/cart');
    if (navigated) this.opened.set(false);
    else this.error.set('The request cart could not be opened.');
  }

  private async navigateTo(intent: Extract<AskHubToolResult, { type: 'navigation' }>['intent']): Promise<void> {
    const role = this.auth.user()?.role;
    if (!role) {
      this.error.set('Sign in to open Vault modules.');
      return;
    }
    const path = assistantRouteFor(intent, role);
    if (!path) {
      this.error.set('That module is not available for your account.');
      return;
    }
    const navigated = await this.router.navigateByUrl(path);
    if (!navigated) this.error.set('The requested Vault page could not be opened.');
  }

  protected resultRequestLabel(status: string): string {
    return status.replaceAll('_', ' ').toLowerCase();
  }

  private scrollToLatest(): void {
    setTimeout(() => {
      const element = this.transcript?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    if (this.opened()) this.toggle();
  }
}
