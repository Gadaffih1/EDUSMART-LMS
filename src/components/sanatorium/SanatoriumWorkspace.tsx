import React, { useState } from 'react';
import { User, SanatoriumRecord } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { SanatoriumSection } from './SanatoriumSection';
import { 
  HeartPulse, 
  ShieldCheck, 
  LogOut, 
  AlertTriangle, 
  Stethoscope, 
  Bed, 
  Ambulance, 
  FileText, 
  Phone, 
  Clock, 
  Sparkles,
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface SanatoriumWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
}

export const SanatoriumWorkspace: React.FC<SanatoriumWorkspaceProps> = ({
  currentUser,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'clinic_register' | 'duty_protocols' | 'emergency_contacts'>('clinic_register');
  const sanatoriumRecords = Storage.getSanatoriumRecords();
  
  const admittedInBay = sanatoriumRecords.filter(r => r.disposition === 'admitted_observation_bay' || r.disposition === 'under_monitoring');
  const referredHospital = sanatoriumRecords.filter(r => r.disposition === 'referred_to_hospital');
  const gatePassIssued = sanatoriumRecords.filter(r => !!r.gatePassId || r.disposition === 'signed_out_to_parent');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Professional Healthcare Header */}
      <header className="bg-white border-b border-rose-100 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Branding & Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-rose-50/80 p-2 rounded-2xl border border-rose-200 shadow-2xs shrink-0 flex items-center justify-center">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
              <div className="hidden md:block h-8 w-px bg-slate-200" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    <HeartPulse className="w-3 h-3 text-rose-600 animate-pulse" />
                    <span>School Sanatorium & Healthcare Portal</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span>Restricted Healthcare Clearance</span>
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                  <span>{currentUser.name}</span>
                  <span className="text-xs font-normal text-slate-500 hidden lg:inline">
                    · {currentUser.designation || 'School Nursing Officer In-Charge'}
                  </span>
                </h1>
              </div>
            </div>

            {/* Nurse Credential & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-bold text-slate-900">License: {currentUser.tscNumber || 'NCK/RN-58921'}</span>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">Active Nursing Council Registration</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Sign out of healthcare portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Access Rights Scoping Notice Banner */}
        <div className="bg-rose-50/90 border-t border-rose-200/80 px-4 py-2 text-xs text-rose-950 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-700 shrink-0" />
            <span className="font-bold text-rose-950">Medical Officer Access Policy:</span>
            <span className="text-rose-800 text-[11px]">
              Access is strictly confined to the School Sanatorium Clinic portal in compliance with Student Medical Privacy Regulations. Other academic and administrative systems remain locked.
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-rose-800 bg-white/80 px-2 py-0.5 rounded border border-rose-200">
            <span>Room: Sanatorium Bay 1 & 2</span>
            <span>·</span>
            <span>Hotline: 0700-SANATORIUM</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Healthcare KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Clinic Logs</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{sanatoriumRecords.length}</div>
            <div className="text-[10px] text-slate-500">Cumulative patient attendance</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sick Bay Admissions</span>
              <Bed className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-700">{admittedInBay.length}</div>
            <div className="text-[10px] text-rose-600">Currently resting under observation</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Hospital Referrals</span>
              <Ambulance className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-700">{referredHospital.length}</div>
            <div className="text-[10px] text-amber-600">Referred to external physicians</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Medical Gate Passes</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700">{gatePassIssued.length}</div>
            <div className="text-[10px] text-emerald-600">Signed exit clearance for parents</div>
          </div>
        </div>

        {/* Primary Sanatorium Section Component with full recording & triage rights */}
        <SanatoriumSection
          currentUser={currentUser}
          canRecord={true}
          title="School Sanatorium Clinical Register & Sick Bay"
          subtitle="Official clinical register: Log student clinic visits, vital signs, nursing assessment, medications, observation bay bed occupancy, and physician referral notes."
        />

        {/* Clinical Protocols & Healthcare Compliance Drawer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Sanatorium Clinical Standards & First-Aid Operating Protocols
              </h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              NCK Standards Compliant (2026)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>1. Triage & Vital Signs Rule</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All learners presenting with fever &gt;37.8°C or respiratory distress must have temperature and SpO2 logged immediately before medication is administered.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-rose-600" />
                <span>2. Observation Bay Duration</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Students admitted to the observation bay are monitored for up to 4 hours. If symptoms fail to resolve, contact parents immediately to authorize hospital transfer.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                <span>3. Emergency Contacts & Gate Exit</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Emergency gate passes must be digitally generated by the nurse. Security officers verify digital exit pass code prior to allowing learner off campus.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
