import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

/** Label + control + translated error message (messages are i18n keys). */
export function FormField({ id, label, error, children }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {t(error)}
        </p>
      )}
    </div>
  );
}
