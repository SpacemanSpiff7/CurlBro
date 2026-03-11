# Cloudflare Email List Setup

## What this repo now expects

- Cloudflare Pages serves the app.
- `functions/api/emails.ts` handles secure submissions.
- D1 stores the canonical email list data.
- Turnstile protects the form.
- Google Sheets is optional and acts as a mirrored reporting surface through an Apps Script webhook.

## 1. Create the Cloudflare resources

1. Create a Turnstile widget in Cloudflare.
2. Create a D1 database:

```bash
npx wrangler d1 create curlbro-emails
```

3. Copy the returned `database_id` values into [wrangler.jsonc](/Users/slongo/Documents/GitHub/curlbro/workout-builder/wrangler.jsonc).

## 2. Configure local secrets

Create a `.dev.vars` file in the repo root:

```dotenv
TURNSTILE_SECRET_KEY="replace-me"
EMAIL_LIST_IP_HASH_SALT="generate-a-random-secret"
EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL=""
EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET=""
```

The public site key goes into a normal Pages/Workers variable:

```dotenv
VITE_TURNSTILE_SITE_KEY="replace-me"
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
- Add secret `TURNSTILE_SECRET_KEY`
- Add secret `EMAIL_LIST_IP_HASH_SALT`
- Add variable `VITE_TURNSTILE_SITE_KEY`
- Optional: add `EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_URL`
- Optional: add `EMAIL_LIST_GOOGLE_SHEETS_WEBHOOK_SECRET`
- Optional: add `EMAIL_LIST_ALLOWED_ORIGINS` as a comma-separated allowlist

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

```bash
npx wrangler pages deploy dist
```

Or connect the GitHub repo to Cloudflare Pages and let Pages run your Vite build automatically.
