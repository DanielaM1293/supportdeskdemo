import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'react-router-dom';
import { FiltersBar } from '../components/tickets/FiltersBar';
import { renderWithProviders } from '../test/utils';

function Harness() {
  const [params] = useSearchParams();
  return (
    <>
      <FiltersBar />
      <output data-testid="qs">{params.toString()}</output>
    </>
  );
}

describe('FiltersBar', () => {
  it('writes selected filters to the URL and resets the page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { route: '/tickets?page=3' });
    await user.selectOptions(screen.getByLabelText('Status'), 'abierto');
    const qs = new URLSearchParams(screen.getByTestId('qs').textContent ?? '');
    expect(qs.get('status')).toBe('abierto');
    expect(qs.has('page')).toBe(false);
  });

  it('initialises controls from the URL and clears them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { route: '/tickets?priority=alta' });
    expect(screen.getByLabelText('Priority')).toHaveValue('alta');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByTestId('qs')).toHaveTextContent('');
  });

  it('debounces the search text into the q param', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />, { route: '/tickets' });
    await user.type(screen.getByRole('searchbox'), 'vpn');
    await vi.waitFor(() => expect(screen.getByTestId('qs')).toHaveTextContent('q=vpn'));
  });
});
