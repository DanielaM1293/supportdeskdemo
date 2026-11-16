import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

// Register only what the dashboard uses so the bundle stays tree-shakable.
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface ChartPalette {
  text: string;
  grid: string;
  surface: string;
  series: string[];
}

export function getPalette(dark: boolean): ChartPalette {
  return {
    text: dark ? '#b4b9cc' : '#4a4f68',
    grid: dark ? 'rgba(180,185,204,0.15)' : 'rgba(23,25,40,0.08)',
    surface: dark ? '#242738' : '#ffffff',
    series: dark
      ? ['#818cf8', '#a78bfa', '#fbbf24', '#34d399', '#94a3b8']
      : ['#4f46e5', '#7c3aed', '#d97706', '#059669', '#64748b'],
  };
}
