import { RequestStatus, Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AiDataSource, AiRuntime, runAssistantChat } from './ai.service';
import { HttpError } from '../middleware/errors';

const userMessage = [{ role: 'user' as const, content: 'Show my pending requests' }];
const identity = { userId: 'authenticated-innovator', role: Role.INNOVATOR };

function providerReply(message: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message }] }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function runtime(data: AiDataSource, fetcher: typeof fetch, overrides: Partial<AiRuntime> = {}): Partial<AiRuntime> {
  return { apiKey: 'server-only-test-key', baseUrl: 'https://provider.test/v1', model: 'test-model', timeoutMs: 100, data, fetcher, ...overrides };
}

const emptyData: AiDataSource = {
  searchInventory: async () => [],
  listMyRequests: async () => [],
  getMyRequest: async () => null,
  prepareRequest: async request => ({ request, assets: [] })
};

describe('Ask HUB AI chat service', () => {
  it('requires an API key without exposing provider credentials', async () => {
    await expect(runAssistantChat(userMessage, identity, { apiKey: undefined }))
      .rejects.toMatchObject({ status: 503, code: 'AI_NOT_CONFIGURED' });
  });

  it('returns an explicit safe error for provider failures', async () => {
    const fetcher: typeof fetch = async () => providerReply({}, 429);

    await expect(runAssistantChat(userMessage, identity, runtime(emptyData, fetcher)))
      .rejects.toMatchObject({ status: 503, code: 'AI_PROVIDER_BUSY', message: expect.not.stringContaining('test-key') });
  });

  it('enforces a timeout and returns a sanitized error', async () => {
    const fetcher: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });

    await expect(runAssistantChat(userMessage, identity, runtime(emptyData, fetcher, { timeoutMs: 5 })))
      .rejects.toMatchObject({ status: 504, code: 'AI_TIMEOUT' });
  });

  it('binds request lookups to the authenticated user and never accepts a user id tool argument', async () => {
    const listMyRequests = vi.fn(async (userId: string) => {
      expect(userId).toBe(identity.userId);
      return [];
    });
    const data: AiDataSource = { ...emptyData, listMyRequests };
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'list-1',
          type: 'function',
          function: { name: 'list_my_requests', arguments: JSON.stringify({ status: RequestStatus.PENDING, dateFrom: null, dateTo: null }) }
        }]
      }),
      providerReply({ content: 'You have no pending requests.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(userMessage, identity, runtime(data, fetcher));

    expect(listMyRequests).toHaveBeenCalledOnce();
    expect(result.results).toEqual([{ type: 'requests', items: [] }]);
  });

  it('searches inventory using the user query and returns tool results separately', async () => {
    const searchInventory = vi.fn(async () => []);
    const data: AiDataSource = { ...emptyData, searchInventory };
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'search-1',
          type: 'function',
          function: { name: 'search_inventory', arguments: '{"query":"laptop","inStockOnly":true}' }
        }]
      }),
      providerReply({ content: 'No in-stock laptops matched that search.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(userMessage, identity, runtime(data, fetcher));

    expect(searchInventory).toHaveBeenCalledWith('laptop', true);
    expect(result.results).toEqual([{ type: 'inventory', items: [] }]);
  });

  it('checks request detail ownership using the authenticated identity', async () => {
    const getMyRequest = vi.fn(async (userId: string) => {
      expect(userId).toBe(identity.userId);
      return null;
    });
    const data: AiDataSource = { ...emptyData, getMyRequest };
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'detail-1',
          type: 'function',
          function: {
            name: 'get_my_request',
            arguments: '{"requestId":"00000000-0000-4000-8000-000000000001"}'
          }
        }]
      }),
      providerReply({ content: 'I could not find that request.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(userMessage, identity, runtime(data, fetcher));

    expect(getMyRequest).toHaveBeenCalledWith(identity.userId, '00000000-0000-4000-8000-000000000001');
    expect(result.results).toEqual([{
      type: 'error',
      tool: 'get_my_request',
      message: 'Request not found'
    }]);
  });

  it('blocks personal request tools for administrators', async () => {
    const listMyRequests = vi.fn(async () => []);
    const data: AiDataSource = { ...emptyData, listMyRequests };
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'list-2',
          type: 'function',
          function: {
            name: 'list_my_requests',
            arguments: '{"status":null,"dateFrom":null,"dateTo":null}'
          }
        }]
      }),
      providerReply({ content: 'Personal request lists are available to innovators.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(
      userMessage,
      { userId: 'authenticated-admin', role: Role.ADMIN },
      runtime(data, fetcher)
    );

    expect(listMyRequests).not.toHaveBeenCalled();
    expect(result.results[0]).toMatchObject({ type: 'error', tool: 'list_my_requests' });
  });

  it('prepares a validated request without exposing a submit operation', async () => {
    const prepareRequest = vi.fn(async request => ({ request, assets: [] }));
    const data: AiDataSource = { ...emptyData, prepareRequest };
    const request = {
      projectName: 'Soil monitor',
      projectAbstract: 'Building a monitor to measure soil moisture.',
      loanDays: 7,
      startDate: '2026-12-01',
      items: [{ assetId: '00000000-0000-4000-8000-000000000001', quantity: 1 }],
      teamMembers: []
    };
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'prepare-1',
          type: 'function',
          function: { name: 'prepare_request', arguments: JSON.stringify({ request }) }
        }]
      }),
      providerReply({ content: 'Review the draft before submitting it in your request cart.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(userMessage, identity, runtime(data, fetcher));

    expect(prepareRequest).toHaveBeenCalledOnce();
    expect(result.results).toEqual([{ type: 'prepared_request', item: { request, assets: [] } }]);
  });

  it('rejects unauthorized admin navigation intents before returning a route', async () => {
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'navigate-1',
          type: 'function',
          function: { name: 'navigate', arguments: '{"intent":"admin_dashboard"}' }
        }]
      }),
      providerReply({ content: 'That module is only available to administrators.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(userMessage, identity, runtime(emptyData, fetcher));

    expect(result.results).toEqual([{
      type: 'error',
      tool: 'navigate',
      message: 'You do not have permission to open this module'
    }]);
  });

  it('does not silently describe request cancellation as available', async () => {
    const responses = [
      providerReply({
        tool_calls: [{
          id: 'help-1',
          type: 'function',
          function: { name: 'get_platform_help', arguments: '{"topic":"cancellation"}' }
        }]
      }),
      providerReply({ content: 'The current Vault does not support request cancellation.' })
    ];
    const fetcher: typeof fetch = async () => responses.shift()!;

    const result = await runAssistantChat(userMessage, identity, runtime(emptyData, fetcher));

    expect(result.reply).toContain('does not support');
    expect(result.results).toEqual([]);
  });

  it('surfaces provider orchestration errors as safe API errors', async () => {
    const fetcher: typeof fetch = async () => { throw new Error('provider internal response with secret'); };

    await expect(runAssistantChat(userMessage, identity, runtime(emptyData, fetcher)))
      .rejects.toBeInstanceOf(HttpError);
  });
});
