import { screen } from '@testing-library/react';
import DashboardPage from '../pages/DashboardPage';
import { authedState, jsonResponse, renderWithProviders } from '../test/utils';

vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <canvas data-testid="chart" />,
  Bar: () => <canvas data-testid="chart" />,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const stats = {
  total: 12,
  open_count: 5,
  breached_count: 2,
  by_status: { abierto: 5, resuelto: 7 },
  by_category: { red: 4 },
  by_priority: { alta: 3 },
  avg_resolution_hours: null,
  sla_compliance_pct: 91.5,
};

describe('DashboardPage', () => {
  it('renders KPIs, N/A for null metrics and accessible chart tables', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(stats));
    renderWithProviders(<DashboardPage />, { preloadedState: authedState('agente') });
    expect(await screen.findByText('Total tickets')).toBeInTheDocument();
    expect(screen.getByText('91.5%')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getAllByTestId('chart')).toHaveLength(3);
    expect(screen.getAllByRole('table')).toHaveLength(3);
  });

  it('shows an empty state without tickets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ...stats, total: 0 }));
    renderWithProviders(<DashboardPage />, { preloadedState: authedState('agente') });
    expect(await screen.findByText('No tickets yet')).toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'down' }, 500));
    renderWithProviders(<DashboardPage />, { preloadedState: authedState('agente') });
    expect(await screen.findByRole('alert')).toHaveTextContent('down');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
