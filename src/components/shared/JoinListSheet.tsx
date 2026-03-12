import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Mail } from 'lucide-react';
import { toast } from 'sonner';
import type { ZodError } from 'zod';
import {
  EMPTY_EMAIL_LIST_FORM,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  TRAINING_DAY_OPTIONS,
  EmailListFormSchema,
  type EquipmentOption,
  type EmailListForm,
} from '@/lib/emailList';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface JoinListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: 'settings' | 'welcome';
  overlayClassName?: string;
  contentClassName?: string;
}

type FieldErrors = Partial<Record<keyof EmailListForm, string>>;

const inputClassName = 'h-11 text-base md:text-sm';
const selectTriggerClassName = 'flex min-h-[44px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-left text-base text-text-primary shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30';
const textareaClassName = 'min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base text-text-primary shadow-xs outline-none transition-[color,box-shadow] placeholder:text-text-tertiary focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30';
const fieldLabelClassName = 'mb-3 block text-sm font-medium text-text-primary';

function getFieldErrors(error: ZodError<EmailListForm>): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path[0];
    if (typeof path === 'string' && !(path in fieldErrors)) {
      fieldErrors[path as keyof FieldErrors] = issue.message;
    }
  }

  return fieldErrors;
}

interface InlineSelectProps<T extends string> {
  id: string;
  label: string;
  value: T | '';
  options: readonly { value: T; label: string }[];
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: T | '') => void;
}

function InlineSelect<T extends string>({
  id,
  label,
  value,
  options,
  placeholder,
  open,
  onToggle,
  onSelect,
}: InlineSelectProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggle, open]);

  return (
    <div ref={containerRef}>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={onToggle}
          className={selectTriggerClassName}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className={value ? 'text-text-primary' : 'text-text-secondary'}>
            {selectedLabel}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div
            className="absolute inset-x-0 top-[calc(100%+0.625rem)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface shadow-[0_12px_28px_rgba(15,23,42,0.14)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
            role="listbox"
            aria-labelledby={id}
          >
            <button
              type="button"
              onClick={() => onSelect('')}
              className={`flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-base transition-colors md:text-sm ${
                value === ''
                  ? 'bg-accent-primary/16 text-text-primary'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              }`}
            >
              {value === '' && <Check size={14} className="shrink-0 text-accent-primary" />}
              <span>{placeholder}</span>
            </button>
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left text-base transition-colors md:text-sm ${
                    selected
                      ? 'bg-accent-primary/16 text-text-primary'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  {selected && <Check size={14} className="shrink-0 text-accent-primary" />}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function JoinListSheet({
  open,
  onOpenChange,
  source,
  overlayClassName,
  contentClassName,
}: JoinListSheetProps) {
  const [form, setForm] = useState<EmailListForm>(EMPTY_EMAIL_LIST_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openMenu, setOpenMenu] = useState<'experience' | 'days' | null>(null);
  const formStartedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (open) {
      formStartedAtRef.current = Date.now();
    } else {
      setErrors({});
      setSubmitting(false);
      setShowMore(false);
      setOpenMenu(null);
    }
  }, [open]);

  const setField = <K extends keyof EmailListForm>(key: K, value: EmailListForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleEquipment = (value: EquipmentOption) => {
    setForm((current) => ({
      ...current,
      equipmentAccess: current.equipmentAccess.includes(value)
        ? current.equipmentAccess.filter((item) => item !== value)
        : [...current.equipmentAccess, value],
    }));
    setErrors((current) => ({ ...current, equipmentAccess: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = EmailListFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...result.data,
          source,
          pagePath: `${window.location.pathname}${window.location.search}`,
          startedAtMs: formStartedAtRef.current,
        }),
      });

      const payload = await response.json().catch(() => null) as
        | { message?: string }
        | null;

      if (response.ok) {
        setForm(EMPTY_EMAIL_LIST_FORM);
        onOpenChange(false);
        toast(payload?.message ?? 'You are on the email list.');
        return;
      }

      if (response.status === 409) {
        toast(payload?.message ?? 'That email is already on the email list.');
        return;
      }

      if (response.status === 429) {
        toast(payload?.message ?? 'Too many attempts. Please wait and try again.');
        return;
      }

      if (response.status === 503) {
        toast(payload?.message ?? 'Signup is not configured yet for this deployment.');
        return;
      }

      if (response.status === 404) {
        toast('Signup is not live yet. The Cloudflare endpoint still needs to be deployed.');
        return;
      }

      toast(payload?.message ?? 'Could not join the list right now.');
    } catch {
      toast('Network error. Try again once the app is deployed with the Cloudflare endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName={overlayClassName}
        className={`max-h-[90dvh] overflow-y-auto rounded-t-3xl border-border-subtle bg-bg-surface pb-[env(safe-area-inset-bottom)] ${contentClassName ?? ''}`}
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-text-primary">
            <Mail size={18} className="text-accent-primary" />
            Join Our List
          </SheetTitle>
          <SheetDescription className="text-text-secondary">
            Get launch updates, new features, and training notes. Only email is required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
          <div>
            <label htmlFor={`${source}-email`} className={fieldLabelClassName}>
              Email <span className="text-accent-primary">*</span>
            </label>
            <Input
              id={`${source}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              aria-invalid={errors.email ? 'true' : 'false'}
              className={inputClassName}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${source}-first-name`} className={fieldLabelClassName}>
                First Name
              </label>
              <Input
                id={`${source}-first-name`}
                autoComplete="given-name"
                placeholder="Jane"
                value={form.firstName}
                onChange={(event) => setField('firstName', event.target.value)}
                aria-invalid={errors.firstName ? 'true' : 'false'}
                className={inputClassName}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor={`${source}-last-name`} className={fieldLabelClassName}>
                Last Name
              </label>
              <Input
                id={`${source}-last-name`}
                autoComplete="family-name"
                placeholder="Doe"
                value={form.lastName}
                onChange={(event) => setField('lastName', event.target.value)}
                aria-invalid={errors.lastName ? 'true' : 'false'}
                className={inputClassName}
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label htmlFor={`${source}-phone`} className={fieldLabelClassName}>
              Phone
            </label>
            <Input
              id={`${source}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 555-5555"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              aria-invalid={errors.phone ? 'true' : 'false'}
              className={inputClassName}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="hidden" aria-hidden="true">
            <label htmlFor={`${source}-company`}>Company</label>
            <input
              id={`${source}-company`}
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(event) => setField('company', event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowMore((current) => !current)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-border-subtle bg-bg-elevated px-3 text-left text-sm text-text-secondary transition-colors hover:bg-bg-card"
            aria-expanded={showMore}
            aria-controls={`${source}-more-fields`}
          >
            <span>Tell me more about how you train</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showMore ? 'rotate-180' : ''}`}
            />
          </button>

          {showMore && (
            <div id={`${source}-more-fields`} className="space-y-5 rounded-2xl border border-border-subtle bg-bg-elevated/70 p-4">
              <div>
                <label htmlFor={`${source}-goal`} className={fieldLabelClassName}>
                  Main Goal
                </label>
                <Input
                  id={`${source}-goal`}
                  placeholder="Build muscle, get stronger, stay consistent..."
                  value={form.trainingGoal}
                  onChange={(event) => setField('trainingGoal', event.target.value)}
                  aria-invalid={errors.trainingGoal ? 'true' : 'false'}
                  className={inputClassName}
                />
                {errors.trainingGoal && <p className="text-xs text-destructive">{errors.trainingGoal}</p>}
              </div>

              <InlineSelect
                id={`${source}-experience`}
                label="Experience"
                value={form.experienceLevel}
                options={EXPERIENCE_OPTIONS}
                placeholder="Select experience"
                open={openMenu === 'experience'}
                onToggle={() => setOpenMenu((current) => current === 'experience' ? null : 'experience')}
                onSelect={(value) => {
                  setField('experienceLevel', value);
                  setOpenMenu(null);
                }}
              />

              <InlineSelect
                id={`${source}-days`}
                label="Days Per Week"
                value={form.trainingDays}
                options={TRAINING_DAY_OPTIONS}
                placeholder="Select training frequency"
                open={openMenu === 'days'}
                onToggle={() => setOpenMenu((current) => current === 'days' ? null : 'days')}
                onSelect={(value) => {
                  setField('trainingDays', value);
                  setOpenMenu(null);
                }}
              />

              <div>
                <div className={fieldLabelClassName}>Equipment Access</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EQUIPMENT_OPTIONS.map((option) => {
                    const selected = form.equipmentAccess.includes(option.value);

                    return (
                      <label
                        key={option.value}
                        className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 transition-colors ${
                          selected
                            ? 'border-accent-primary bg-accent-primary/12'
                            : 'border-border-subtle bg-bg-card hover:bg-bg-surface'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleEquipment(option.value as EquipmentOption)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-border-subtle accent-accent-primary"
                        />
                        <span className="flex min-h-6 items-center gap-2 text-base text-text-primary md:text-sm">
                          {selected && <Check size={14} className="text-accent-primary" />}
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor={`${source}-challenge`} className={fieldLabelClassName}>
                  Biggest Training Challenge
                </label>
                <textarea
                  id={`${source}-challenge`}
                  rows={4}
                  placeholder="What is making training harder than it should be?"
                  value={form.biggestChallenge}
                  onChange={(event) => setField('biggestChallenge', event.target.value)}
                  className={textareaClassName}
                />
                {errors.biggestChallenge && (
                  <p className="text-xs text-destructive">{errors.biggestChallenge}</p>
                )}
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-bg-elevated/70 p-3">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => setField('consent', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border-subtle accent-accent-primary"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-text-primary">
                Email me product updates and launch news. <span className="text-accent-primary">*</span>
              </span>
              <span className="block text-xs leading-relaxed text-text-secondary">
                Unsubscribe anytime. Sharing a phone number does not by itself authorize marketing texts; any required consent would be requested separately.
              </span>
            </span>
          </label>
          {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-accent-primary text-bg-root hover:bg-accent-hover"
          >
            {submitting ? 'Joining...' : 'Join Our List'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
