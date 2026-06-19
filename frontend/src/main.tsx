import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const normalizeLegacyHashUrl = () => {
  const { pathname, hash, search } = window.location;
  if (pathname !== '/login' || !hash.startsWith('#/')) {
    return;
  }

  window.history.replaceState(null, '', `${search}${hash}`);
};

normalizeLegacyHashUrl();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
