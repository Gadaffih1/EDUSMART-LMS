import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ClientDataStore } from '../../utils/clientDataStore';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_COUNTDOWN_SECONDS = 60;

interface InactivityTimeoutModalProps {
  isActive: boolean;
  onLogout: () => void | Promise<void>;
}

export const InactivityTimeoutModal: React.FC<InactivityTimeoutModalProps> = ({
  isActive,
  onLogout,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_COUNTDOWN_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const warningDeadlineRef = useRef<number | null>(null);
  const logoutInvokedRef = useRef(false);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningDeadlineRef.current = null;
    logoutInvokedRef.current = false;
    setShowWarning(false);
    setSecondsLeft(WARNING_COUNTDOWN_SECONDS);
  }, []);

  const handleStayLoggedIn = useCallback(() => {
    resetActivityTimer();
    void fetch('/api/auth/me', {
      credentials: 'include',
      headers: ClientDataStore.getAuthHeaders(),
    }).catch(() => {
      // Keep session alive silently
    });
  }, [resetActivityTimer]);

  const invokeAutoLogout = useCallback(() => {
    if (logoutInvokedRef.current) return;
    logoutInvokedRef.current = true;
    setShowWarning(false);
    warningDeadlineRef.current = null;
    void onLogout();
  }, [onLogout]);

  useEffect(() => {
    if (!isActive) {
      setShowWarning(false);
      warningDeadlineRef.current = null;
      logoutInvokedRef.current = false;
      return;
    }

    lastActivityRef.current = Date.now();

    const recordActivity = () => {
      // Once the 60-second warning modal appears, require explicit "Stay Logged In" confirmation
      if (warningDeadlineRef.current !== null) return;
      lastActivityRef.current = Date.now();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'pointerdown',
    ];
    activityEvents.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      if (warningDeadlineRef.current === null) {
        if (now - lastActivityRef.current >= INACTIVITY_LIMIT_MS) {
          warningDeadlineRef.current = now + WARNING_COUNTDOWN_SECONDS * 1000;
          setSecondsLeft(WARNING_COUNTDOWN_SECONDS);
          setShowWarning(true);
        }
      } else {
        const remainingMs = warningDeadlineRef.current - now;
        const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsLeft(nextSeconds);
        if (remainingMs <= 0) {
          invokeAutoLogout();
        }
      }
    }, 500);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, recordActivity));
      window.clearInterval(intervalId);
    };
  }, [isActive, invokeAutoLogout]);

  if (!isActive || !showWarning) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-timeout-title"
      aria-describedby="inactivity-timeout-desc"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="inactivity-timeout-title" className="text-base font-extrabold text-slate-900">
              Session Inactivity Warning
            </h2>
            <p id="inactivity-timeout-desc" className="mt-1 text-xs leading-relaxed text-slate-600">
              You have been inactive for 30 minutes. For institutional security, your session will automatically sign out unless you choose to stay signed in.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Clock className="h-4 w-4 text-amber-700" />
            <span>Auto-logout countdown</span>
          </div>
          <span className="font-mono text-xl font-black tabular-nums text-amber-800">
            {secondsLeft}s
          </span>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={invokeAutoLogout}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Now</span>
          </button>
          <button
            type="button"
            onClick={handleStayLoggedIn}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-800 cursor-pointer"
            autoFocus
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
