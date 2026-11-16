import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { ColdStartBanner } from './components/layout/ColdStartBanner';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ColdStartBanner />
    </BrowserRouter>
  );
}
