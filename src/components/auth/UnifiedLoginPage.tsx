import React, { useState } from 'react';
import { 
  School, 
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
  ChevronDown,
  Building2,
  Users,
  AlertCircle
} from 'lucide-react';
import { User } from '../../types';
import { Tenant } from '../../types/tenant';
import { Storage } from '../../utils/storage';
import { INITIAL_USERS } from '../../data/initialData';
import { useTenant } from '../../context/TenantContext';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { signInToEduSmart } from '../../utils/supabaseAuth';
import { SyncEngine } from '../../utils/syncEngine';

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
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(currentTenant.id);
  const canUseDemoProfiles = import.meta.env.DEV && !isSupabaseConfigured;
  const [identifier, setIdentifier] = useState<string>(canUseDemoProfiles ? 'admin@riaraschools.ac.ke' : '');
  const [password, setPassword] = useState<string>(canUseDemoProfiles ? 'admin2026' : '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeSchool = allTenants.find(t => t.id === selectedSchoolId) || currentTenant;

  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    switchTenant(schoolId);
  };

  const handlePasswordRecovery = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const email = identifier.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Enter your account email address first.');
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Password recovery requires configured Supabase Auth.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/setup-password`,
    });
    if (error) {
      setErrorMessage(`Unable to request a password reset: ${error.message}`);
      return;
    }
    setInfoMessage('If this email belongs to an account, Supabase will send password reset instructions.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (adminOnly && !isSupabaseConfigured) {
      setErrorMessage('Admin Console sign-in requires configured Supabase Auth.');
      setIsSubmitting(false);
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const user = await signInToEduSmart(identifier.trim().toLowerCase(), password);
        if (adminOnly && user.role !== 'admin') {
          const { error: signOutError } = await supabase!.auth.signOut();
          SyncEngine.activateIdentity(null);
          if (signOutError) {
            throw new Error(`This account is not authorized for Admin Console, and sign-out failed: ${signOutError.message}`);
          }
          throw new Error('This account does not have the administrator role required for Admin Console.');
        }
        switchTenant(user.schoolId || selectedSchoolId);
        onLoginSuccess(user);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Sign-in failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!canUseDemoProfiles) {
      setErrorMessage('Supabase Auth is not configured. Contact your system administrator.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      const users = Storage.getUsers();
      const cleanIdent = identifier.trim().toLowerCase();
      
      // Match user by email, admission number, or name
      const matched = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanIdent) ||
        (u.name && u.name.toLowerCase() === cleanIdent) ||
        (u.admissionNumber && u.admissionNumber.toLowerCase() === cleanIdent)
      ) || INITIAL_USERS.find(u =>
        (u.email && u.email.toLowerCase() === cleanIdent) ||
        (u.name && u.name.toLowerCase() === cleanIdent) ||
        (u.admissionNumber && u.admissionNumber.toLowerCase() === cleanIdent)
      );

      if (matched) {
        // Ensure tenant is synced
        switchTenant(selectedSchoolId);
        onLoginSuccess(matched);
      } else {
        // Fallback for seamless demo experience: create a tenant user session with role
        const demoUser: User = {
          id: `usr-${Date.now()}`,
          name: cleanIdent.includes('admin') ? 'Mr. Patrick Kamau' : 'School User',
          email: identifier.trim(),
          role: cleanIdent.includes('teacher') ? 'teacher' : cleanIdent.includes('student') ? 'student' : 'admin',
          grade: 4
        };
        switchTenant(selectedSchoolId);
        onLoginSuccess(demoUser);
      }
      setIsSubmitting(false);
    }, 400);
  };

  const handleQuickDemoLogin = (role: string, emailPreset: string, passPreset: string, name: string) => {
    if (!canUseDemoProfiles) return;
    setIdentifier(emailPreset);
    setPassword(passPreset);
    const users = Storage.getUsers();
    const matched = users.find(u => u.email?.toLowerCase() === emailPreset.toLowerCase()) ||
                    INITIAL_USERS.find(u => u.email?.toLowerCase() === emailPreset.toLowerCase());
    if (matched) {
      switchTenant(selectedSchoolId);
      onLoginSuccess(matched);
    } else {
      const demoUser: User = {
        id: `usr-${role}-${Date.now()}`,
        name,
        email: emailPreset,
        role: role as any,
        grade: 4
      };
      switchTenant(selectedSchoolId);
      onLoginSuccess(demoUser);
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
          <span>{adminOnly ? 'Secure Admin Console Access' : `Unified School Gateway · ${activeSchool.name}`}</span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6">
          
          {/* Brand Logo & Title (Matching Panel 2) */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center gap-2.5 p-2 px-3 bg-blue-50/80 rounded-2xl border border-blue-100 mb-1">
              <EduSmartGadsaLogo variant="emblem" size="md" />
              <div className="text-left leading-tight">
                <span className="font-serif font-black text-blue-950 text-base block">EduSmart LMS</span>
                <span className="text-[10px] font-mono font-bold text-blue-700 tracking-wider uppercase block">Kenya CBC Multi-Tenant</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-serif tracking-tight">
              {adminOnly ? 'Admin Console Sign In' : 'Login to Your School Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {adminOnly
                ? 'Sign in with your administrator email and password to continue.'
                : 'Enter your school, email or username to continue.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* School Selector Dropdown */}
            {!adminOnly && <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700">
                School Campus
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <School className="w-4 h-4 text-blue-600" />
                </div>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-50/90 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {allTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.city})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pl-1">
                Selected: <span className="font-bold text-slate-700">{activeSchool.name}</span> · {activeSchool.motto}
              </p>
            </div>}

            {/* Username or Email Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700">
                {isSupabaseConfigured ? 'Email address' : 'Username or Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isSupabaseConfigured ? 'name@school.org' : 'e.g. admin@riaraschools.ac.ke or ADM/2023/0416'}
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-slate-900 bg-slate-50/90 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
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
              <span>{isSubmitting ? 'Authenticating...' : 'Login'}</span>
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
                  Register your school
                </button>
              </div>
            </>
          )}

          {/* Quick Demo Access Bar */}
          {canUseDemoProfiles && !adminOnly && <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center mb-2">
              ⚡ Instant 1-Click Demo Profiles
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin@riaraschools.ac.ke', 'admin2026', 'Mr. Patrick Kamau')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left font-semibold text-slate-700 hover:text-blue-900 transition-colors cursor-pointer"
              >
                🏫 School Admin (Mr. Kamau)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('teacher', 'teacher.florence@edusmart.ac.ke', 'teach2026', 'Mrs. Florence Akinyi')}
                className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left font-semibold text-slate-700 hover:text-emerald-900 transition-colors cursor-pointer"
              >
                👩‍🏫 CBC Teacher (Grade 4)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student', 'peter.kamau@edusmart.ac.ke', 'pass2026', 'Peter Kamau')}
                className="p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-left font-semibold text-slate-700 hover:text-purple-900 transition-colors cursor-pointer"
              >
                🎓 Student (Grade 4 Learner)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('parent', 'parent.robert@edusmart.ac.ke', 'parent2026', 'Dr. Robert Kamau')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-left font-semibold text-slate-700 hover:text-amber-900 transition-colors cursor-pointer"
              >
                👨‍👧 Parent (Learner Guardian)
              </button>
            </div>
          </div>}

          {/* Secure · Reliable · Multi-Tenant Tagline (Panel 2) */}
          <div className="text-center pt-2">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
              Secure · Reliable · Multi-Tenant
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
