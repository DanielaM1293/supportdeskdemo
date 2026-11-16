import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';
import { safeGet, safeRemove, safeSet } from '../utils/storage';

export const TOKEN_KEY = 'sd_token';
export const USER_KEY = 'sd_user';

export interface AuthState {
  token: string | null;
  user: User | null;
}

export function loadAuthState(): AuthState {
  const token = safeGet(TOKEN_KEY);
  if (!token) return { token: null, user: null };
  try {
    const raw = safeGet(USER_KEY);
    return { token, user: raw ? (JSON.parse(raw) as User) : null };
  } catch {
    return { token, user: null };
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadAuthState,
  reducers: {
    credentialsSet(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      safeSet(TOKEN_KEY, action.payload.token);
      safeSet(USER_KEY, JSON.stringify(action.payload.user));
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
      safeSet(USER_KEY, JSON.stringify(action.payload));
    },
    loggedOut(state) {
      state.user = null;
      state.token = null;
      safeRemove(TOKEN_KEY);
      safeRemove(USER_KEY);
    },
  },
});

export const { credentialsSet, userUpdated, loggedOut } = authSlice.actions;
export default authSlice.reducer;
