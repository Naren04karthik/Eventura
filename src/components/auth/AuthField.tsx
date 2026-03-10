import type { ChangeEvent, ReactNode } from 'react';

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  name?: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  helperText?: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthField({
  id,
  label,
  type = 'text',
  name,
  value,
  placeholder,
  required,
  helperText,
  onChange,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-white">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white placeholder:text-soft focus:border-neon focus:outline-none transition"
        required={required}
      />
      {helperText ? <p className="mt-2 text-xs text-soft">{helperText}</p> : null}
    </div>
  );
}