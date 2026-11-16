import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireRole } from '../components/layout/Guards';
import { authedState, demoUser, jsonResponse, renderWithProviders } from '../test/utils';

function Tree() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<p>login-page</p>} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/tickets" element={<p>tickets-page</p>} />
        <Route element={<RequireRole roles={['admin']} />}>
          <Route path="/users" element={<p>users-page</p>} />
        </Route>
      </Route>
    </Routes>
  );
}

beforeEach(() => {
  // RequireAuth refreshes the user through /auth/me; answer with the preloaded role.
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    const role = lastRole;
    return jsonResponse(demoUser(role));
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

let lastRole: 'usuario' | 'agente' | 'admin' = 'usuario';

describe('route guards', () => {
  it('redirects unauthenticated visitors to /login', () => {
    renderWithProviders(<Tree />, { route: '/tickets' });
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('redirects non-admins away from /users', async () => {
    lastRole = 'usuario';
    renderWithProviders(<Tree />, { route: '/users', preloadedState: authedState('usuario') });
    expect(await screen.findByText('tickets-page')).toBeInTheDocument();
    expect(screen.queryByText('users-page')).not.toBeInTheDocument();
  });

  it('lets admins into /users', async () => {
    lastRole = 'admin';
    renderWithProviders(<Tree />, { route: '/users', preloadedState: authedState('admin') });
    expect(await screen.findByText('users-page')).toBeInTheDocument();
  });

  it('sends logged-in users away from /login', async () => {
    lastRole = 'usuario';
    renderWithProviders(<Tree />, { route: '/login', preloadedState: authedState('usuario') });
    expect(await screen.findByText('tickets-page')).toBeInTheDocument();
  });
});
