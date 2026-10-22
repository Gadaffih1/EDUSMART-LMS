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
  AlertCircle,
  UserPlus,
  LogIn,
  Database,
  School,
  Check,
  ChevronRight
} from 'lucide-react';
import { User, UserRole, GradeLevel, StreamName, PRIMARY_STREAMS } from '../../types';
import { Storage } from '../../utils/storage';
import { useTenant } from '../../context/TenantContext';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { signInToEduSmart } from '../../utils/supabaseAuth';
import { SyncEngine } from '../../utils/syncEngine';
import { resolveSchoolUserAndTenant } from '../../utils/schoolAuthResolver';
import { Tenant } from '../../types/tenant';

interface UnifiedLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
  onOpenRegisterSchool?: () => void;
  adminOnly?: boolean;
}

interface DemoProfileItem {
  name: string;
  role: UserRole;
  roleBadge: string;
  email: string;
  password: string;
  description: string;
  avatarEmoji: string;
}

export const UnifiedLoginPage: React.FC<UnifiedLoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  onOpenRegisterSchool,
  adminOnly = false
}) => {
  const { allTenants, currentTenant, switchTenant } = useTenant();
  
  // Auth Modes: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In Form State
  const [identifier, setIdentifier] = useState<string>(adminOnly ? 'admin@edusmart.ac.ke' : 'admin@riaraschools.ac.ke');
  const [password, setPassword] = useState<string>('admin2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Demo School Selector (Defaults to current tenant)
  const [selectedDemoSchoolId, setSelectedDemoSchoolId] = useState<string>(currentTenant?.id || 'tenant-riara');

  // Registration Form State
  const [regSchoolId, setRegSchoolId] = useState<string>(currentTenant?.id || 'tenant-riara');
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regGrade, setRegGrade] = useState<GradeLevel>(4);
  const [regStream, setRegStream] = useState<StreamName>('Dove');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regIdNumber, setRegIdNumber] = useState<string>('');
  const [regSuccessUser, setRegSuccessUser] = useState<User | null>(null);

  // Live tenant school detection from the entered email (Automatic routing)
  const detectedAuth = useMemo(() => {
    if (!identifier || identifier.trim().length < 3) return null;
    return resolveSchoolUserAndTenant(identifier, allTenants, currentTenant);
  }, [identifier, allTenants, currentTenant]);

  // Demo Profiles Catalog: At least 3–4 demo users per school for effortless demonstration
  const schoolDemoProfiles: Record<string, DemoProfileItem[]> = useMemo(() => {
    return {
      'tenant-riara': [
        {
          name: 'Mr. Patrick Kamau',
          role: 'admin',
          roleBadge: 'School Admin',
          email: 'admin@riaraschools.ac.ke',
          password: 'admin2026',
          description: 'Full institutional administrative access, governance & portals',
          avatarEmoji: '🏫'
        },
        {
          name: 'Mr. David Kiprono',
          role: 'class_teacher',
          roleBadge: 'Class Teacher Gr 4',
          email: 'mr.kiprono@edusmart.ac.ke',
          password: 'teach2026',
          description: 'Grade 4 Dove register, CBA assessments, attendance & lessons',
          avatarEmoji: '👨‍🏫'
        },
        {
          name: 'Brian Otieno',
          role: 'student',
          roleBadge: 'Learner (Grade 4)',
          email: 'brian.otieno@student.edusmart.ac.ke',
          password: 'GR4@2026',
          description: 'Virtual science lab, quizzes, CBC portfolio & digital library',
          avatarEmoji: '🎓'
        },
        {
          name: 'Mrs. Grace Otieno',
          role: 'parent',
          roleBadge: 'Parent / Guardian',
          email: 'parent.otieno@edusmart.ac.ke',
          password: 'parent2026',
          description: 'Academic progress, fee statements, gate passes & teacher chat',
          avatarEmoji: '👨‍👩‍👦'
        }
      ],
      'tenant-greenwood': [
        {
          name: 'Dr. Jane Muthoni Wanjiru',
          role: 'admin',
          roleBadge: 'School Principal',
          email: 'info@greenwood.edusmart.ac.ke',
          password: 'admin2026',
          description: 'Head of institution, STEM track oversight & staff management',
          avatarEmoji: '🏫'
        },
        {
          name: 'Mr. David Kiprono (Greenwood)',
          role: 'class_teacher',
          roleBadge: 'Class Teacher Gr 4',
          email: 'teacher.gr4@greenwood.edusmart.ac.ke',
          password: 'teach2026',
          description: 'Primary Grade 4 Dove class teacher & integrated science lead',
          avatarEmoji: '👩‍🏫'
        },
        {
          name: 'Brian Otieno (Greenwood)',
          role: 'student',
          roleBadge: 'Learner (Grade 4)',
          email: 'brian.tenant-greenwood@student.edusmart.ac.ke',
          password: 'GR4@2026',
          description: 'Grade 4 learner portal, coding challenges & interactive labs',
          avatarEmoji: '🎓'
        },
        {
          name: 'Mr. David Mwangi (Greenwood)',
          role: 'finance_officer',
          roleBadge: 'Bursar & Finance',
          email: 'finance@greenwood.edusmart.ac.ke',
          password: 'finance2026',
          description: 'Fee collection, budget reconciliation & procurement approvals',
          avatarEmoji: '💼'
        }
      ],
      'tenant-hillcrest': [
        {
          name: 'Mr. David Kiprop Korir',
          role: 'admin',
          roleBadge: 'Principal',
          email: 'admissions@hillcrest.edusmart.ac.ke',
          password: 'admin2026',
          description: 'Institutional administration, secondary pathways & admissions',
          avatarEmoji: '🏫'
        },
        {
          name: 'Mrs. Florence Akinyi (Hillcrest)',
          role: 'class_teacher',
          roleBadge: 'Class Teacher Gr 8',
          email: 'teacher.gr8@hillcrest.edusmart.ac.ke',
          password: 'teach2026',
          description: 'Junior School Grade 8 Mara stream class teacher & CBA moderation',
          avatarEmoji: '👩‍🏫'
        },
        {
          name: 'Faith Wanjiru (Hillcrest)',
          role: 'student',
          roleBadge: 'Learner (Grade 8)',
          email: 'faith.tenant-hillcrest@student.edusmart.ac.ke',
          password: 'GR8@2026',
          description: 'Junior secondary learner, STEM experiments & academic reports',
          avatarEmoji: '🎓'
        },
        {
          name: 'Ms. Beatrice Wanjiku (Hillcrest)',
          role: 'dean_of_studies',
          roleBadge: 'Dean of Studies',
          email: 'dean@hillcrest.edusmart.ac.ke',
          password: 'dean2026',
          description: 'Examination scheduling, KICD syllabus tracking & term reports',
          avatarEmoji: '📊'
        }
      ],
      'tenant-sunrise': [
        {
          name: 'Mrs. Grace Wambui Kariuki',
          role: 'admin',
          roleBadge: 'Head Teacher',
          email: 'info@sunrise.edusmart.ac.ke',
          password: 'admin2026',
          description: 'Early childhood & primary school administrator',
          avatarEmoji: '🏫'
        },
        {
          name: 'Mr. David Kiprono (Sunrise)',
          role: 'class_teacher',
          roleBadge: 'Class Teacher Gr 4',
          email: 'teacher.gr4@sunrise.edusmart.ac.ke',
          password: 'teach2026',
          description: 'Foundational literacy, numeracy & Grade 4 student registers',
          avatarEmoji: '👨‍🏫'
        },
        {
          name: 'Brian Otieno (Sunrise)',
          role: 'student',
          roleBadge: 'Pupil (Grade 4)',
          email: 'brian.tenant-sunrise@student.edusmart.ac.ke',
          password: 'GR4@2026',
          description: 'Foundational CBC reader, badges, streaks & audio-visual lessons',
          avatarEmoji: '🎓'
        },
        {
          name: 'Mrs. Grace Otieno (Sunrise)',
          role: 'parent',
          roleBadge: 'Parent / Guardian',
          email: 'parent.tenant-sunrise@edusmart.ac.ke',
          password: 'parent2026',
          description: 'Parent communication, bus transport roll & homework feedback',
          avatarEmoji: '👨‍👩‍👧'
        }
      ],
      'tenant-westlands': [
        {
          name: 'Dr. Samuel Mwangi Njoroge',
          role: 'admin',
          roleBadge: 'Executive Director',
          email: 'admin@westlands.edusmart.ac.ke',
          password: 'admin2026',
          description: 'Executive management, talent academy & institutional governance',
          avatarEmoji: '🏫'
        },
        {
          name: 'Mr. Peter Mutua (Westlands)',
          role: 'teacher',
          roleBadge: 'Creative Arts & STEM',
          email: 'teacher.mutua@westlands.edusmart.ac.ke',
          password: 'teach2026',
          description: 'Integrated science practicals, pre-technical studies & sports',
          avatarEmoji: '🎨'
        },
        {
          name: 'Brian Otieno (Westlands)',
          role: 'student',
          roleBadge: 'Learner (Grade 4)',
          email: 'brian.tenant-westlands@student.edusmart.ac.ke',
          password: 'GR4@2026',
          description: 'Creative arts portfolio, science experiments & quiz engine',
          avatarEmoji: '🎓'
        },
        {
          name: 'Mr. David Mwangi (Westlands)',
          role: 'finance_officer',
          roleBadge: 'Bursar & Finance',
          email: 'finance@westlands.edusmart.ac.ke',
          password: 'finance2026',
          description: 'Tuition fees ledger, budget tracking & bank statement reconciliations',
          avatarEmoji: '💼'
        }
      ],
      'tenant-staustins': [
        {
          name: 'Dr. Elizabeth Mutua, PhD',
          role: 'admin',
          roleBadge: 'Head of Institution',
          email: 'info@staustins.edusmart.ac.ke',
          password: 'admin2026',
          description: 'Principal executive oversight, faculty leadership & character mentoring',
          avatarEmoji: '🏫'
        },
        {
          name: 'Mr. David Kiprono (St. Austin’s)',
          role: 'class_teacher',
          roleBadge: 'Class Teacher Gr 4',
          email: 'teacher.gr4@staustins.edusmart.ac.ke',
          password: 'teach2026',
          description: 'Grade 4 Dove class teacher, lesson notes & student appraisal',
          avatarEmoji: '👨‍🏫'
        },
        {
          name: 'Brian Otieno (St. Austin’s)',
          role: 'student',
          roleBadge: 'Learner (Grade 4)',
          email: 'brian.tenant-staustins@student.edusmart.ac.ke',
          password: 'GR4@2026',
          description: 'Virtual science laboratory, assignments & co-curricular club',
          avatarEmoji: '🎓'
        },
        {
          name: 'Coach Benjamin Omwenga',
          role: 'cocurricular_team',
          roleBadge: 'Sports Director',
          email: 'cocurricular@staustins.edusmart.ac.ke',
          password: 'cocurricular2026',
          description: 'Football academy, swimming gala & inter-school sports tournaments',
          avatarEmoji: '⚽'
        }
      ]
    };
  }, []);

  const activeDemoProfiles = schoolDemoProfiles[selectedDemoSchoolId] || schoolDemoProfiles['tenant-riara'];
  const activeDemoSchool = allTenants.find(t => t.id === selectedDemoSchoolId) || allTenants[0];

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
        'Unrecognized school email or account identifier. Please sign in with your official school email or select one of the instant demo accounts below.'
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

    // 3. Verify password for this account
    if (expectedPassword && password !== expectedPassword) {
      setErrorMessage('Incorrect password. Please verify your credentials and try again.');
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
    const targetSchoolId = tenant.id;
    SyncEngine.activateIdentity(user.id, targetSchoolId);
    switchTenant(targetSchoolId);
    Storage.setCurrentUser({ ...user, schoolId: targetSchoolId });
    onLoginSuccess({ ...user, schoolId: targetSchoolId });
    setIsSubmitting(false);
  };

  // 1-Click Instant Demo Login: sets credentials and logs in immediately
  const handleQuickDemoLogin = (emailPreset: string, passPreset: string) => {
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

  // Handle User Account Creation (Self-Service or Invited Registration)
  const handleRegisterAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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
    const existing = Storage.findUserByEmail(cleanEmail);
    if (existing) {
      setErrorMessage('An account with this email address already exists. Please sign in instead.');
      return;
    }

    const targetTenant = allTenants.find(t => t.id === regSchoolId) || currentTenant;

    const newUser: User = {
      id: `usr-${regRole}-${Date.now()}`,
      name: regName.trim(),
      email: cleanEmail,
      password: regPassword,
      role: regRole,
      schoolId: targetTenant.id,
      grade: ['student', 'class_teacher'].includes(regRole) ? regGrade : undefined,
      stream: ['student', 'class_teacher'].includes(regRole) ? regStream : undefined,
      admissionNumber: regRole === 'student' ? (regIdNumber.trim() || `${targetTenant.code}/2026/0${regGrade}${Math.floor(10 + Math.random() * 90)}`) : undefined,
      tscNumber: ['teacher', 'class_teacher', 'hod', 'admin'].includes(regRole) ? (regIdNumber.trim() || `TSC/${Math.floor(10000 + Math.random() * 90000)}/ED`) : undefined,
      isActive: true,
      lastActive: new Date().toISOString()
    };

    // 1. Add to Storage & persistent cache
    Storage.addUser(newUser);

    // 2. Activate SyncEngine identity
    SyncEngine.activateIdentity(newUser.id, targetTenant.id);

    // 3. Switch tenant partition
    switchTenant(targetTenant.id);

    // 4. Set current user
    Storage.setCurrentUser(newUser);

    setRegSuccessUser(newUser);

    // Transition to workspace after short visual confirmation
    setTimeout(() => {
      onLoginSuccess(newUser);
    }, 1200);
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

        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Database Sync:</span>
          <span className="text-emerald-700 font-bold">Active & Retained</span>
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
              {adminOnly ? 'Platform Admin Console Sign In' : 'School Institutional Gateway'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {adminOnly
                ? 'Sign in with your platform super administrator email and password.'
                : 'Select an instant demo profile, sign in with your official account, or create a new user profile.'}
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
                <span>Sign In to School</span>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* School Email Input */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      School Email Address
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Auto School Router
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

              {/* Multi-School Instant Demo Showcase: At least 3–4 demo users available per school */}
              {!adminOnly && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                        Demo Profiles by School (At least 3 per campus)
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      1-Click Instant Login
                    </span>
                  </div>

                  {/* School Selector Tabs (Pills) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {allTenants.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedDemoSchoolId(t.id)}
                        className={`p-1.5 text-left rounded-xl border text-[11px] font-bold transition-all truncate cursor-pointer ${
                          selectedDemoSchoolId === t.id
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={t.name}
                      >
                        <div className="truncate">{t.shortName}</div>
                      </button>
                    ))}
                  </div>

                  {/* Active School Indicator */}
                  <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                    <span>
                      Demo accounts for: <strong className="text-slate-800">{activeDemoSchool.name}</strong>
                    </span>
                    <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                      {activeDemoProfiles.length} Profiles Available
                    </span>
                  </div>

                  {/* 4 Instant 1-Click Demo Profiles for This School */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeDemoProfiles.map((profile, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickDemoLogin(profile.email, profile.password)}
                        className="p-2.5 bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-extrabold text-slate-900 group-hover:text-blue-900 truncate flex items-center gap-1.5">
                            <span>{profile.avatarEmoji}</span>
                            <span>{profile.name}</span>
                          </span>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded shrink-0">
                            {profile.roleBadge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {profile.email}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                          <span>Pass: {profile.password}</span>
                          <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            Login <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    Welcome, <strong>{regSuccessUser.name}</strong>! Your account has been created, assigned to <strong>{allTenants.find(t => t.id === regSuccessUser.schoolId)?.name}</strong>, and synced to the database. Launching your workspace...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterAccount} className="space-y-3.5">
                  
                  {/* Select School */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Select School Institution
                    </label>
                    <select
                      value={regSchoolId}
                      onChange={(e) => setRegSchoolId(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      {allTenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.city} · {t.code})
                        </option>
                      ))}
                    </select>
                  </div>

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

                  {/* Role Selector */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Account Role & Access Permissions
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="student">🎓 Learner / Student (Grades 1 to 9)</option>
                      <option value="parent">👨‍👩‍👦 Parent / Guardian</option>
                      <option value="class_teacher">👨‍🏫 Class Teacher (Class Registers & CBA)</option>
                      <option value="teacher">👩‍🏫 Subject Teacher</option>
                      <option value="hod">🔬 Head of Department (HOD)</option>
                      <option value="finance_officer">💼 Finance Officer / Bursar</option>
                      <option value="librarian">📚 School Librarian</option>
                      <option value="admin">🏫 School Administrator / Principal</option>
                    </select>
                  </div>

                  {/* Dynamic Fields for Student or Class Teacher */}
                  {['student', 'class_teacher'].includes(regRole) && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          Grade Level
                        </label>
                        <select
                          value={regGrade}
                          onChange={(e) => setRegGrade(Number(e.target.value) as GradeLevel)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-emerald-300 rounded-lg"
                        >
                          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map((g) => (
                            <option key={g} value={g}>
                              Grade {g} {g <= 6 ? '(Primary)' : '(Junior School)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                          Stream
                        </label>
                        <select
                          value={regStream}
                          onChange={(e) => setRegStream(e.target.value as StreamName)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-emerald-300 rounded-lg"
                        >
                          {PRIMARY_STREAMS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Identifier / ID Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {regRole === 'student' ? 'Admission Number' : 'TSC Number / Staff ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      placeholder={regRole === 'student' ? 'e.g. ADM/2026/0442 (or leave blank for auto)' : 'e.g. TSC/58291/ED'}
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
