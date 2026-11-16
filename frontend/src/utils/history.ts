import type { TFunction } from 'i18next';

const TRANSLATED_FIELDS = new Set(['status', 'priority', 'category']);

/** Human readable value for a history entry (enum values are translated). */
export function formatHistoryValue(field: string, value: string | null, t: TFunction): string {
  if (value === null || value === '') return t('detail.emptyValue');
  if (TRANSLATED_FIELDS.has(field)) return t(`${field}.${value}`, { defaultValue: value });
  if (field === 'tier') return t(`tier.${value}`, { defaultValue: value });
  return value;
}

export function formatHistoryField(field: string, t: TFunction): string {
  return t(`field.${field}`, { defaultValue: field.replace(/_/g, ' ') });
}
