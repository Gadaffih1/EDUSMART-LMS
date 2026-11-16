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
  UserPlus,
  LogIn,
  Database,
  Check
} from 'lucide-react';
import { User } from '../../types';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { ClientDataStore } from '../../utils/clientDataStore';
import { findActivePlatformAdmin } from '../../utils/platformAdminAuth';
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
  onOpenRegisterSchool,
  adminOnly = false
}) => {
  const { currentTenant, switchTenant } = useTenant();
  
  // Auth Modes: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In Form State
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Registration Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regIdNumber, setRegIdNumber] = useState<string>('');
  const [regSuccessUser, setRegSuccessUser] = useState<User | null>(null);

  const handlePasswordRecovery = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const email = identifier.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Enter your school account email address first.');
      return;
    }
    setInfoMessage('Password resets are managed securely by your School Administrator or Registrar. Contact your school ICT office to issue a new password.');
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
          setErrorMessage(body.error || 'Incorrect credentials. Please verify your email and password.');
        }
        setIsSubmitting(false);
        return;
      }

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
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle User Account Creation (Self-Service Registration via Central Backend API)
  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (findActivePlatformAdmin(regEmail)) {
      setErrorMessage('This email is reserved for the Super Admin console.');
      return;
    }
    if (!regName.trim()) {
      setErrorMessage('Please enter your full official name.');
      return;
    }
    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMessage('Please enter a valid school or institutional email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter carefully.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    const targetTenant = currentTenant;
    setIsSubmitting(true);

    try {
      const payload = {
        name: regName.trim(),
        email: cleanEmail,
        password: regPassword,
        role: 'student',
        schoolId: targetTenant.id,
        admissionNumber:
          regIdNumber.trim() ||
          `${targetTenant.code}/2026/${String(Math.floor(100 + Math.random() * 900)).padStart(3, '0')}`,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: payload, autoLogin: true }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.user) {
        setErrorMessage(body?.error || 'Could not register account. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (body.sessionToken) {
        ClientDataStore.setSessionToken(String(body.sessionToken));
      }
      ClientDataStore.setSessionUser(body.user);

      await ClientDataStore.hydrateFromBackend(true);
      const createdUser: User = ClientDataStore.getSessionUser() || body.user;
      ClientDataStore.setSessionUser(createdUser);
      switchTenant(createdUser.schoolId || targetTenant.id);
      Storage.setCurrentUser(createdUser);
      setRegSuccessUser(createdUser);

      setTimeout(() => {
        onLoginSuccess(createdUser);
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to register account with central server.');
    } finally {
      setIsSubmitting(false);
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
            <span className="hidden sm:inline">Database Sync:</span>
            <span className="text-emerald-700 font-bold">Active & Retained</span>
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
                  <span className="text-[#0B3075]">Edu-</span><span className="text-[#F5A623]">Smart</span> <span className="text-[#0B3075] text-xs uppercase font-extrabold ml-1">PORTAL</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider block">By Gadsa Systems · Multi-Tenant</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif tracking-tight">
              {adminOnly ? 'Platform Admin Console Sign In' : 'Login'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {adminOnly
                ? 'Sign in with your platform super administrator email and password.'
                : 'Students, parents, finance, the head teacher, and every other role sign in here and open their own dashboard.'}
            </p>
          </div>

          {!adminOnly && (
            /* Mode Toggle: Sign In vs Create Account */
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-blue-900 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-emerald-900 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Create User Account</span>
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* 1. SIGN IN MODE */}
          {/* ========================================================== */}
          {authMode === 'signin' ? (
            <div className="space-y-6">
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                
                {/* School Email Input */}
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold text-slate-700">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="off"
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
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
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
                      autoComplete="new-password"
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

                {/* Login Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Authenticating & Routing...' : 'Login'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

            </div>
          ) : (
            /* ========================================================== */
            /* 2. CREATE USER ACCOUNT MODE */
            /* ========================================================== */
            <div className="space-y-4 text-left">
              
              {regSuccessUser ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h3 className="text-base font-extrabold text-emerald-950">
                    Account Created Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Welcome, <strong>{regSuccessUser.name}</strong>! Your account has been created for <strong>{currentTenant.name}</strong>. Launching your workspace...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterAccount} className="space-y-3.5">

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Full Official Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Joy Nduta, Mr. Josephat Mwangi"
                      className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Official Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. joy.nduta@riaraschools.ac.ke, student.joy@edusmart.ac.ke"
                      className="w-full px-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400 font-mono"
                    />
                  </div>

                  {/* Identifier / ID Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Admission Number
                    </label>
                    <input
                      type="text"
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      placeholder="e.g. ADM/2026/0442 (or leave blank for auto)"
                      className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400 font-mono"
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account & Enter Portal</span>
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    Data Retention Guaranteed: Your account and coursework are synchronized to the database.
                  </p>
                </form>
              )}

            </div>
          )}

          {/* Strict Multi-Tenant Isolation & Role Security Policy Guarantee */}
          <div className="text-center pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Multi-Tenant Cross-School Isolation & Role-Based Access Control (RBAC)</span>
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
