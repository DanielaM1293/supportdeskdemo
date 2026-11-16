import { Doughnut } from 'react-chartjs-2';
import { useAppSelector } from '../../store/hooks';
import { ChartCard, type ChartDatum } from './ChartCard';
import { getPalette } from './chartSetup';

export function DoughnutChart({ title, data }: { title: string; data: ChartDatum[] }) {
  const dark = useAppSelector((s) => s.theme.mode === 'dark');
  const p = getPalette(dark);
  return (
    <ChartCard title={title} data={data}>
      <Doughnut
        aria-hidden="true"
        data={{
          labels: data.map((d) => d.label),
          datasets: [
            {
              data: data.map((d) => d.value),
              backgroundColor: data.map((_, i) => p.series[i % p.series.length]),
              borderColor: p.surface,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: { legend: { position: 'bottom', labels: { color: p.text, boxWidth: 12 } } },
        }}
      />
    </ChartCard>
  );
}
