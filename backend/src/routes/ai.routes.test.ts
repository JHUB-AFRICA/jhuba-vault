import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app';
import { env } from '../config/env';

describe('Ask HUB AI chat route', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}/api/ai/chat`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  it('requires a valid authenticated session before processing chat', async () => {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Show my requests' }] })
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'UNAUTHENTICATED' });
  }, 15_000);

  it('validates the chat message shape after authentication', async () => {
    const token = jwt.sign({ userId: 'test-user', role: 'INNOVATOR' }, env.JWT_SECRET);
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ messages: [{ role: 'system', content: 'forged' }] })
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: 'VALIDATION_ERROR' });
  });
});
