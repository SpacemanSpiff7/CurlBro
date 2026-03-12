import { z } from 'zod';

export const EMAIL_LIST_SOURCES = ['settings', 'welcome'] as const;
export type EmailListSource = typeof EMAIL_LIST_SOURCES[number];

export const EXPERIENCE_VALUES = ['', 'beginner', 'intermediate', 'advanced', 'coach'] as const;
export const TRAINING_DAY_VALUES = ['', '<1', '1-2', '3-4', '5-6', '7'] as const;
export const EQUIPMENT_VALUES = [
  'barbell_setup',
  'dumbbells',
  'cable_machine',
  'weight_machines',
  'pullup_dip_station',
  'kettlebells_bands',
  'cardio_machines',
  'bodyweight_only',
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'coach', label: 'Coach / Trainer' },
] as const;

export const TRAINING_DAY_OPTIONS = [
  { value: '<1', label: '<1' },
  { value: '1-2', label: '1-2' },
  { value: '3-4', label: '3-4' },
  { value: '5-6', label: '5-6' },
  { value: '7', label: '7' },
] as const;

export const EQUIPMENT_OPTIONS = [
  { value: 'barbell_setup', label: 'Barbell setup' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'cable_machine', label: 'Cable machine' },
  { value: 'weight_machines', label: 'Weight machines' },
  { value: 'pullup_dip_station', label: 'Pull-up / dip station' },
  { value: 'kettlebells_bands', label: 'Kettlebells / bands' },
  { value: 'cardio_machines', label: 'Cardio machines' },
  { value: 'bodyweight_only', label: 'Bodyweight only' },
] as const;

const phoneSchema = z.string().trim().refine((value) => {
  if (value.length === 0) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}, 'Enter a valid phone number.');

export const EmailListFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email.'),
  firstName: z.string().trim().max(60, 'Keep your name under 60 characters.'),
  lastName: z.string().trim().max(60, 'Keep your name under 60 characters.'),
  phone: phoneSchema,
  trainingGoal: z.string().trim().max(120, 'Keep this under 120 characters.'),
  experienceLevel: z.enum(EXPERIENCE_VALUES),
  trainingDays: z.enum(TRAINING_DAY_VALUES),
  equipmentAccess: z.array(z.enum(EQUIPMENT_VALUES)).max(EQUIPMENT_VALUES.length),
  biggestChallenge: z.string().trim().max(400, 'Keep this under 400 characters.'),
  consent: z.boolean().refine((value) => value, {
    message: 'You need to explicitly opt in before joining the email list.',
  }),
  company: z.string().trim().max(0),
});

export const EmailListSubmissionSchema = EmailListFormSchema.extend({
  source: z.enum(EMAIL_LIST_SOURCES),
  pagePath: z.string().trim().min(1).max(300),
  startedAtMs: z.number().int().positive(),
  turnstileToken: z.string().trim().optional(),
});

export type EmailListForm = z.infer<typeof EmailListFormSchema>;
export type EmailListSubmission = z.infer<typeof EmailListSubmissionSchema>;
export type EquipmentOption = typeof EQUIPMENT_VALUES[number];

export const EMPTY_EMAIL_LIST_FORM: EmailListForm = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  trainingGoal: '',
  experienceLevel: '',
  trainingDays: '',
  equipmentAccess: [],
  biggestChallenge: '',
  consent: false,
  company: '',
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
