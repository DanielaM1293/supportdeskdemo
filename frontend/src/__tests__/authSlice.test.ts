import reducer, {
  credentialsSet,
  loadAuthState,
  loggedOut,
  TOKEN_KEY,
  USER_KEY,
  userUpdated,
} from '../store/authSlice';
import { demoUser } from '../test/utils';

const empty = { token: null, user: null };

describe('authSlice', () => {
  it('stores credentials and persists them in localStorage', () => {
    const user = demoUser('agente');
    const state = reducer(empty, credentialsSet({ user, token: 'abc' }));
    expect(state).toEqual({ token: 'abc', user });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
    expect(JSON.parse(localStorage.getItem(USER_KEY) ?? '{}')).toEqual(user);
  });

  it('updates the user and keeps storage in sync', () => {
    const user = { ...demoUser('admin'), name: 'Renamed' };
    const state = reducer({ token: 't', user: demoUser() }, userUpdated(user));
    expect(state.user?.name).toBe('Renamed');
    expect(JSON.parse(localStorage.getItem(USER_KEY) ?? '{}').name).toBe('Renamed');
  });

  it('clears state and storage on logout', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    localStorage.setItem(USER_KEY, '{}');
    const state = reducer({ token: 'abc', user: demoUser() }, loggedOut());
    expect(state).toEqual(empty);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('rehydrates from localStorage and tolerates corrupt user JSON', () => {
    expect(loadAuthState()).toEqual(empty);
    localStorage.setItem(TOKEN_KEY, 'abc');
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser()));
    expect(loadAuthState().token).toBe('abc');
    expect(loadAuthState().user?.email).toBe('usuario@demo.com');
    localStorage.setItem(USER_KEY, '{not json');
    expect(loadAuthState()).toEqual({ token: 'abc', user: null });
  });
});
