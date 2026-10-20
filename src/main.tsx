import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { isDemoMode } from './data/demo';

if (isDemoMode()) document.documentElement.dataset.demo = '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
