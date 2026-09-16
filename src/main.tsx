import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/compact-landscape.css';
import './styles/phone-polish.css';
import './styles/combat-controls.css';
import './styles/fun-overhaul.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
