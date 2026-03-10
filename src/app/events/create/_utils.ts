import type { CustomField } from '@/types';

/** Default fields pre-populated on every event registration form */
export const DEFAULT_REGISTRATION_FIELDS: CustomField[] = [
  {
    id: 'default_full_name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
  },
  {
    id: 'default_email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'Enter your email address',
  },
  {
    id: 'default_whatsapp',
    label: 'Whatsapp Number',
    type: 'phone',
    required: true,
    placeholder: 'Enter your WhatsApp number',
  },
  {
    id: 'default_college',
    label: 'College',
    type: 'text',
    required: true,
    placeholder: 'Enter your college name',
  },
  {
    id: 'default_registration_no',
    label: 'College Registration No',
    type: 'text',
    required: true,
    placeholder: 'Roll no',
  },
  {
    id: 'default_year',
    label: 'Year',
    type: 'dropdown',
    required: true,
    placeholder: 'Select your year',
    options: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
  },
  {
    id: 'default_branch',
    label: 'Branch',
    type: 'text',
    required: true,
    placeholder: 'Enter your branch (e.g., CSE, ECE, etc.)',
  },
  {
    id: 'default_section',
    label: 'Section',
    type: 'text',
    required: true,
    placeholder: 'Enter your section (e.g., A, B, C)',
  },
];

/** Convert a UTC date/datetime value to a local `YYYY-MM-DD` string for `<input type="date">` */
export function toLocalDateInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Convert a UTC date/datetime value to a local `HH:MM` string for `<input type="time">` */
export function toLocalTimeInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(11, 16);
}

/** Convert a UTC date/datetime value to a local `YYYY-MM-DDTHH:MM` string for `<input type="datetime-local">` */
export function toLocalDateTimeInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Strip HTML tags (including iframes) and normalise whitespace */
export function stripHtml(input: string): string {
  return (input || '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
