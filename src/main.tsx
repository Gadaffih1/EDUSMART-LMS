import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { OfflineCacheManager } from './utils/offlineCacheManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SetPasswordPage } from './components/auth/SetPasswordPage';
import { SyncEngine } from './utils/syncEngine';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { getAuthenticatedAppUser } from './utils/supabaseAuth';
import { Storage } from './utils/storage';
import type { User } from './types';

// Register PWA Service Worker for offline CBC materials caching
OfflineCacheManager.registerServiceWorker();

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
  if (window.location.pathname === '/auth/setup-password') {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = '';
      createRoot(rootElement).render(
        <ErrorBoundary>
          <SetPasswordPage />
        </ErrorBoundary>
      );
    }
    return;
  }
  let initialUser: User | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        initialUser = await getAuthenticatedAppUser();
        if (initialUser) {
          Storage.setCurrentUser(initialUser);
        }
      }
    } catch (err) {
      console.warn('[auth] Unable to restore the Supabase session, falling back to local user session', err);
    }

    if (!initialUser) {
      initialUser = Storage.getCurrentUser();
      if (initialUser) {
        SyncEngine.activateIdentity(initialUser.id, initialUser.schoolId);
      }
    }

    if (initialUser) {
      await Promise.race([
        SyncEngine.hydrate(),
        new Promise(resolve => setTimeout(resolve, 6000)),
      ]);
    }
  } else {
    initialUser = Storage.getCurrentUser();
  }

  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = '';
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App initialUser={initialUser} />
      </ErrorBoundary>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void mount());
} else {
  void mount();
}
