import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  School, 
  Search, 
  MapPin, 
  GraduationCap, 
  Users, 
  Check, 
  X, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Building2, 
  BookOpen, 
  Award,
  CheckCircle2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant } from '../../types/tenant';

interface CampusSwitcherWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampusSwitcherWindow: React.FC<CampusSwitcherWindowProps> = ({
  isOpen,
  onClose
}) => {
  const { currentTenant, allTenants, switchTenant } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('All');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // Keyboard shortcut to close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent background scrolling while modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Extract unique cities/counties
  const counties = useMemo(() => {
    const list = Array.from(new Set(allTenants.map(t => t.city)));
    return ['All', ...list];
  }, [allTenants]);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return allTenants.filter(t => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.principalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.curriculum.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCounty = selectedCounty === 'All' || t.city === selectedCounty;

      return matchesSearch && matchesCounty;
    });
  }, [allTenants, searchQuery, selectedCounty]);

  if (!isOpen) return null;

  const handleSelectCampus = (tenant: Tenant) => {
    if (tenant.id === currentTenant.id) return;
    switchTenant(tenant.id);
    setSwitchFeedback(`Switched active multi-tenancy session to ${tenant.name}`);
    setTimeout(() => {
      setSwitchFeedback(null);
      onClose();
    }, 700);
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md transition-all duration-200 flex flex-col items-center justify-center ${
        isFullscreen 
          ? 'p-0 overflow-hidden' 
          : 'p-2 sm:p-4 md:p-6 overflow-hidden'
      }`}
      onClick={(e) => {
        // Close when clicking the outer backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="EduSmart Multi-Tenancy Campus Switcher"
    >
      
      {/* Dedicated Desktop-Style Window Container */}
      <div 
        className={`w-full bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 border border-slate-700/60 ${
          isFullscreen 
            ? 'h-screen w-screen rounded-none border-0' 
            : 'max-w-5xl h-[92vh] max-h-[92vh] rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* WINDOW TITLE BAR WITH CONTROLS & UNMISSABLE CLOSE BUTTON */}
        <div className="bg-slate-900 text-white px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800 select-none shrink-0 gap-2">
          
          {/* Traffic Light Window Controls & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mr-1 shrink-0">
              <button 
                onClick={onClose}
                className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center text-[9px] text-white font-bold cursor-pointer"
                title="Close Window (Esc)"
                aria-label="Close Window"
              >
                <X className="w-2.5 h-2.5" />
              </button>
              <button 
                onClick={() => setIsFullscreen(prev => !prev)}
                className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center cursor-pointer"
                title="Toggle Window Size"
                aria-label="Toggle Window Size"
              />
              <button 
                onClick={() => setIsFullscreen(prev => !prev)}
                className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center text-[8px] text-emerald-950 cursor-pointer"
                title={isFullscreen ? 'Restore Window Size' : 'Expand to Full Page'}
                aria-label="Expand Window"
              >
                <Maximize2 className="w-2 h-2" />
              </button>
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 shrink-0 hidden xs:flex">
                <School className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate block">
                  Campus Switcher · Multi-Tenancy Institutional Network
                </span>
                <span className="text-[10px] text-slate-400 truncate hidden sm:block">
                  Active Session: <strong className="text-emerald-300 font-serif">{currentTenant.name}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Window Right Action Tools: Full Page View & Unmissable Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden xl:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Isolated DB</span>
            </span>

            {/* Full Page View Button */}
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 shrink-0"
              title={isFullscreen ? 'Restore standard window view' : 'Expand to full page view'}
              aria-label={isFullscreen ? 'Restore standard window view' : 'Expand to full page view'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Exit Full Page</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Full Page View</span>
                </>
              )}
            </button>

            {/* UNMISSABLE CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="px-3 sm:px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer active:scale-95 shrink-0"
              title="Close Window (Esc)"
              aria-label="Close Window"
            >
              <X className="w-4 h-4 text-white" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER (WHEN SWITCHED) */}
        {switchFeedback && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 shadow-inner animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>{switchFeedback}</span>
            </div>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-100" />
          </div>
        )}

        {/* WINDOW HEADER & SEARCH CONTROLS */}
        <div className="p-3 sm:p-5 border-b border-slate-200 bg-slate-50/80 shrink-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Multi-School Campus Directory</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  {filteredTenants.length} of {allTenants.length} Schools
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Each campus operates in an isolated tenant partition with independent learner records, timetables, and CBC rubrics.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Campuses</div>
                <div className="font-extrabold text-slate-900 font-mono">{allTenants.length} Active</div>
              </div>
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Learners</div>
                <div className="font-extrabold text-emerald-700 font-mono">
                  {allTenants.reduce((acc, t) => acc + t.totalStudents, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs text-center hidden sm:block">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Faculty</div>
                <div className="font-extrabold text-indigo-700 font-mono">
                  {allTenants.reduce((acc, t) => acc + t.totalFaculty, 0)} Teachers
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & City Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campus by school name, NEMIS code, city, curriculum, or principal..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* City / County Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
              <span className="text-[11px] font-semibold text-slate-400 hidden lg:inline mr-1">
                Filter:
              </span>
              {counties.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCounty(c)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                    selectedCounty === c
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {c === 'All' ? 'All Locations' : c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WINDOW BODY: CURRENT ACTIVE INSTITUTION & SCHOOL DIRECTORY GRID */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 bg-slate-100/70">
          
          {/* CURRENTLY ACTIVE INSTITUTION BANNER */}
          <div 
            style={currentTenant.customBgColor ? { backgroundColor: currentTenant.customBgColor } : undefined}
            className={`rounded-2xl p-4 sm:p-5 text-white shadow-md border relative overflow-hidden transition-all ${
              currentTenant.customBgColor 
                ? 'border-white/20' 
                : 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-emerald-500/30'
            }`}
          >
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                
                {/* Active School Logo */}
                {currentTenant.customLogoBase64 || currentTenant.logoUrl ? (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white p-1 border-2 border-emerald-400/40 shadow-md shrink-0 flex items-center justify-center">
                    <img 
                      src={currentTenant.customLogoBase64 || currentTenant.logoUrl} 
                      alt={`${currentTenant.name} Crest`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-900 border-2 border-emerald-400/40 flex flex-col items-center justify-center text-white shrink-0 p-1">
                    <GraduationCap className="w-7 h-7 text-amber-300" />
                    <span className="text-[8px] font-mono font-bold mt-0.5 text-emerald-200">ACTIVE</span>
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Current Active Campus</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      NEMIS: {currentTenant.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      EST. {currentTenant.establishedYear}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-xl font-black text-white tracking-tight mt-1 font-serif">
                    {currentTenant.name}
                  </h3>

                  <p className="text-xs text-emerald-200/90 italic font-medium mt-0.5">
                    "{currentTenant.motto}"
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-2 font-sans">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{currentTenant.address}, {currentTenant.city}</span>
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{currentTenant.totalStudents} Learners · {currentTenant.totalFaculty} Faculty</span>
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span>Principal: {currentTenant.principalName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-mono text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Session Live & Authenticated</span>
                </div>
              </div>
            </div>
          </div>

          {/* SCHOOLS DIRECTORY GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Available Institutional Campuses ({filteredTenants.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click "Launch Campus Session" to switch school context
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredTenants.map((tenant) => {
                const isActive = tenant.id === currentTenant.id;
                
                return (
                  <div
                    key={tenant.id}
                    className={`rounded-2xl border transition-all p-4 sm:p-5 flex flex-col justify-between gap-4 bg-white ${
                      isActive 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/20' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Header of School Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          
                          {/* Logo */}
                          {tenant.customLogoBase64 || tenant.logoUrl ? (
                            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-white p-1 border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                              <img 
                                src={tenant.customLogoBase64 || tenant.logoUrl} 
                                alt={`${tenant.name} Logo`} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-white shrink-0 p-1">
                              <School className="w-6 h-6 text-sky-400" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {tenant.code}
                              </span>
                              <span className="text-[9px] font-medium text-slate-500">
                                EST. {tenant.establishedYear}
                              </span>
                            </div>

                            <h4 className="text-sm sm:text-base font-black text-slate-900 font-serif leading-snug mt-0.5">
                              {tenant.name}
                            </h4>
                          </div>
                        </div>

                        {isActive && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>

                      {/* Motto */}
                      <p className="text-xs text-slate-600 italic mt-2.5 pl-1 border-l-2 border-slate-200">
                        "{tenant.motto}"
                      </p>

                      {/* Details & Specs */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>Location:</span>
                          </span>
                          <span className="font-semibold text-slate-800">{tenant.address}, {tenant.city}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            <span>Curriculum:</span>
                          </span>
                          <span className="font-medium text-slate-800">{tenant.curriculum}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>Enrollment:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {tenant.totalStudents} Learners · {tenant.totalFaculty} Teachers
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Award className="w-3 h-3 text-slate-400" />
                            <span>Principal:</span>
                          </span>
                          <span className="font-semibold text-slate-800 truncate max-w-[180px]">{tenant.principalName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                        {tenant.domain}
                      </div>

                      <button
                        onClick={() => handleSelectCampus(tenant)}
                        disabled={isActive}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-slate-900 hover:bg-emerald-700 text-white shadow-xs active:scale-98'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Current Campus</span>
                          </>
                        ) : (
                          <>
                            <School className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Launch Campus Session →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DEDICATED WINDOW FOOTER & ACTIONS */}
        <div className="p-3 sm:px-6 bg-slate-900 text-slate-300 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] leading-tight text-slate-300">
              Multi-Tenancy Isolation Protocol Active: Zero data crossover between distinct educational institutions.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="px-3 sm:px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-700 inline-flex items-center gap-1.5 shrink-0"
              title={isFullscreen ? 'Restore standard window view' : 'Expand to full page view'}
              aria-label={isFullscreen ? 'Restore standard window view' : 'Expand to full page view'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isFullscreen ? 'Exit Full Page' : 'Full Page'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 sm:px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 shrink-0"
              title="Close Campus Switcher (Esc)"
              aria-label="Close Campus Switcher"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Window</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
