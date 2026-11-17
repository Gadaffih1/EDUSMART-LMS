import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Database,
  Fingerprint,
} from 'lucide-react';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { User } from '../../types';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { ClientDataStore } from '../../utils/clientDataStore';
import { PWAInstallButton } from '../pwa/PWAInstallExperience';

interface UnifiedLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
  onOpenRegisterSchool?: () => void;
  adminOnly?: boolean;
}

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  adminOnly = false,
}) => {
  const { currentTenant, switchTenant } = useTenant();

  // Sign In Form State (Strictly Assigned Institutional Email & Password or Registered Biometric Passkey)
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBiometricPending, setIsBiometricPending] = useState<boolean>(false);

  const webAuthnSupported = typeof window !== 'undefined' && browserSupportsWebAuthn();

  const handlePasswordRecovery = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const email = identifier.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Enter your school account email address first.');
      return;
    }
    setInfoMessage(
      'Password resets are managed securely by your School Administrator or Registrar. Contact your school ICT office to issue a new password.'
    );
  };

  const completeAuthenticatedSession = async (body: any) => {
    if (body.sessionToken) {
      ClientDataStore.setSessionToken(String(body.sessionToken));
    }
    ClientDataStore.setSessionUser(body.user);

    await ClientDataStore.hydrateFromBackend(true);
    const authedUser: User = ClientDataStore.getSessionUser() || body.user;
    ClientDataStore.setSessionUser(authedUser);

    if (!adminOnly && authedUser.schoolId) {
      switchTenant(authedUser.schoolId);
    }

    Storage.setCurrentUser(authedUser);
    onLoginSuccess(authedUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);

    const cleanIdent = identifier.trim().toLowerCase();

    try {
      const endpoint = adminOnly ? '/api/auth/admin-login' : '/api/auth/login';
      const sendAuthRequest = async () => {
        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanIdent, email: cleanIdent, password }),
        });
        const rawText = await res.text();
        let body: any = null;
        try {
          body = rawText ? JSON.parse(rawText) : null;
        } catch {
          body = null;
        }
        return { res, body };
      };

      let { res, body } = await sendAuthRequest();
      if (!res.ok && (!body || res.status === 502 || res.status === 503 || res.status === 504)) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        ({ res, body } = await sendAuthRequest());
      }

      if (!res.ok || !body?.user) {
        if (!body || typeof body !== 'object') {
          setErrorMessage(
            `Server is reconnecting (HTTP ${res.status}). Please wait a moment and click Login again.`
          );
        } else {
          setErrorMessage(
            body.error || 'Incorrect credentials. Please verify your assigned school email and password.'
          );
        }
        return;
      }

      await completeAuthenticatedSession(body);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricSignIn = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (!webAuthnSupported) {
      setErrorMessage('Biometric sign-in (FaceID/TouchID) is not supported in this browser or context.');
      return;
    }

    setIsBiometricPending(true);
    try {
      const cleanEmail = identifier.trim().toLowerCase();
      const optRes = await fetch('/api/auth/webauthn/login/options', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(cleanEmail ? { email: cleanEmail } : {}),
          adminOnly,
        }),
      });
      const optBody = await optRes.json().catch(() => ({}));
      if (!optRes.ok || !optBody?.options) {
        setErrorMessage(optBody?.error || 'Could not initialize biometric passkey verification.');
        return;
      }

      const assertion = await startAuthentication({ optionsJSON: optBody.options });

      const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: optBody.challengeId,
          assertionResponse: assertion,
          adminOnly,
        }),
      });
      const verifyBody = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyBody?.user) {
        setErrorMessage(verifyBody?.error || 'Biometric sign-in failed.');
        return;
      }

      await completeAuthenticatedSession(verifyBody);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setErrorMessage('Biometric authentication was cancelled or timed out.');
      } else {
        setErrorMessage(err?.message || 'Unable to verify device biometric passkey.');
      }
    } finally {
      setIsBiometricPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Public Website</span>
        </button>

        <div className="flex items-center gap-2">
          <PWAInstallButton variant="compact" label="Install App" />
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Institution Sync:</span>
            <span className="text-emerald-700 font-bold">Strict Tenant Isolation</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6">
          {/* Brand Logo & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-2.5 p-2 px-3 bg-white rounded-2xl border border-slate-200 shadow-xs mb-1">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-10-22_at_12.24.43_41514bbb.jpeg"
                alt="Edu-Smart PORTAL By Gadsa Systems"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/edusmart-portal-logo.jpeg';
                }}
              />
              <div className="text-left leading-tight">
                <span className="font-sans font-black text-blue-950 text-base block">
                  <span className="text-[#0B3075]">Edu-</span>
                  <span className="text-[#F5A623]">Smart</span>{' '}
                  <span className="text-[#0B3075] text-xs uppercase font-extrabold ml-1">PORTAL</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider block">
                  By Gadsa Systems · Multi-Tenant
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif tracking-tight">
              {adminOnly ? 'Platform Admin Console Sign In' : 'User Login'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {adminOnly
                ? 'Sign in with your platform super administrator email and password.'
                : 'Sign in with your school-assigned email and password, or use an enrolled FaceID/TouchID passkey. Access is strictly confined to your institution.'}
            </p>
          </div>

          <div className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Assigned Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-700">Assigned Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@school.ac.ke"
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50/90 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => void handlePasswordRecovery()}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50/90 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {infoMessage && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800" role="status">
                  {infoMessage}
                </p>
              )}

              {/* Primary Login Action */}
              <button
                type="submit"
                disabled={isSubmitting || isBiometricPending}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Authenticating & Verifying Tenant...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* WebAuthn Biometric Alternative */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200" />
              <span className="shrink mx-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Or device biometrics
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => void handleBiometricSignIn()}
              disabled={isBiometricPending || isSubmitting || !webAuthnSupported}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <span>
                {isBiometricPending
                  ? 'Verifying FaceID / TouchID...'
                  : 'Sign In with FaceID / TouchID / Passkey'}
              </span>
            </button>
            {!webAuthnSupported && (
              <p className="text-[11px] text-center text-slate-400">
                Biometric sign-in is available on supported HTTPS browsers with TouchID, FaceID, or Windows Hello.
              </p>
            )}
          </div>

          {/* Strict Multi-Tenant Isolation & Role Security Policy Guarantee */}
          <div className="text-center pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Assigned Email & Role-Based Access · Strictly Scoped to {currentTenant?.name || 'Your School'}
              </span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p>© 2026 EduSmart LMS. Protected under Ministry of Education Kenya & Data Protection Guidelines.</p>
      </footer>
    </div>
  );
};
