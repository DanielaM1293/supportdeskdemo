import { useTranslation } from 'react-i18next';
import type { HistoryEntry } from '../../types';
import { formatDateTime } from '../../utils/time';
import { formatHistoryField, formatHistoryValue } from '../../utils/history';

export function ActivityTimeline({ history }: { history: HistoryEntry[] }) {
  const { t, i18n } = useTranslation();
  return (
    <section aria-labelledby="activity-title" className="card p-5">
      <h2 id="activity-title" className="mb-4 font-bold">
        {t('detail.activity')}
      </h2>
      {history.length === 0 ? (
        <p className="text-sm text-ink-500">{t('detail.noActivity')}</p>
      ) : (
        <ol className="relative ml-2 space-y-5 border-l border-ink-200 pl-5 dark:border-ink-700">
          {history.map((h) => {
            const params = {
              actor: h.actor.name,
              field: formatHistoryField(h.field, t),
              from: formatHistoryValue(h.field, h.old_value, t),
              to: formatHistoryValue(h.field, h.new_value, t),
            };
            return (
              <li key={h.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-ink-900"
                />
                <p className="text-sm">
                  {h.field === 'created'
                    ? t('detail.createdEvent', params)
                    : h.old_value === null
                      ? t('detail.set', params)
                      : t('detail.changed', params)}
                </p>
                <time dateTime={h.created_at} className="text-xs text-ink-400">
                  {formatDateTime(h.created_at, i18n.language)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
