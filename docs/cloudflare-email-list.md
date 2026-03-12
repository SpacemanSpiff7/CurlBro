# Cloudflare Email List Setup

## What this repo now expects

- Cloudflare Pages serves the app.
- `functions/api/emails.ts` handles secure submissions.
- D1 stores the canonical email list data.
- The form uses passive abuse checks instead of a visible CAPTCHA.
- Google Sheets is optional and acts as a mirrored reporting surface through an Apps Script webhook.

## 1. Create the Cloudflare resources

1. Create a D1 database:

```bash
npx wrangler d1 create curlbro-emails
```

2. Copy the returned `database_id` values into [wrangler.jsonc](/Users/slongo/Documents/GitHub/curlbro/workout-builder/wrangler.jsonc).

## 2. Configure local development variables

Create a `.dev.vars` file in the repo root:

```dotenv
EMAIL_LIST_IP_HASH_SALT="generate-a-random-secret"
EMAIL_LIST_ALLOWED_ORIGINS="http://127.0.0.1:8788,http://localhost:8788,https://curlbro.com"
EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL=""
EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET=""
```

## 3. Apply the D1 migration

Local:

```bash
npx wrangler d1 execute curlbro-emails --local --file=./cloudflare/migrations/0001_emails.sql
```

Remote:

```bash
npx wrangler d1 execute curlbro-emails --remote --file=./cloudflare/migrations/0001_emails.sql
```

## 4. Configure Pages bindings and secrets

In Cloudflare Pages:

- Add D1 binding `DB`
- Add secret `EMAIL_LIST_IP_HASH_SALT`
- Optional: add `EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL`
- Optional: add `EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET`

`EMAIL_LIST_ALLOWED_ORIGINS` should stay in [wrangler.jsonc](/Users/slongo/Documents/GitHub/curlbro/workout-builder/wrangler.jsonc) if your Pages project is configured to manage plaintext variables from Wrangler.

Recommended production value in Wrangler:

```dotenv
EMAIL_LIST_ALLOWED_ORIGINS="https://curlbro.com"
```

If you want preview deployments to submit successfully too, add the preview domain to `EMAIL_LIST_ALLOWED_ORIGINS` as a comma-separated allowlist.

## Passive abuse checks in the current form

- Honeypot field that real users never touch
- Server-side email validation and payload validation
- Same-origin allowlist via `EMAIL_LIST_ALLOWED_ORIGINS`
- Per-IP rate limiting using a salted IP hash
- Duplicate email rejection
- Minimum form-fill time check to catch instant bot posts

If you later see meaningful spam volume, add Cloudflare WAF rate limiting before bringing back any visible challenge.

## 5. Optional Google Sheets mirror

1. Create a Google Sheet with a tab named `Emails`.
2. Open Extensions > Apps Script.
3. Paste the code from [google-sheets-emails-webhook.gs](/Users/slongo/Documents/GitHub/curlbro/workout-builder/docs/google-sheets-emails-webhook.gs).
4. In Apps Script, set a script property named `EMAIL_LIST_WEBHOOK_SECRET`.
5. Deploy the Apps Script as a web app.
6. Copy the web app URL into `EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL`.
7. Use the same secret value in `EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET`.

The Cloudflare function will keep accepting signups even if Sheets sync fails; D1 remains the source of truth.

## Existing databases that already ran the legacy migration

If you already ran `0001_waitlist.sql`, apply the rename migration next:

```bash
npx wrangler d1 execute curlbro-emails --remote --file=./cloudflare/migrations/0002_rename_waitlist_to_emails.sql
```

## 6. Deploy

Connect the GitHub repo to Cloudflare Pages and let Pages run your Vite build automatically.

After adding or changing any Pages variables or secrets, trigger a new deploy. The current deployment will not pick up updated values retroactively.
