import React from 'react';
import { 
  GraduationCap, 
  School, 
  BookOpen, 
  Shield, 
  ShieldCheck, 
  Award,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';
import { Tenant } from '../../types/tenant';
import { useTenant } from '../../context/TenantContext';

export interface TenantPrintHeaderProps {
  title?: string;
  subtitle?: string;
  documentRef?: string;
  documentDate?: string;
  term?: string;
  academicYear?: string;
  tenantOverride?: Tenant;
  showWatermark?: boolean;
  compact?: boolean;
  className?: string;
}

export const TenantPrintHeader: React.FC<TenantPrintHeaderProps> = ({
  title,
  subtitle,
  documentRef,
  documentDate,
  term,
  academicYear,
  tenantOverride,
  showWatermark = true,
  compact = false,
  className = ''
}) => {
  const { currentTenant: contextTenant } = useTenant();
  const tenant = tenantOverride || contextTenant;

  const finalRef = documentRef || `REF/${tenant.code}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
  const finalDate = documentDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const finalTerm = term || tenant.term || 'Term 1, 2026';
  const finalYear = academicYear || tenant.academicYear || '2026 Academic Year';

  const themeBorderColor = tenant.primaryColorHex || '#1e3a8a';

  return (
    <div className={`tenant-print-header w-full text-slate-900 relative ${className}`}>
      
      {/* OPTIONAL LIGHT WATERMARK FOR AUTHENTICITY */}
      {showWatermark && (
        <div 
          aria-hidden="true"
          className="hidden print:flex pointer-events-none absolute inset-0 items-center justify-center opacity-[0.04] select-none z-0"
        >
          <div className="text-center transform -rotate-12">
            <div className="text-6xl font-black font-serif tracking-widest uppercase">
              {tenant.shortName || tenant.name}
            </div>
            <div className="text-xl font-mono font-bold mt-2 tracking-wider">
              {tenant.taglineNotes || tenant.motto}
            </div>
            <div className="text-sm font-mono mt-1">
              {tenant.registrationNumber}
            </div>
          </div>
        </div>
      )}

      {/* TOP INSTITUTIONAL LETTERHEAD */}
      <div 
        className="pb-4 relative z-10 border-b-2"
        style={{ borderColor: themeBorderColor }}
      >
        <div className="flex items-start justify-between gap-4">
          
          {/* LEFT: LOGO + SCHOOL DETAILS */}
          <div className="flex items-start gap-4">
            
            {/* School Logo / Crest */}
            <div className="shrink-0">
              {tenant.customLogoBase64 ? (
                <img 
                  src={tenant.customLogoBase64} 
                  alt={tenant.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-2xs" 
                />
              ) : tenant.logoUrl ? (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-2xs" 
                />
              ) : (
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center p-2 text-white shadow-xs"
                  style={{ backgroundColor: tenant.primaryColorHex || '#0f172a' }}
                >
                  <GraduationCap className="w-8 h-8 text-amber-400" />
                  <span className="text-[7px] font-mono tracking-widest uppercase mt-0.5 opacity-90">
                    EST. {tenant.establishedYear || 1990}
                  </span>
                </div>
              )}
            </div>

            {/* School Name, Tagline & Address */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span 
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono text-white"
                  style={{ backgroundColor: tenant.primaryColorHex || '#1e3a8a' }}
                >
                  {tenant.code}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {tenant.curriculum || 'Kenyan CBC Curriculum'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-serif leading-tight">
                {tenant.name}
              </h1>

              {/* Tagline Notes & Motto */}
              <p className="text-xs font-semibold italic text-slate-700">
                "{tenant.motto}" {tenant.taglineNotes ? `· ${tenant.taglineNotes}` : ''}
              </p>

              {/* Physical Contact Coordinates */}
              <div className="text-[10px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5 font-medium">
                <span>{tenant.address}, {tenant.city} ({tenant.county})</span>
                <span className="text-slate-300">·</span>
                <span>Tel: {tenant.phone}</span>
                <span className="text-slate-300">·</span>
                <span>Email: {tenant.email}</span>
                {tenant.domain && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>Web: {tenant.domain}</span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: REGISTRATION CODES & REFERENCE */}
          <div className="text-right shrink-0 hidden sm:block">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 text-left min-w-[170px]">
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Ministry Code / NEMIS</span>
                <span className="font-mono font-black text-xs text-slate-900 block">{tenant.registrationNumber}</span>
              </div>
              <div className="border-t border-slate-200 pt-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Document Ref</span>
                <span className="font-mono font-bold text-[11px] text-slate-800 block truncate">{finalRef}</span>
              </div>
              <div className="border-t border-slate-200 pt-1">
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Date & Session</span>
                <span className="text-[10px] text-slate-700 block font-medium">{finalDate} · {finalTerm}</span>
              </div>
            </div>
          </div>

        </div>

        {/* DOCUMENT TITLE BANNER */}
        {title && (
          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950 font-serif">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

export interface TenantPrintFooterProps {
  tenantOverride?: Tenant;
  showSignature?: boolean;
  principalTitleOverride?: string;
  signatureNameOverride?: string;
  customNote?: string;
  className?: string;
}

export const TenantPrintFooter: React.FC<TenantPrintFooterProps> = ({
  tenantOverride,
  showSignature = true,
  principalTitleOverride,
  signatureNameOverride,
  customNote,
  className = ''
}) => {
  const { currentTenant: contextTenant } = useTenant();
  const tenant = tenantOverride || contextTenant;

  const principalTitle = principalTitleOverride || tenant.principalTitle || 'Principal & Head of School';
  const principalName = signatureNameOverride || tenant.principalName || 'Mr. Patrick Kamau';
  const footerNote = customNote || tenant.printFooterNotes || 
    `Official ${tenant.name} document. Protected under the Kenya Data Protection Act & Ministry of Education Guidelines. ${tenant.motto}.`;

  return (
    <footer className={`tenant-print-footer mt-8 pt-4 border-t-2 border-slate-800 text-xs text-slate-600 relative z-10 ${className}`}>
      
      {/* SIGNATURE & AUTHENTICATION SEAL ROW */}
      {showSignature && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 items-end">
          
          {/* 1. PRINCIPAL SIGNATURE */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Executive Endorsement</div>
            <div className="h-12 border-b-2 border-slate-400 flex items-end pb-1">
              <span className="font-serif italic font-bold text-slate-800 text-sm tracking-wide">
                {principalName}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-900">{principalName}</div>
            <div className="text-[10px] text-slate-500 font-medium">{principalTitle}</div>
          </div>

          {/* 2. OFFICIAL SCHOOL SEAL / STAMP */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-600/60 p-1 flex flex-col items-center justify-center text-center bg-emerald-50/30">
              <div className="w-full h-full rounded-full border border-emerald-700/80 p-1 flex flex-col items-center justify-center">
                <span className="text-[7px] font-bold tracking-widest text-emerald-900 uppercase">OFFICIAL SEAL</span>
                <span className="text-[8px] font-black font-mono text-emerald-950 uppercase">{tenant.code}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700 my-0.5" />
                <span className="text-[6px] font-mono text-emerald-800">{new Date().getFullYear()} CERTIFIED</span>
              </div>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider">Institutional Stamp</span>
          </div>

          {/* 3. VERIFICATION QR / SERIAL NOTICE */}
          <div className="sm:text-right space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Document Security</div>
            <div className="inline-block bg-slate-50 border border-slate-300 rounded-lg p-2 text-left sm:text-right space-y-0.5">
              <div className="flex items-center gap-1.5 sm:justify-end text-emerald-700 font-bold text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Digitally Verified Copy</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                School ID: {tenant.id}
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* FOOTER TAGLINE & LEGAL NOTICE */}
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
        <div className="text-center sm:text-left">
          {footerNote}
        </div>
        <div className="shrink-0 font-mono text-[9px] text-slate-400">
          Page 1 of 1 · EduSmart Multi-Tenant Core
        </div>
      </div>

    </footer>
  );
};
