import { EmailListSubmissionSchema, normalizeEmail, optionalText } from '../../src/lib/emailList';

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<unknown>;
}

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface EmailListEnv {
  DB: D1Database;
  TURNSTILE_SECRET_KEY?: string;
  EMAIL_LIST_IP_HASH_SALT?: string;
  EMAIL_LIST_ALLOWED_ORIGINS?: string;
  EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL?: string;
  EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET?: string;
}

interface EmailListContext {
  request: Request;
  env: EmailListEnv;
  waitUntil: (promise: Promise<unknown>) => void;
}

interface TurnstileVerificationResponse {
  success: boolean;
  hostname?: string;
  'error-codes'?: string[];
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function isLocalRequest(url: URL) {
  return ['localhost', '127.0.0.1'].includes(url.hostname);
}

function getAllowedOrigins(env: EmailListEnv, requestUrl: URL) {
  if (env.EMAIL_LIST_ALLOWED_ORIGINS) {
    return env.EMAIL_LIST_ALLOWED_ORIGINS
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [requestUrl.origin];
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? null;
  }

  return request.headers.get('cf-connecting-ip');
}

async function sha256(input: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function hashIp(ip: string | null, salt: string) {
  if (!ip) return null;
  return sha256(`${salt}:${ip}`);
}

async function recordAttempt(
  env: EmailListEnv,
  ipHash: string | null,
  normalizedEmail: string | null,
  outcome: string,
  source: string | null,
  country: string | null,
) {
  await env.DB.prepare(
    `INSERT INTO email_attempts (ip_hash, normalized_email, outcome, source, country, created_at_ms)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(ipHash, normalizedEmail, outcome, source, country, Date.now())
    .run();
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
  hostname: string,
) {
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('idempotency_key', crypto.randomUUID());
  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Turnstile verification failed with status ${response.status}`);
  }

  const payload = await response.json() as TurnstileVerificationResponse;
  if (!payload.success) {
    return {
      ok: false,
      errorCodes: payload['error-codes'] ?? [],
    };
  }

  if (payload.hostname && payload.hostname !== hostname) {
    return {
      ok: false,
      errorCodes: ['hostname-mismatch'],
    };
  }

  return {
    ok: true,
    errorCodes: [] as string[],
  };
}

async function markGoogleSheetSync(
  env: EmailListEnv,
  subscriberId: string,
  status: 'synced' | 'failed',
  errorMessage: string | null,
) {
  await env.DB.prepare(
    `UPDATE email_subscribers
     SET google_sheet_sync_status = ?, google_sheet_synced_at = ?, google_sheet_sync_error = ?
     WHERE id = ?`,
  )
    .bind(
      status,
      status === 'synced' ? new Date().toISOString() : null,
      errorMessage,
      subscriberId,
    )
    .run();
}

async function syncToGoogleSheets(
  env: EmailListEnv,
  subscriberId: string,
  payload: Record<string, unknown>,
) {
  if (!env.EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL) {
    await markGoogleSheetSync(env, subscriberId, 'failed', 'Missing EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL');
    return;
  }

  if (!env.EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET) {
    await markGoogleSheetSync(env, subscriberId, 'failed', 'Missing EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET');
    return;
  }

  try {
    const response = await fetch(env.EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        secret: env.EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET,
        submission: payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }

    await markGoogleSheetSync(env, subscriberId, 'synced', null);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Sheets sync error';
    await markGoogleSheetSync(env, subscriberId, 'failed', message);
  }
}

export async function onRequestPost(context: EmailListContext) {
  const { request, env, waitUntil } = context;
  const requestUrl = new URL(request.url);
  const localRequest = isLocalRequest(requestUrl);

  if (!env.DB) {
    return json({ message: 'D1 binding is not configured.' }, { status: 503 });
  }

  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins(env, requestUrl);
  if (origin && !allowedOrigins.includes(origin)) {
    return json({ message: 'Origin not allowed.' }, { status: 403 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return json({ message: 'Expected JSON.' }, { status: 415 });
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim() ?? '';
  const ipSalt = env.EMAIL_LIST_IP_HASH_SALT?.trim() ?? '';

  if ((!turnstileSecret || !ipSalt) && !localRequest) {
    return json(
      { message: 'Email list secrets are not configured yet for this deployment.' },
      { status: 503 },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsedBody = EmailListSubmissionSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return json({ message: parsedBody.error.issues[0]?.message ?? 'Invalid payload.' }, { status: 400 });
  }

  const submission = parsedBody.data;
  const normalizedEmail = normalizeEmail(submission.email);
  const clientIp = getClientIp(request);
  const ipHash = ipSalt ? await hashIp(clientIp, ipSalt) : null;
  const country = request.headers.get('cf-ipcountry');

  if (ipHash) {
    const recentAttempts = await env.DB.prepare(
      `SELECT COUNT(*) as count
       FROM email_attempts
       WHERE ip_hash = ? AND created_at_ms >= ?`,
    )
      .bind(ipHash, Date.now() - RATE_LIMIT_WINDOW_MS)
      .first<{ count: number }>();

    if ((recentAttempts?.count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
      await recordAttempt(env, ipHash, normalizedEmail, 'rate_limited', submission.source, country);
      return json({ message: 'Too many attempts. Please wait and try again.' }, { status: 429 });
    }
  }

  if (turnstileSecret) {
    const verification = await verifyTurnstile(
      submission.turnstileToken,
      turnstileSecret,
      clientIp,
      requestUrl.hostname,
    );

    if (!verification.ok) {
      await recordAttempt(env, ipHash, normalizedEmail, 'turnstile_failed', submission.source, country);
      return json({ message: 'Security check failed. Please try again.' }, { status: 400 });
    }
  }

  const existingSubscriber = await env.DB.prepare(
    `SELECT id FROM email_subscribers WHERE normalized_email = ? LIMIT 1`,
  )
    .bind(normalizedEmail)
    .first<{ id: string }>();

  if (existingSubscriber) {
    await recordAttempt(env, ipHash, normalizedEmail, 'duplicate', submission.source, country);
    return json({ message: 'That email is already on the list.' }, { status: 409 });
  }

  const referrer = request.headers.get('referer');
  const referrerUrl = referrer ? new URL(referrer) : null;
  const subscriberId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const googleSheetSyncEnabled = Boolean(env.EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL);

  await env.DB.prepare(
    `INSERT INTO email_subscribers (
      id, email, normalized_email, first_name, last_name, phone, training_goal,
      experience_level, training_days, equipment_access_json, biggest_challenge,
      consent_marketing, source, page_path, referrer, utm_source, utm_medium,
      utm_campaign, utm_content, utm_term, country, ip_hash, user_agent, created_at,
      google_sheet_sync_status, google_sheet_synced_at, google_sheet_sync_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      subscriberId,
      submission.email.trim(),
      normalizedEmail,
      submission.firstName.trim(),
      submission.lastName.trim(),
      optionalText(submission.phone),
      optionalText(submission.trainingGoal),
      optionalText(submission.experienceLevel),
      optionalText(submission.trainingDays),
      JSON.stringify(submission.equipmentAccess),
      optionalText(submission.biggestChallenge),
      1,
      submission.source,
      submission.pagePath,
      referrer,
      referrerUrl?.searchParams.get('utm_source') ?? null,
      referrerUrl?.searchParams.get('utm_medium') ?? null,
      referrerUrl?.searchParams.get('utm_campaign') ?? null,
      referrerUrl?.searchParams.get('utm_content') ?? null,
      referrerUrl?.searchParams.get('utm_term') ?? null,
      country,
      ipHash,
      request.headers.get('user-agent'),
      createdAt,
      googleSheetSyncEnabled ? 'pending' : 'not_configured',
      null,
      null,
    )
    .run();

  await recordAttempt(env, ipHash, normalizedEmail, 'accepted', submission.source, country);

  if (googleSheetSyncEnabled) {
    waitUntil(syncToGoogleSheets(env, subscriberId, {
      id: subscriberId,
      createdAt,
      source: submission.source,
      pagePath: submission.pagePath,
      email: submission.email.trim(),
      firstName: submission.firstName.trim(),
      lastName: submission.lastName.trim(),
      phone: optionalText(submission.phone),
      trainingGoal: optionalText(submission.trainingGoal),
      experienceLevel: optionalText(submission.experienceLevel),
      trainingDays: optionalText(submission.trainingDays),
      equipmentAccess: submission.equipmentAccess,
      biggestChallenge: optionalText(submission.biggestChallenge),
      referrer,
      utmSource: referrerUrl?.searchParams.get('utm_source') ?? null,
      utmMedium: referrerUrl?.searchParams.get('utm_medium') ?? null,
      utmCampaign: referrerUrl?.searchParams.get('utm_campaign') ?? null,
      utmContent: referrerUrl?.searchParams.get('utm_content') ?? null,
      utmTerm: referrerUrl?.searchParams.get('utm_term') ?? null,
      country,
    }));
  }

  return json({ message: 'You are on the email list.' }, { status: 201 });
}

export async function onRequestOptions(context: EmailListContext) {
  const requestUrl = new URL(context.request.url);
  const origin = context.request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins(context.env, requestUrl);
  const headers = new Headers();

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
  }

  headers.set('access-control-allow-methods', 'POST, OPTIONS');
  headers.set('access-control-allow-headers', 'Content-Type');
  headers.set('access-control-max-age', '86400');

  return new Response(null, { status: 204, headers });
}
