import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { initPwaLifecycle } from './utils/pwaManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SetPasswordPage } from './components/auth/SetPasswordPage';
import { ClientDataStore } from './utils/clientDataStore';
import type { User } from './types';
import { toAppPath } from './utils/appPath';

// Capture beforeinstallprompt & register PWA Service Worker immediately before hydration
initPwaLifecycle();

/** Lightweight boot placeholder — replaced by React on first render. */
function showBootSplash() {
  const el = document.getElementById('root');
  if (el && el.childElementCount === 0) {
    el.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#f8fafc;font-family:ui-sans-serif,system-ui,sans-serif">
        <div style="width:38px;height:38px;border-radius:50%;border:3px solid #cbd5e1;border-top-color:#2563eb;animation:edusmart-spin .8s linear infinite"></div>
        <p style="color:#475569;font-size:13px;font-weight:700;letter-spacing:.04em">SYNCING SCHOOL DATA…</p>
        <style>@keyframes edusmart-spin{to{transform:rotate(360deg)}}</style>
      </div>`;
  }
}

async function mount() {
  showBootSplash();
  if (toAppPath(window.location.pathname) === '/auth/setup-password') {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = '';
      createRoot(rootElement).render(
        <ErrorBoundary>
          <SetPasswordPage />
          <SpeedInsights />
        </ErrorBoundary>
      );
    }
    return;
  }

  // Always hydrate authoritative state and session from central backend SQLite database
  await Promise.race([
    ClientDataStore.hydrateFromBackend(true),
    new Promise((resolve) => setTimeout(resolve, 15000)),
  ]);

  const initialUser: User | null = ClientDataStore.getSessionUser();

  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = '';
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App initialUser={initialUser} />
        <SpeedInsights />
      </ErrorBoundary>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void mount());
} else {
  void mount();
}
