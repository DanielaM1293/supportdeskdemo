import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { ChartCard, type ChartDatum } from './ChartCard';
import { getPalette } from './chartSetup';

export function BarChart({ title, data }: { title: string; data: ChartDatum[] }) {
  const { t } = useTranslation();
  const dark = useAppSelector((s) => s.theme.mode === 'dark');
  const p = getPalette(dark);
  return (
    <ChartCard title={title} data={data}>
      <Bar
        aria-hidden="true"
        data={{
          labels: data.map((d) => d.label),
          datasets: [
            {
              label: t('dashboard.tickets'),
              data: data.map((d) => d.value),
              backgroundColor: p.series[0],
              borderRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: p.text }, grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: { color: p.text, precision: 0 },
              grid: { color: p.grid },
            },
          },
        }}
      />
    </ChartCard>
  );
}
