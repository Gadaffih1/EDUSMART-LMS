import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { OfflineCacheManager } from './utils/offlineCacheManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Register PWA Service Worker for offline CBC materials caching
OfflineCacheManager.registerServiceWorker();

function mount() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
