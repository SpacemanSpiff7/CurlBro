import { describe, expect, it, vi } from 'vitest';
import { handleRequest } from './index';

describe('worker routing', () => {
  it('routes POST /api/emails through the email handler', async () => {
    const countStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ count: 0 }),
      run: vi.fn().mockResolvedValue({}),
    };
    const existingSubscriberStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({}),
    };
    const insertStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({}),
    };

    const env = {
      DB: {
        prepare: vi
          .fn()
          .mockReturnValueOnce(countStatement)
          .mockReturnValueOnce(existingSubscriberStatement)
          .mockReturnValueOnce(insertStatement)
          .mockReturnValueOnce(insertStatement),
      },
      EMAIL_LIST_IP_HASH_SALT: 'test-salt',
      ASSETS: {
        fetch: vi.fn(),
      },
    };

    const response = await handleRequest(
      new Request('https://curlbro.com/api/emails', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.5',
        },
        body: JSON.stringify({
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: '',
          phone: '',
          trainingGoal: '',
          experienceLevel: '',
          trainingDays: '',
          equipmentAccess: [],
          biggestChallenge: '',
          consent: true,
          company: '',
          source: 'marketing',
          pagePath: '/',
          startedAtMs: Date.now() - 3000,
        }),
      }),
      env,
      { waitUntil: vi.fn() },
    );

    expect(response.status).toBe(201);
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it('serves non-API routes from static assets', async () => {
    const assetResponse = new Response('asset');
    const env = {
      ASSETS: {
        fetch: vi.fn().mockResolvedValue(assetResponse),
      },
    };

    const response = await handleRequest(
      new Request('https://curlbro.com/'),
      env as never,
      { waitUntil: vi.fn() },
    );

    expect(response).toBe(assetResponse);
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported methods on /api/emails', async () => {
    const env = {
      ASSETS: {
        fetch: vi.fn(),
      },
    };

    const response = await handleRequest(
      new Request('https://curlbro.com/api/emails', {
        method: 'GET',
      }),
      env as never,
      { waitUntil: vi.fn() },
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST, OPTIONS');
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });
});
