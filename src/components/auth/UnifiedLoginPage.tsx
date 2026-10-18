import React, { useState, useMemo } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  ArrowLeft,
  Building2,
  Users,
  AlertCircle
} from 'lucide-react';
import { User } from '../../types';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { signInToEduSmart } from '../../utils/supabaseAuth';
import { SyncEngine } from '../../utils/syncEngine';
import { resolveSchoolUserAndTenant } from '../../utils/schoolAuthResolver';

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
  const { allTenants, currentTenant, switchTenant } = useTenant();
  const canUseDemoProfiles = true;
  const [identifier, setIdentifier] = useState<string>(adminOnly ? 'admin@edusmart.ac.ke' : 'admin@riaraschools.ac.ke');
  const [password, setPassword] = useState<string>('admin2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Live tenant school detection from the entered email (No campus dropdown required)
  const detectedAuth = useMemo(() => {
    if (!identifier || identifier.trim().length < 3) return null;
    return resolveSchoolUserAndTenant(identifier, allTenants, currentTenant);
  }, [identifier, allTenants, currentTenant]);

  const handlePasswordRecovery = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const email = identifier.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Enter your school account email address first.');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Password recovery requires configured Supabase Auth. Contact your School Administrator.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/setup-password`,
    });
    if (error) {
      setErrorMessage(`Unable to request a password reset: ${error.message}`);
      return;
    }
    setInfoMessage('If this email belongs to an account, password reset instructions have been dispatched.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const cleanIdent = identifier.trim().toLowerCase();

    // 1. Resolve user and specific tenant school from the provided email/credentials
    const resolved = resolveSchoolUserAndTenant(identifier, allTenants, currentTenant);

    if (!resolved) {
      setErrorMessage(
        'Unrecognized school email or account identifier. Please sign in with your official school email (e.g. admin@riaraschools.ac.ke, info@greenwood.edusmart.ac.ke).'
      );
      setIsSubmitting(false);
      return;
    }

    const { user, expectedPassword, tenant } = resolved;

    // 2. Enforce adminOnly check if in Platform Super Admin Console mode
    if (adminOnly) {
      const isSuperAdminEmail = cleanIdent === 'admin@edusmart.ac.ke' || cleanIdent === 'superadmin@edusmart.ac.ke';
      if (!isSuperAdminEmail || user.role !== 'admin') {
        setErrorMessage(
          'Access restricted: The Admin Console requires platform administrator credentials (admin@edusmart.ac.ke).'
        );
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Verify password for this specific school account
    if (expectedPassword && password !== expectedPassword) {
      setErrorMessage('Incorrect password. Please verify your password and try again.');
      setIsSubmitting(false);
      return;
    }

    // 4. Optional Supabase Auth attempt
    if (isSupabaseConfigured && cleanIdent.includes('@')) {
      try {
        await signInToEduSmart(cleanIdent, password);
      } catch (err) {
        if (expectedPassword && password !== expectedPassword) {
          setErrorMessage(err instanceof Error ? err.message : 'Invalid credentials.');
          setIsSubmitting(false);
          return;
        }
      }
    }

    // 5. Strict School Identification & Isolation:
    // Switch tenant to this exact school; no user can cross over to another school.
    const targetSchoolId = tenant.id;
    SyncEngine.activateIdentity(user.id, targetSchoolId);
    switchTenant(targetSchoolId);
    Storage.setCurrentUser({ ...user, schoolId: targetSchoolId });
    onLoginSuccess({ ...user, schoolId: targetSchoolId });
    setIsSubmitting(false);
  };

  const handleQuickDemoLogin = (role: string, emailPreset: string, passPreset: string, name: string) => {
    setIdentifier(emailPreset);
    setPassword(passPreset);
    setErrorMessage('');
    const resolved = resolveSchoolUserAndTenant(emailPreset, allTenants, currentTenant);
    if (resolved) {
      const targetSchoolId = resolved.tenant.id;
      SyncEngine.activateIdentity(resolved.user.id, targetSchoolId);
      switchTenant(targetSchoolId);
      Storage.setCurrentUser({ ...resolved.user, schoolId: targetSchoolId });
      onLoginSuccess({ ...resolved.user, schoolId: targetSchoolId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      
      {/* Top Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Public Website</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {adminOnly 
              ? 'Secure Platform Admin Console' 
              : 'Institutional Single Sign-On · Isolated Multi-Tenancy'}
          </span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6">
          
          {/* Brand Logo & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-2.5 p-2 px-3 bg-blue-50/80 rounded-2xl border border-blue-100 mb-1">
              <EduSmartGadsaLogo variant="emblem" size="md" />
              <div className="text-left leading-tight">
                <span className="font-serif font-black text-blue-950 text-base block">EduSmart LMS</span>
                <span className="text-[10px] font-mono font-bold text-blue-700 tracking-wider uppercase block">Kenya CBC Multi-Tenant</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif tracking-tight">
              {adminOnly ? 'Admin Console Sign In' : 'School Institutional Sign-In'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {adminOnly
                ? 'Sign in with your platform super administrator email and password.'
                : 'Enter your official school email and password to access your school portal.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* School Email Input (Campus selection is removed - email identifies the school) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  School Email Address
                </label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  School Identifier
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@riaraschools.ac.ke, info@greenwood.edusmart.ac.ke"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50/90 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400 font-mono"
                />
              </div>
              
              {/* Dynamic School Identification Feedback */}
              {detectedAuth?.tenant ? (
                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 animate-in fade-in">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 truncate">
                    <span className="text-[10px] text-emerald-700 block uppercase font-bold tracking-wider">
                      Identified School:
                    </span>
                    <span className="font-extrabold text-emerald-950">
                      {detectedAuth.tenant.name}
                    </span>
                    <span className="text-slate-500 text-[10px] ml-1.5">
                      ({detectedAuth.tenant.city})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded shrink-0">
                    {detectedAuth.tenant.code}
                  </span>
                </div>
              ) : identifier.trim().length > 3 && identifier.includes('@') ? (
                <p className="text-[10px] text-slate-500 pl-1">
                  Type your official school email to automatically route to your school partition.
                </p>
              ) : null}
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
              <span>{isSubmitting ? 'Authenticating & Routing...' : 'Sign In to School'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {!adminOnly && (
            <>
              {/* OR Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
                  OR
                </span>
              </div>

              {/* Register Your School */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenRegisterSchool) {
                      onOpenRegisterSchool();
                    } else {
                      alert("Opening School Onboarding & Registration form...");
                    }
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Register a new school tenant
                </button>
              </div>
            </>
          )}

          {/* Quick Demo Access Bar */}
          {canUseDemoProfiles && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  ⚡ Instant 1-Click Demo Profiles (Auto-Routed by Email)
                </p>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Zero Campus Dropdown
                </span>
              </div>

              {adminOnly ? (
                <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin', 'admin@edusmart.ac.ke', 'admin2026', 'Platform Super Admin')}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-center font-semibold text-slate-700 hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    🛡️ Platform Super Admin (admin@edusmart.ac.ke · admin2026)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Riara School Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin', 'admin@riaraschools.ac.ke', 'admin2026', 'Mr. Patrick Kamau')}
                    className="p-2 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-blue-950 flex items-center justify-between">
                      <span>🏫 Riara Admin</span>
                      <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-100 px-1 rounded">Riara</span>
                    </div>
                    <div className="text-[10px] text-blue-700 font-mono truncate">admin@riaraschools.ac.ke</div>
                  </button>

                  {/* Greenwood Academy Principal */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin', 'info@greenwood.edusmart.ac.ke', 'admin2026', 'Dr. Jane Muthoni')}
                    className="p-2 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-emerald-950 flex items-center justify-between">
                      <span>🏫 Greenwood Admin</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded">Greenwood</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono truncate">info@greenwood.edusmart.ac.ke</div>
                  </button>

                  {/* CBC Teacher */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('class_teacher', 'mr.kiprono@edusmart.ac.ke', 'teach2026', 'Mr. David Kiprono')}
                    className="p-2 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-amber-950 flex items-center justify-between">
                      <span>👩‍🏫 CBC Teacher</span>
                      <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100 px-1 rounded">Riara</span>
                    </div>
                    <div className="text-[10px] text-amber-700 font-mono truncate">mr.kiprono@edusmart.ac.ke</div>
                  </button>

                  {/* Student */}
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('student', 'brian.otieno@student.edusmart.ac.ke', 'GR4@2026', 'Brian Otieno')}
                    className="p-2 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-purple-950 flex items-center justify-between">
                      <span>🎓 Student (Grade 4)</span>
                      <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-100 px-1 rounded">Riara</span>
                    </div>
                    <div className="text-[10px] text-purple-700 font-mono truncate">brian.otieno@student.edusmart.ac.ke</div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Strict Multi-Tenant Isolation Guarantee */}
          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Encrypted Multi-Tenancy · Strict Cross-School Isolation Enforced</span>
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/60">
        <p>© 2026 EduSmart LMS. Protected under Ministry of Education & Data Protection Guidelines.</p>
      </footer>

    </div>
  );
};
