import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../core/api.service';
import { AskHubComponent } from './ask-hub.component';

describe('AskHubComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AskHubComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' }
      ]
    }).compileComponents();
  });

  it('opens with suggestions, sends on Enter, and renders the assistant response', () => {
    const fixture = TestBed.createComponent(AskHubComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.assistant-launcher').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.suggestion').length).toBe(4);

    const input = fixture.nativeElement.querySelector('#ask-hub-input') as HTMLTextAreaElement;
    input.value = '  How do requests work?  ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    const request = http.expectOne('/api/ai/chat');
    expect(request.request.body).toEqual({
      messages: [{ role: 'user', content: 'How do requests work?' }]
    });
    expect(fixture.nativeElement.querySelector('.send-button').disabled).toBe(true);
    request.flush({ success: true, data: { reply: 'Add assets to your cart, then review and submit.', results: [] } });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Add assets to your cart, then review and submit.');
    expect(fixture.nativeElement.querySelector('.send-button').disabled).toBe(true);

    fixture.destroy();
    http.verify();
  });

  it('keeps Shift+Enter for multiline input and prevents repeated submissions while busy', () => {
    const fixture = TestBed.createComponent(AskHubComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.assistant-launcher').click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#ask-hub-input') as HTMLTextAreaElement;
    input.value = 'Find a laptop';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }));
    http.expectNone('/api/ai/chat');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    const request = http.expectOne('/api/ai/chat');
    expect(fixture.nativeElement.querySelector('#ask-hub-input').disabled).toBe(true);
    request.flush({ success: true, data: { reply: 'Here are some results.', results: [] } });
    fixture.detectChanges();

    fixture.destroy();
    http.verify();
  });

  it('shows backend errors and allows a new conversation after the response', () => {
    const fixture = TestBed.createComponent(AskHubComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.assistant-launcher').click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#ask-hub-input') as HTMLTextAreaElement;
    input.value = 'Find a laptop';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.assistant-composer').dispatchEvent(new Event('submit'));
    const request = http.expectOne('/api/ai/chat');
    request.flush({ success: false, message: 'Ask HUB AI is not configured.' }, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Ask HUB AI is not configured.');
    fixture.nativeElement.querySelector('[aria-label="Start a new conversation"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.suggestion').length).toBe(4);

    fixture.destroy();
    http.verify();
  });
});
