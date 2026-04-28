import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { EmailListFormSchema } from '@app/lib/emailList';

const STORAGE_KEY = 'curlbro_marketing_signup';

const MarketingFormSchema = EmailListFormSchema.extend({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  source: z.literal('marketing'),
  pagePath: z.string().trim().min(1).max(300),
  startedAtMs: z.number().int().positive(),
});

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  consent: boolean;
  company: string; // honeypot — must remain empty
};

const EMPTY: FormState = {
  email: '',
  firstName: '',
  lastName: '',
  consent: false,
  company: '',
};

type FieldErrors = Partial<Record<'email' | 'firstName' | 'consent', string>>;

export function EmailForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((cur) => ({ ...cur, [key]: value }));
    setErrors((cur) => ({ ...cur, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const partial = MarketingFormSchema.pick({
      email: true,
      firstName: true,
      consent: true,
    }).safeParse({
      email: form.email,
      firstName: form.firstName,
      consent: form.consent,
    });

    if (!partial.success) {
      const errs: FieldErrors = {};
      for (const issue of partial.error.issues) {
        const k = issue.path[0] as keyof FieldErrors;
        if (k && !errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: '',
          trainingGoal: '',
          experienceLevel: '',
          trainingDays: '',
          equipmentAccess: [],
          biggestChallenge: '',
          consent: form.consent,
          company: form.company,
          source: 'marketing',
          pagePath: window.location.pathname,
          startedAtMs: startedAtRef.current,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (response.ok) {
        try {
          localStorage.setItem(STORAGE_KEY, '1');
        } catch {
          /* storage unavailable */
        }
        setDone(true);
        return;
      }

      if (response.status === 409) {
        toast(payload?.message ?? 'Already on the list.');
        return;
      }
      if (response.status === 429) {
        toast(payload?.message ?? 'Slow down. Try again in a minute.');
        return;
      }
      if (response.status === 503 || response.status === 404) {
        toast(payload?.message ?? "Signup isn't live yet.");
        return;
      }

      toast(payload?.message ?? "Couldn't join. Try again.");
    } catch {
      toast('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div
        className="rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.06] px-5 py-4"
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">
          On the list
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Email when iOS lands.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
      {/* honeypot — hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <input
          tabIndex={-1}
          autoComplete="off"
          name="company"
          value={form.company}
          onChange={(e) => setField('company', e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="field-label">
            First name <span className="text-[var(--accent-primary)]">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Jane"
            value={form.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            aria-invalid={errors.firstName ? 'true' : 'false'}
            className="input-base"
          />
          {errors.firstName && (
            <p className="mt-1.5 text-xs text-[var(--destructive)]">
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="field-label">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            value={form.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            className="input-base"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="field-label">
          Email <span className="text-[var(--accent-primary)]">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          aria-invalid={errors.email ? 'true' : 'false'}
          className="input-base"
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-[var(--destructive)]">
            {errors.email}
          </p>
        )}
      </div>

      <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 px-4 py-3 transition-colors has-[:checked]:border-[var(--accent-primary)]/40 has-[:checked]:bg-[var(--accent-primary)]/[0.06]">
        <input
          type="checkbox"
          name="consent"
          checked={form.consent}
          onChange={(e) => setField('consent', e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent-primary)]"
        />
        <span className="text-[13px] leading-relaxed text-[var(--text-primary)]">
          Email me when CurlBro lands on iOS.{' '}
          <span className="text-[var(--text-tertiary)]">No spam.</span>
          {errors.consent && (
            <span className="ml-1 text-xs text-[var(--destructive)]">
              {errors.consent}
            </span>
          )}
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            Sending
          </>
        ) : (
          <>
            Email me
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
