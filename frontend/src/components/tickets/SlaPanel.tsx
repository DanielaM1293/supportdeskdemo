import { useTranslation } from 'react-i18next';
import type { SlaState, Ticket } from '../../types';
import { SlaBadge } from '../ui/Badges';
import { formatDateTime, remainingTime } from '../../utils/time';
import { useNow } from '../../hooks/useNow';

function Row({
  label,
  due,
  state,
  doneAt,
  doneLabel,
}: {
  label: string;
  due: string | null;
  state: SlaState;
  doneAt: string | null;
  doneLabel: string;
}) {
  const { t, i18n } = useTranslation();
  const now = useNow();
  const rem = remainingTime(due, i18n.language, now);
  return (
    <div className="space-y-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <SlaBadge state={state} />
      </div>
      <p className="text-xs text-ink-500 dark:text-ink-400">
        {t('sla.due')}: {due ? formatDateTime(due, i18n.language) : t('sla.noDeadline')}
      </p>
      {doneAt ? (
        <p className="text-xs text-ink-500 dark:text-ink-400">
          {doneLabel}: {formatDateTime(doneAt, i18n.language)}
        </p>
      ) : (
        rem && (
          <p
            className={`text-sm font-semibold ${
              rem.overdue ? 'text-red-700 dark:text-red-300' : 'text-ink-800 dark:text-ink-100'
            }`}
          >
            {rem.overdue
              ? t('sla.overdue', { time: rem.text })
              : t('sla.remaining', { time: rem.text })}
          </p>
        )
      )}
    </div>
  );
}

export function SlaPanel({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  const { sla } = ticket;
  return (
    <section
      aria-labelledby="sla-title"
      className="card divide-y divide-ink-100 p-5 dark:divide-ink-800"
    >
      <div className="flex items-center justify-between pb-3">
        <h2 id="sla-title" className="font-bold">
          {t('sla.title')}
        </h2>
        <SlaBadge state={sla.state} />
      </div>
      <Row
        label={t('sla.firstResponse')}
        due={sla.first_response_due}
        state={sla.first_response_state}
        doneAt={ticket.first_response_at}
        doneLabel={t('sla.respondedAt')}
      />
      <Row
        label={t('sla.resolution')}
        due={sla.resolution_due}
        state={sla.resolution_state}
        doneAt={ticket.resolved_at}
        doneLabel={t('sla.resolvedAt')}
      />
    </section>
  );
}
