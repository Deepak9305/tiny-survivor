import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/compact-landscape.css';
import './styles/phone-polish.css';
import './styles/combat-controls.css';
import './styles/fun-overhaul.css';
import './styles/premium-studio.css';
import './styles/studio-mobile-master.css';
import './styles/studio-final.css';
import './styles/studio-v3-integrations.css';
import './styles/anti-slop.css';
import './styles/combat-depth-overhaul.css';
import './styles/home-studio-redesign.css';
import './styles/three-model-restoration.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
