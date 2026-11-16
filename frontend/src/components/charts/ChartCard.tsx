import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface ChartDatum {
  label: string;
  value: number;
}

/** Card wrapper that gives a chart an accessible name and a visually hidden data table. */
export function ChartCard({
  title,
  data,
  children,
}: {
  title: string;
  data: ChartDatum[];
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="card p-5" aria-label={title}>
      <h2 className="mb-4 text-sm font-bold text-ink-700 dark:text-ink-100">{title}</h2>
      <div
        role="img"
        aria-label={`${t('dashboard.chartLabel', { title })}. ${data
          .map((d) => `${d.label}: ${d.value}`)
          .join(', ')}`}
        className="relative h-64"
      >
        {children}
      </div>
      <table className="sr-only">
        <caption>{t('dashboard.chartData', { title })}</caption>
        <thead>
          <tr>
            <th scope="col">{t('dashboard.item')}</th>
            <th scope="col">{t('dashboard.count')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
