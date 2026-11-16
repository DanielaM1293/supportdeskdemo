import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetTicketQuery } from '../api/ticketsApi';
import { useAppSelector } from '../store/hooks';
import { PriorityBadge, StatusBadge } from '../components/ui/Badges';
import { ErrorState, Skeleton } from '../components/ui/Feedback';
import { SlaPanel } from '../components/tickets/SlaPanel';
import { CommentThread } from '../components/tickets/CommentThread';
import { ActivityTimeline } from '../components/tickets/ActivityTimeline';
import { ManagePanel } from '../components/tickets/ManagePanel';
import { formatDateTime } from '../utils/time';

function DetailSkeleton() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('common.loading')} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const ticketId = Number(id);
  const role = useAppSelector((s) => s.auth.user?.role);
  const valid = Number.isInteger(ticketId) && ticketId > 0;
  const { data: ticket, error, isLoading, refetch } = useGetTicketQuery(ticketId, { skip: !valid });

  const back = (
    <Link
      to="/tickets"
      className="mb-4 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
    >
      ← {t('detail.back')}
    </Link>
  );

  if (!valid) {
    return (
      <>
        {back}
        <ErrorState title={t('detail.notFound')} />
      </>
    );
  }
  if (isLoading) return <DetailSkeleton />;
  if (error || !ticket || !role) {
    const notFound = !!error && 'status' in error && error.status === 404;
    return (
      <>
        {back}
        <div className="card">
          <ErrorState
            title={notFound ? t('detail.notFound') : t('detail.loadError')}
            error={error}
            onRetry={notFound ? undefined : () => void refetch()}
          />
        </div>
      </>
    );
  }

  const isStaff = role === 'agente' || role === 'admin';

  return (
    <>
      {back}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <article className="card p-6">
            <p className="font-mono text-xs text-ink-400">#{ticket.id}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              {ticket.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="badge bg-ink-100 text-ink-700 ring-ink-300/50 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-600">
                {t(`category.${ticket.category}`)}
              </span>
              <span className="badge bg-ink-100 text-ink-700 ring-ink-300/50 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-600">
                {t(`tier.${ticket.tier}`)}
              </span>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
            <p className="mt-5 text-xs text-ink-400">
              {t('detail.createdBy', { name: ticket.created_by.name })} ·{' '}
              {formatDateTime(ticket.created_at, i18n.language)}
            </p>
          </article>
          <CommentThread ticketId={ticket.id} comments={ticket.comments} canInternal={isStaff} />
          <ActivityTimeline history={ticket.history} />
        </div>
        <aside className="space-y-6">
          <SlaPanel ticket={ticket} />
          <section aria-labelledby="info-title" className="card p-5">
            <h2 id="info-title" className="mb-3 font-bold">
              {t('detail.details')}
            </h2>
            <dl className="space-y-2 text-sm">
              {(
                [
                  [t('detail.assignedTo'), ticket.assigned_to?.name ?? t('common.unassigned')],
                  [t('detail.created'), formatDateTime(ticket.created_at, i18n.language)],
                  [t('detail.updated'), formatDateTime(ticket.updated_at, i18n.language)],
                  [
                    t('detail.firstResponse'),
                    formatDateTime(ticket.first_response_at, i18n.language),
                  ],
                  [t('detail.resolved'), formatDateTime(ticket.resolved_at, i18n.language)],
                  [t('detail.closed'), formatDateTime(ticket.closed_at, i18n.language)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-ink-500 dark:text-ink-400">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <ManagePanel ticket={ticket} role={role} />
        </aside>
      </div>
    </>
  );
}
