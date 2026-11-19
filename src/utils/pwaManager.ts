import { registerSW } from 'virtual:pwa-register';
import { ClientDataStore } from './clientDataStore';

export type PwaDeviceCategory =
  | 'android_phone'
  | 'iphone'
  | 'android_tablet'
  | 'ipad'
  | 'desktop'
  | 'other';

export type PwaBrowserFamily =
  | 'chrome'
  | 'samsung_internet'
  | 'safari'
  | 'edge'
  | 'firefox'
  | 'other';

export type PwaTelemetryEvent =
  | 'installed'
  | 'standalone_launch'
  | 'prompt_shown'
  | 'prompt_accepted'
  | 'prompt_dismissed'
  | 'ios_guide_opened';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export interface PwaRuntimeState {
  canInstallPrompt: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  deviceCategory: PwaDeviceCategory;
  browserFamily: PwaBrowserFamily;
  needRefresh: boolean;
  offlineReady: boolean;
  swRegistered: boolean;
  dismissedRecently: boolean;
  appVersion: string;
}

const DISMISS_COOKIE = 'edusmart_pwa_dismiss_until';
const INSTALLED_COOKIE = 'edusmart_pwa_installed';
const INSTALL_ID_COOKIE = 'edusmart_pwa_install_uid';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const APP_VERSION =
  typeof __EDUSMART_APP_VERSION__ !== 'undefined' ? __EDUSMART_APP_VERSION__ : '2.0.0';

let initialized = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let needRefresh = false;
let offlineReady = false;
let swRegistered = false;
let relatedAppInstalled = false;
let standaloneTelemetrySent = false;
let dismissedInMemoryUntil = 0;
let installedInMemory = false;

const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore subscriber errors
    }
  }
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureAttr}`;
}

function getOrCreateInstallId(): string {
  const existing = readCookie(INSTALL_ID_COOKIE);
  if (existing) return existing;
  const pref = ClientDataStore.getPreference<string>(INSTALL_ID_COOKIE, '');
  if (pref) return pref;
  const generated =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? `inst-${crypto.randomUUID()}`
      : `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  writeCookie(INSTALL_ID_COOKIE, generated, 60 * 60 * 24 * 365 * 2);
  ClientDataStore.setPreference(INSTALL_ID_COOKIE, generated);
  return generated;
}

export function detectDeviceAndBrowser(): {
  isIOS: boolean;
  isAndroid: boolean;
  deviceCategory: PwaDeviceCategory;
  browserFamily: PwaBrowserFamily;
} {
  if (typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      deviceCategory: 'desktop',
      browserFamily: 'other',
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouch = typeof navigator.maxTouchPoints === 'number' ? navigator.maxTouchPoints : 0;

  const isIPhone = /iPhone|iPod/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(platform) && maxTouch > 1);
  const isIOS = isIPhone || isIPad;
  const isAndroid = /Android/i.test(ua);

  let deviceCategory: PwaDeviceCategory = 'desktop';
  if (isIPad) {
    deviceCategory = 'ipad';
  } else if (isIPhone) {
    deviceCategory = 'iphone';
  } else if (isAndroid) {
    deviceCategory = /Mobile/i.test(ua) ? 'android_phone' : 'android_tablet';
  } else if (maxTouch > 0 && typeof window !== 'undefined' && window.innerWidth <= 1024) {
    deviceCategory = window.innerWidth <= 640 ? 'android_phone' : 'android_tablet';
  }

  let browserFamily: PwaBrowserFamily = 'other';
  if (/SamsungBrowser/i.test(ua)) {
    browserFamily = 'samsung_internet';
  } else if (/EdgA|EdgiOS|Edg\//i.test(ua)) {
    browserFamily = 'edge';
  } else if (/FxiOS|Firefox/i.test(ua)) {
    browserFamily = 'firefox';
  } else if (/CriOS|Chrome/i.test(ua) && !/OPR|Opera/i.test(ua)) {
    browserFamily = 'chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) {
    browserFamily = 'safari';
  }

  return { isIOS, isAndroid, deviceCategory, browserFamily };
}

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = Boolean((window.navigator as { standalone?: boolean }).standalone);
  return mediaStandalone || iosStandalone;
}

function isDismissedRecently(): boolean {
  const now = Date.now();
  if (dismissedInMemoryUntil > now) return true;
  const cookieVal = Number(readCookie(DISMISS_COOKIE) || '0');
  if (Number.isFinite(cookieVal) && cookieVal > now) return true;
  const prefVal = Number(ClientDataStore.getPreference<number>(DISMISS_COOKIE, 0) || '0');
  return Number.isFinite(prefVal) && prefVal > now;
}

function isPersistedInstalled(): boolean {
  if (installedInMemory || relatedAppInstalled) return true;
  if (readCookie(INSTALLED_COOKIE) === '1') return true;
  return Boolean(ClientDataStore.getPreference<boolean>(INSTALLED_COOKIE, false));
}

export function markPwaInstalled(): void {
  installedInMemory = true;
  writeCookie(INSTALLED_COOKIE, '1', 60 * 60 * 24 * 365 * 2);
  ClientDataStore.setPreference(INSTALLED_COOKIE, true);
  notifyListeners();
}

export function dismissPwaPrompt(days: number = 7): void {
  const until = Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000;
  dismissedInMemoryUntil = until;
  writeCookie(DISMISS_COOKIE, String(until), Math.ceil(DISMISS_COOLDOWN_MS / 1000));
  ClientDataStore.setPreference(DISMISS_COOKIE, until);
  void sendPwaTelemetry('prompt_dismissed');
  notifyListeners();
}

export async function sendPwaTelemetry(eventType: PwaTelemetryEvent): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const { deviceCategory, browserFamily } = detectDeviceAndBrowser();
    const displayMode = checkIsStandalone() ? 'standalone' : 'browser';
    const installId = getOrCreateInstallId();

    await fetch('/api/pwa/telemetry', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: ClientDataStore.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        eventType,
        deviceCategory,
        browserFamily,
        displayMode,
        appVersion: APP_VERSION,
        installId,
      }),
    });
  } catch {
    // Non-blocking telemetry: never interrupt user flow
  }
}

export function getPwaState(): PwaRuntimeState {
  const { isIOS, isAndroid, deviceCategory, browserFamily } = detectDeviceAndBrowser();
  const isStandalone = checkIsStandalone();
  const isInstalled = isStandalone || isPersistedInstalled();

  return {
    canInstallPrompt: Boolean(deferredPrompt) && !isInstalled,
    isStandalone,
    isInstalled,
    isIOS,
    isAndroid,
    deviceCategory,
    browserFamily,
    needRefresh,
    offlineReady,
    swRegistered,
    dismissedRecently: isDismissedRecently(),
    appVersion: APP_VERSION,
  };
}

export function subscribePwaState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function triggerNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable';
  }
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      markPwaInstalled();
      void sendPwaTelemetry('prompt_accepted');
      void sendPwaTelemetry('installed');
      return 'accepted';
    }
    dismissPwaPrompt(7);
    return 'dismissed';
  } catch {
    notifyListeners();
    return 'unavailable';
  }
}

export async function applyPwaUpdate(): Promise<void> {
  if (updateSWFn) {
    await updateSWFn(true);
    return;
  }
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export async function checkForPwaUpdate(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    await reg.update();
    if (reg.waiting) {
      needRefresh = true;
      notifyListeners();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function initPwaLifecycle(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 1. Capture Android Chromium / Samsung Internet / Edge install prompt immediately
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  // 2. Detect successful installation across supported browsers
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    markPwaInstalled();
    void sendPwaTelemetry('installed');
  });

  // 3. Detect display-mode changes & record standalone launch
  const standaloneMql = window.matchMedia?.('(display-mode: standalone)');
  if (standaloneMql && typeof standaloneMql.addEventListener === 'function') {
    standaloneMql.addEventListener('change', (evt) => {
      if (evt.matches) {
        markPwaInstalled();
      }
      notifyListeners();
    });
  }

  if (checkIsStandalone()) {
    markPwaInstalled();
    if (!standaloneTelemetrySent) {
      standaloneTelemetrySent = true;
      void sendPwaTelemetry('standalone_launch');
    }
  }

  // 4. Chromium getInstalledRelatedApps check to avoid prompting already-installed users
  const navAny = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string }>>;
  };
  if (typeof navAny.getInstalledRelatedApps === 'function') {
    navAny
      .getInstalledRelatedApps()
      .then((apps) => {
        if (Array.isArray(apps) && apps.length > 0) {
          relatedAppInstalled = true;
          markPwaInstalled();
        }
      })
      .catch(() => {
        // unsupported context or permission policy
      });
  }

  // 5. Register production Workbox Service Worker with safe update notification
  if ('serviceWorker' in navigator) {
    updateSWFn = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh = true;
        notifyListeners();
      },
      onOfflineReady() {
        offlineReady = true;
        notifyListeners();
      },
      onRegisteredSW(_swUrl, registration) {
        swRegistered = true;
        notifyListeners();
        if (registration) {
          // Periodic background update checks (every 30 mins when online)
          setInterval(() => {
            if (navigator.onLine) {
              void registration.update().catch(() => {});
            }
          }, 30 * 60 * 1000);
        }
      },
      onRegisterError(err) {
        console.warn('[EduSmart PWA] Service Worker registration warning:', err);
      },
    });

    // Check for updates whenever user switches back to the app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void checkForPwaUpdate();
      }
    });
  }
}
