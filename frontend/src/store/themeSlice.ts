import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { safeGet, safeSet } from '../utils/storage';

export type ThemeMode = 'light' | 'dark';
export const THEME_KEY = 'sd_theme';

export function detectInitialTheme(): ThemeMode {
  const stored = safeGet(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: () => ({ mode: detectInitialTheme() }),
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      safeSet(THEME_KEY, action.payload);
      applyTheme(action.payload);
    },
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      safeSet(THEME_KEY, state.mode);
      applyTheme(state.mode);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
