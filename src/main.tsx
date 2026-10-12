import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { OfflineCacheManager } from './utils/offlineCacheManager';

// Register PWA Service Worker for offline CBC materials caching
OfflineCacheManager.registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
