import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { TOKEN_KEY } from '../store/authSlice';
import { demoUser, jsonResponse, renderWithProviders } from '../test/utils';

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tickets" element={<p>tickets-home</p>} />
    </Routes>,
    { route: '/login' },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('shows validation errors and does not call the network when empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('logs in with a mocked API and redirects', async () => {
    const u = demoUser('agente');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ user: u, access_token: 'jwt-123' }));
    const user = userEvent.setup();
    const { store } = renderLogin();
    await user.type(screen.getByLabelText('Email'), 'agente@demo.com');
    await user.type(screen.getByLabelText('Password'), 'Demo1234!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('tickets-home')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.token).toBe('jwt-123');
    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-123'));
  });

  it('shows the backend error on invalid credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ error: 'Invalid credentials' }, 401),
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });
});
