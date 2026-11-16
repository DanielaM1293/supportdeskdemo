import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './i18n';
import './index.css';
import { store } from './store';
import { applyTheme } from './store/themeSlice';
import App from './App';

// Apply the persisted theme before the first render to avoid a flash.
applyTheme(store.getState().theme.mode);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
