import { useTranslation } from 'react-i18next';
import { useGetDashboardQuery } from '../api/dashboardApi';
import { CATEGORIES, PRIORITIES, STATUSES } from '../types';
import { BarChart } from '../components/charts/BarChart';
import { DoughnutChart } from '../components/charts/DoughnutChart';
import type { ChartDatum } from '../components/charts/ChartCard';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui/Feedback';

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
        {label}
      </dt>
      <dd className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { data, error, isLoading, refetch } = useGetDashboardQuery();

  const series = <K extends string>(
    keys: readonly K[],
    map: Partial<Record<K, number>>,
    ns: string,
  ) => keys.map((k): ChartDatum => ({ label: t(`${ns}.${k}`), value: map[k] ?? 0 }));

  const fmt = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });

  return (
    <>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      {isLoading ? (
        <div role="status" aria-label={t('common.loading')} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <ErrorState
            title={t('dashboard.loadError')}
            error={error}
            onRetry={() => void refetch()}
          />
        </div>
      ) : data && data.total === 0 ? (
        <div className="card">
          <EmptyState title={t('dashboard.empty')} hint={t('dashboard.emptyHint')} />
        </div>
      ) : data ? (
        <div className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label={t('dashboard.total')} value={fmt.format(data.total)} />
            <Kpi label={t('dashboard.open')} value={fmt.format(data.open_count)} />
            <Kpi label={t('dashboard.breached')} value={fmt.format(data.breached_count)} />
            <Kpi
              label={t('dashboard.avgResolution')}
              value={
                data.avg_resolution_hours === null
                  ? t('dashboard.notAvailable')
                  : t('dashboard.hours', { value: fmt.format(data.avg_resolution_hours) })
              }
            />
            <Kpi
              label={t('dashboard.compliance')}
              value={
                data.sla_compliance_pct === null
                  ? t('dashboard.notAvailable')
                  : `${fmt.format(data.sla_compliance_pct)}%`
              }
            />
          </dl>
          <div className="grid gap-4 lg:grid-cols-3">
            <DoughnutChart
              title={t('dashboard.byStatus')}
              data={series(STATUSES, data.by_status, 'status')}
            />
            <BarChart
              title={t('dashboard.byCategory')}
              data={series(CATEGORIES, data.by_category, 'category')}
            />
            <BarChart
              title={t('dashboard.byPriority')}
              data={series(PRIORITIES, data.by_priority, 'priority')}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
