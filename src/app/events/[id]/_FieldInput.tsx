'use client';

import type { RegistrationField, FormValue, CollegeOption } from '@/types';

interface FieldInputProps {
  field: RegistrationField;
  value: FormValue;
  onChange: (nextValue: FormValue) => void;
  keyPrefix: string;
  colleges: CollegeOption[];
}

/** Renders a single dynamic registration form field based on its type. */
export default function FieldInput({ field, value, onChange, keyPrefix, colleges }: FieldInputProps) {
  const commonClassName =
    'w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm transition focus:border-neon focus:outline-none';

  if (field.type === 'textarea') {
    return (
      <textarea
        id={`${keyPrefix}_${field.id}`}
        rows={3}
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
        className={commonClassName}
      />
    );
  }

  const normalizedId = field.id.toLowerCase().replace(/[\s_-]/g, '');
  const normalizedLabel = field.label.toLowerCase().replace(/[\s_-]/g, '');

  const isCollegeRegistrationNumberField =
    normalizedId.includes('collegeregistrationnumber') ||
    normalizedLabel.includes('collegeregistrationnumber') ||
    (normalizedLabel.includes('college') && normalizedLabel.includes('registrationnumber'));

  const isCollegeNameField =
    normalizedId === 'college' ||
    normalizedId === 'collegename' ||
    normalizedId === 'nameofcollege' ||
    normalizedLabel === 'college' ||
    normalizedLabel.includes('collegename') ||
    normalizedLabel.includes('nameofcollege');

  if (isCollegeNameField && !isCollegeRegistrationNumberField) {
    return (
      <select
        id={`${keyPrefix}_${field.id}`}
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        className={commonClassName}
      >
        <option value="">Select College</option>
        {colleges.map((college) => (
          <option key={college.id} value={college.name}>
            {college.name}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'dropdown') {
    return (
      <select
        id={`${keyPrefix}_${field.id}`}
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        className={commonClassName}
      >
        <option value="">Select {field.label}</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
        <input
          id={`${keyPrefix}_${field.id}`}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
        <span>{field.placeholder || `I confirm ${field.label.toLowerCase()}`}</span>
      </label>
    );
  }

  const inputType = field.type === 'phone' ? 'tel' : field.type;
  return (
    <input
      id={`${keyPrefix}_${field.id}`}
      type={inputType}
      value={String(value || '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
      className={commonClassName}
    />
  );
}
