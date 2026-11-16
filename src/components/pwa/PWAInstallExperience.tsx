import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  RefreshCw,
  Share,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
  PlusSquare,
  Menu,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'menu-item' | 'pill';
  className?: string;
  label?: string;
  onAfterAction?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  label = 'Install App',
  onAfterAction,
}) => {
  const {
    canInstallPrompt,
    isStandalone,
    isInstalled,
    isIOS,
    triggerNativeInstall,
    trackTelemetry,
  } = usePWAInstall();

  if (isStandalone || isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (canInstallPrompt) {
      const outcome = await triggerNativeInstall();
      if (outcome !== 'unavailable') {
        onAfterAction?.();
        return;
      }
    }
    if (isIOS) {
      void trackTelemetry('ios_guide_opened');
    }
    window.dispatchEvent(new CustomEvent('edusmart:open-pwa-install'));
    onAfterAction?.();
  };

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#0B3075] hover:bg-blue-50 cursor-pointer ${className}`}
        role="menuitem"
      >
        <Download className="h-4 w-4 shrink-0 text-[#0B3075]" />
        <span>INSTALL EDUSMART APP</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B3075] hover:bg-[#072357] text-white font-bold text-xs shadow-xs transition-all cursor-pointer min-h-[40px] ${className}`}
        title="Install EduSmart LMS App on this device"
      >
        <Download className="w-3.5 h-3.5 shrink-0 text-[#F5A623]" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#0B3075]/20 bg-blue-50/90 hover:bg-[#0B3075] text-[#0B3075] hover:text-white font-bold text-xs transition-all cursor-pointer min-h-[40px] ${className}`}
      title="Install EduSmart LMS directly onto your phone or computer"
    >
      <Download className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
};

interface PWAInstallInvitationProps {
  suppressAutoShow?: boolean;
}

export const PWAInstallInvitation: React.FC<PWAInstallInvitationProps> = ({
  suppressAutoShow = false,
}) => {
  const {
    canInstallPrompt,
    isStandalone,
    isInstalled,
    isIOS,
    isAndroid,
    browserFamily,
    dismissedRecently,
    appVersion,
    triggerNativeInstall,
    dismissPrompt,
    trackTelemetry,
  } = usePWAInstall();

  const [isVisible, setIsVisible] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'android' | 'ios'>(() => (isIOS ? 'ios' : 'android'));
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [promptTrackedThisSession, setPromptTrackedThisSession] = useState(false);

  useEffect(() => {
    setGuideTab(isIOS ? 'ios' : 'android');
  }, [isIOS]);

  // Listen for explicit "Install App" button triggers from headers/menus
  useEffect(() => {
    const handleOpen = () => {
      if (isStandalone || isInstalled) return;
      setInstallFeedback(null);
      setGuideTab(isIOS ? 'ios' : 'android');
      setShowInstructionsModal(true);
      setIsVisible(false);
      if (isIOS) {
        void trackTelemetry('ios_guide_opened');
      }
    };
    window.addEventListener('edusmart:open-pwa-install', handleOpen);
    return () => window.removeEventListener('edusmart:open-pwa-install', handleOpen);
  }, [isIOS, isInstalled, isStandalone, trackTelemetry]);

  // Smart non-obstructive arrival timing (never blocks login or immediate navigation)
  useEffect(() => {
    if (suppressAutoShow || isStandalone || isInstalled || dismissedRecently) {
      setIsVisible(false);
      return;
    }

    const isMobileLike =
      isIOS ||
      isAndroid ||
      (typeof window !== 'undefined' && window.innerWidth <= 1024);

    if (!canInstallPrompt && !isMobileLike) {
      return;
    }

    const delayMs = canInstallPrompt ? 2600 : 4200;
    const timer = setTimeout(() => {
      if (!isStandalone && !isInstalled && !dismissedRecently && !suppressAutoShow) {
        setIsVisible(true);
        if (!promptTrackedThisSession) {
          setPromptTrackedThisSession(true);
          void trackTelemetry('prompt_shown');
        }
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [
    canInstallPrompt,
    dismissedRecently,
    isAndroid,
    isIOS,
    isInstalled,
    isStandalone,
    promptTrackedThisSession,
    suppressAutoShow,
    trackTelemetry,
  ]);

  if (isStandalone || isInstalled) {
    return null;
  }

  const handleInstallAction = async () => {
    setInstallFeedback(null);
    if (canInstallPrompt) {
      const result = await triggerNativeInstall();
      if (result === 'accepted') {
        setInstallFeedback('EduSmart LMS is installing onto your device home screen.');
        setTimeout(() => {
          setIsVisible(false);
          setShowInstructionsModal(false);
        }, 1800);
        return;
      }
      if (result === 'dismissed') {
        setIsVisible(false);
        setShowInstructionsModal(false);
        return;
      }
    }

    // Show tailored Android Chrome / Samsung Internet or iOS Safari guide
    setGuideTab(isIOS ? 'ios' : 'android');
    setShowInstructionsModal(true);
    setIsVisible(false);
    if (isIOS) {
      void trackTelemetry('ios_guide_opened');
    }
  };

  const handleNotNow = () => {
    dismissPrompt(7);
    setIsVisible(false);
    setShowInstructionsModal(false);
  };

  return (
    <>
      {/* Intelligent Floating Installation Card (Non-blocking on desktop bottom-right / compact mobile card) */}
      {isVisible && !showInstructionsModal && (
        <aside
          aria-label="Install EduSmart LMS Application"
          className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-5 sm:right-5 sm:w-[410px] z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0 shadow-xs flex items-center justify-center">
              <img
                src="/pwa-192x192.png"
                alt="EduSmart LMS Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B3075] leading-tight">
                    EduSmart LMS App
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500">
                    edusmart.co.ke · v{appVersion}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNotNow}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  aria-label="Close installation invitation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                Welcome to EduSmart LMS. Install our application for faster, easier and more convenient access to your school's digital learning environment.
              </p>

              {isIOS && (
                <div className="mt-2 rounded-xl bg-blue-50/90 border border-blue-100 px-3 py-2 text-[11px] text-[#0B3075] leading-snug">
                  <strong>iPhone / iPad:</strong> Tap <Share className="inline w-3.5 h-3.5 mx-0.5 text-blue-700" /> <strong>Share</strong>, then tap <strong>Add to Home Screen</strong>.
                </div>
              )}

              {installFeedback && (
                <p className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{installFeedback}</span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleInstallAction()}
                  className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-[#0B3075] hover:bg-[#072357] active:bg-[#051a43] text-white font-extrabold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-[#F5A623] shrink-0" />
                  <span>INSTALL EDUSMART APP</span>
                </button>

                <button
                  type="button"
                  onClick={handleNotNow}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Full Installation Invitation & Device Guide Modal (Opened explicitly or for iOS/Android manual guidance) */}
      {showInstructionsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowInstructionsModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B3075] to-[#12429c] text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white p-1 shrink-0 shadow-sm flex items-center justify-center">
                  <img
                    src="/pwa-192x192.png"
                    alt="EduSmart LMS Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h2 id="pwa-install-modal-title" className="text-base font-extrabold tracking-tight truncate">
                    Install EduSmart LMS
                  </h2>
                  <p className="text-[11px] text-blue-100 truncate">
                    Official Mobile &amp; Desktop School App · edusmart.co.ke
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Close installation guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-left">
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Welcome to EduSmart LMS. Install our application for faster, easier and more convenient access to your school's digital learning environment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Same live school account, grades, fees &amp; classrooms</span>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-[#0B3075] shrink-0 mt-0.5" />
                  <span className="text-slate-700">Launches full-screen from your Home Screen icon</span>
                </div>
              </div>

              {canInstallPrompt && (
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 space-y-2.5">
                  <p className="text-xs font-bold text-[#0B3075]">
                    Your device supports one-tap installation:
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleInstallAction()}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0B3075] hover:bg-[#072357] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#F5A623]" />
                    <span>INSTALL EDUSMART APP</span>
                  </button>
                </div>
              )}

              {/* Platform Instruction Switcher */}
              <div>
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGuideTab('android')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      guideTab === 'android'
                        ? 'bg-white text-[#0B3075] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Android (Chrome / Samsung)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('ios')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      guideTab === 'ios'
                        ? 'bg-white text-[#0B3075] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    iPhone &amp; iPad (Safari)
                  </button>
                </div>

                {guideTab === 'android' ? (
                  <ol className="mt-3 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                      <span className="w-6 h-6 rounded-full bg-[#0B3075] text-white font-extrabold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {browserFamily === 'samsung_internet'
                            ? 'Tap Install App or the Samsung Internet menu'
                            : 'Tap INSTALL EDUSMART APP or the browser menu (⋮)'}
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          In Android Chrome or Samsung Internet, tap <Menu className="inline w-3.5 h-3.5" /> menu or the address bar install icon.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                      <span className="w-6 h-6 rounded-full bg-[#0B3075] text-white font-extrabold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">Select "Install app" or "Add to Home screen"</p>
                        <p className="text-slate-600 mt-0.5">
                          Confirm installation when Android displays the EduSmart LMS installation dialog.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">Launch EduSmart from your App Drawer</p>
                        <p className="text-slate-600 mt-0.5">
                          Open the installed <strong>EduSmart</strong> icon anytime and sign in with your normal school account.
                        </p>
                      </div>
                    </li>
                  </ol>
                ) : (
                  <ol className="mt-3 space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                      <span className="w-6 h-6 rounded-full bg-[#0B3075] text-white font-extrabold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          Open www.edusmart.co.ke in Safari
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          If you opened this page inside WhatsApp or another app, tap Open in Safari first.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                      <span className="w-6 h-6 rounded-full bg-[#0B3075] text-white font-extrabold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <span>Tap Share</span>
                          <Share className="w-3.5 h-3.5 text-blue-600" />
                          <span>→ Add to Home Screen</span>
                          <PlusSquare className="w-3.5 h-3.5 text-blue-600" />
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          Tap the Safari Share icon at the bottom (iPhone) or top right (iPad), scroll down, select <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <span>Launch EduSmart as a Standalone App</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          Return to your iPhone or iPad Home Screen and tap the <strong>EduSmart</strong> icon to run full-screen without Safari address bars.
                        </p>
                      </div>
                    </li>
                  </ol>
                )}
              </div>

              {installFeedback && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{installFeedback}</span>
                </p>
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleNotNow}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Not Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstructionsModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B3075] hover:bg-[#072357] text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAUpdateAndOfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { needRefresh, applyUpdate, appVersion } = usePWAInstall();
  const [updating, setUpdating] = useState(false);

  if (isOnline && !needRefresh) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      {!isOnline && (
        <div
          role="status"
          className="bg-amber-50 border-b border-amber-200 text-amber-950 px-3 py-2 text-xs flex items-center justify-center gap-2 text-center"
        >
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="font-semibold">
            You are offline — cached app screens remain accessible while school records safely await reconnection.
          </span>
        </div>
      )}

      {needRefresh && (
        <div
          role="alert"
          className="bg-[#0B3075] text-white px-3 sm:px-5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#F5A623] shrink-0" />
            <span className="font-bold">
              A newer version of EduSmart LMS (v{appVersion}) is available. Refresh to load the latest features safely.
            </span>
          </div>
          <button
            type="button"
            disabled={updating}
            onClick={() => {
              setUpdating(true);
              void applyUpdate();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5A623] hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer disabled:opacity-60 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
            <span>{updating ? 'Updating...' : 'Update Now'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
