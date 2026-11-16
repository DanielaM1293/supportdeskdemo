import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { setupStore } from '../store';
import type { RootState } from '../store';
import type { User } from '../types';
import '../i18n';
import i18n from '../i18n';

export const demoUser = (role: User['role'] = 'usuario'): User => ({
  id: 1,
  name: 'Demo',
  email: `${role}@demo.com`,
  role,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
});

export function authedState(role: User['role'] = 'usuario'): Partial<RootState> {
  return { auth: { token: 'tok', user: demoUser(role) } };
}

interface Options {
  route?: string;
  preloadedState?: Partial<RootState>;
  lang?: 'es' | 'en';
}

export function renderWithProviders(ui: ReactElement, opts: Options = {}) {
  const store = setupStore(opts.preloadedState);
  void i18n.changeLanguage(opts.lang ?? 'en');
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[opts.route ?? '/']}>{ui}</MemoryRouter>
    </Provider>,
  );
  return { store, ...utils };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
