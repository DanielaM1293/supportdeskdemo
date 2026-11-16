import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from '../pages/UsersPage';
import { authedState, demoUser, jsonResponse, renderWithProviders } from '../test/utils';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UsersPage', () => {
  const other = { ...demoUser('usuario'), id: 2, name: 'Other', email: 'other@demo.com' };
  const me = { ...demoUser('admin'), id: 1, name: 'Boss' };

  it('disables controls for the current user and shows backend errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const req = input as Request;
      if (req.method === 'PATCH') return jsonResponse({ error: 'Cannot do that' }, 400);
      return jsonResponse({ items: [me, other] });
    });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />, {
      preloadedState: { auth: { token: 't', user: me } },
    });

    const selfRow = (await screen.findByText('Boss')).closest('tr') as HTMLElement;
    expect(within(selfRow).getByRole('combobox')).toBeDisabled();
    expect(within(selfRow).getByRole('switch')).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Change role for Other'), 'agente');
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot do that');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('renders an error state with retry when loading fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'Boom' }, 500));
    renderWithProviders(<UsersPage />, { preloadedState: authedState('admin') });
    expect(await screen.findByText('Could not load users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
