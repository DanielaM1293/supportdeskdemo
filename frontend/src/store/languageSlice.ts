import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import i18n, { detectLanguage, type Language } from '../i18n';

const languageSlice = createSlice({
  name: 'language',
  initialState: () => ({ current: detectLanguage() }),
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.current = action.payload;
      // i18next persists the choice in localStorage via the language detector.
      void i18n.changeLanguage(action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
