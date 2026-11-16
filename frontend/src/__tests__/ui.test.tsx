import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination, pageWindow } from '../components/tickets/Pagination';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import NotFoundPage from '../pages/NotFoundPage';
import { renderWithProviders } from '../test/utils';
import { formatRelative, remainingTime } from '../utils/time';

describe('Pagination', () => {
  it('summarises the range and navigates', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <Pagination page={2} pages={5} total={47} perPage={10} onPageChange={onPageChange} />,
    );
    expect(screen.getByText('Showing 11-20 of 47')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('disables previous on the first page and next on the last', () => {
    const { unmount } = renderWithProviders(
      <Pagination page={1} pages={3} total={25} perPage={10} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    unmount();
    renderWithProviders(
      <Pagination page={3} pages={3} total={25} perPage={10} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('builds a compact page window with gaps', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(6, 12)).toEqual([1, 2, 'gap', 5, 6, 7, 'gap', 11, 12]);
  });
});

describe('language switch', () => {
  it('changes the visible text between English and Spanish', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LanguageSwitcher />
        <NotFoundPage />
      </>,
      { lang: 'en' },
    );
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'es' }));
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'en' }));
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('theme toggle', () => {
  it('toggles the dark class on <html>', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />, { preloadedState: { theme: { mode: 'light' } } });
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });
});

describe('time utilities', () => {
  const now = new Date('2025-06-01T12:00:00Z');

  it('returns null without a deadline', () => {
    expect(remainingTime(null, 'en', now)).toBeNull();
  });

  it('reports future deadlines as not overdue', () => {
    const r = remainingTime('2025-06-01T15:00:00Z', 'en', now);
    expect(r?.overdue).toBe(false);
    expect(r?.diffMs).toBe(3 * 3_600_000);
    expect(r?.text).toBe('in 3 hours');
  });

  it('reports past deadlines as overdue', () => {
    const r = remainingTime('2025-05-30T12:00:00Z', 'en', now);
    expect(r?.overdue).toBe(true);
    expect(r?.text).toBe('2 days ago');
  });

  it('localizes relative text', () => {
    expect(formatRelative('2025-06-01T15:00:00Z', 'es', now)).toBe('dentro de 3 horas');
  });
});
