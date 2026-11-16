import { useTranslation } from 'react-i18next';
import { useGetAgentsQuery } from '../../api/usersApi';
import { useUpdateTicketMutation } from '../../api/ticketsApi';
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  TIERS,
  type Category,
  type Priority,
  type Role,
  type Status,
  type TicketDetail,
  type Tier,
  type UpdateTicketBody,
} from '../../types';
import { InlineError } from '../ui/Feedback';

/** Controls for agents/admins, or the limited close/reopen actions for end users. */
export function ManagePanel({ ticket, role }: { ticket: TicketDetail; role: Role }) {
  const { t } = useTranslation();
  const isStaff = role === 'agente' || role === 'admin';
  const [updateTicket, { isLoading, error }] = useUpdateTicketMutation();
  const { data: agents } = useGetAgentsQuery(undefined, { skip: !isStaff });

  const patch = (changes: UpdateTicketBody) => void updateTicket({ id: ticket.id, changes });

  if (!isStaff) {
    if (ticket.status !== 'resuelto') return null;
    return (
      <section aria-labelledby="actions-title" className="card space-y-3 p-5">
        <h2 id="actions-title" className="font-bold">
          {t('manage.userActions')}
        </h2>
        <p className="text-sm text-ink-500 dark:text-ink-400">{t('manage.resolvedPrompt')}</p>
        {error && <InlineError error={error} fallback={t('manage.updateError')} />}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={isLoading}
            onClick={() => patch({ status: 'cerrado' })}
          >
            {t('manage.closeTicket')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={isLoading}
            onClick={() => patch({ status: 'abierto' })}
          >
            {t('manage.reopenTicket')}
          </button>
        </div>
      </section>
    );
  }

  const select = (
    id: string,
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void,
  ) => (
    <div>
      <label htmlFor={id} className="label !mb-1 text-xs">
        {label}
      </label>
      <select
        id={id}
        className="input"
        value={value}
        disabled={isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const assigneeOptions = [
    { value: '', label: t('common.unassigned') },
    ...(agents?.items ?? []).map((a) => ({ value: String(a.id), label: a.name })),
  ];
  const assignedId = ticket.assigned_to ? String(ticket.assigned_to.id) : '';
  // Keep the current assignee selectable even if not in the agents list.
  if (ticket.assigned_to && !assigneeOptions.some((o) => o.value === assignedId)) {
    assigneeOptions.push({ value: assignedId, label: ticket.assigned_to.name });
  }

  return (
    <section aria-labelledby="manage-title" className="card space-y-4 p-5">
      <h2 id="manage-title" className="font-bold">
        {t('manage.title')}
      </h2>
      {error && <InlineError error={error} fallback={t('manage.updateError')} />}
      {select(
        'm-status',
        t('manage.status'),
        ticket.status,
        STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
        (v) => patch({ status: v as Status }),
      )}
      {select(
        'm-priority',
        t('manage.priority'),
        ticket.priority,
        PRIORITIES.map((s) => ({ value: s, label: t(`priority.${s}`) })),
        (v) => patch({ priority: v as Priority }),
      )}
      {select(
        'm-category',
        t('manage.category'),
        ticket.category,
        CATEGORIES.map((s) => ({ value: s, label: t(`category.${s}`) })),
        (v) => patch({ category: v as Category }),
      )}
      {select(
        'm-tier',
        t('manage.tier'),
        String(ticket.tier),
        TIERS.map((s) => ({ value: String(s), label: t(`tier.${s}`) })),
        (v) => patch({ tier: Number(v) as Tier }),
      )}
      {select('m-assignee', t('manage.assignee'), assignedId, assigneeOptions, (v) =>
        patch({ assigned_to_id: v === '' ? null : Number(v) }),
      )}
      {ticket.tier === 1 && (
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={isLoading}
          onClick={() => patch({ tier: 2 })}
        >
          {t('manage.escalate')}
        </button>
      )}
    </section>
  );
}
