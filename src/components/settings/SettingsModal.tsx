import React, { useState } from 'react';
import { StorageManagementDashboard } from './StorageManagementDashboard';
import { 
  Settings, 
  HardDrive, 
  Wifi, 
  Sliders, 
  X, 
  Check, 
  Moon, 
  Sun, 
  Database,
  Smartphone,
  ShieldCheck,
  School,
  CheckCircle2
} from 'lucide-react';
import { useMobileLayout } from '../../context/MobileLayoutContext';
import { useTenant } from '../../context/TenantContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'storage' | 'connectivity' | 'preferences';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'storage'
}) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'connectivity' | 'preferences'>(defaultTab);

  const { isMobileOverlapProtectionEnabled, setMobileOverlapProtection } = useMobileLayout();
  const { currentTenant, allTenants, switchTenant } = useTenant();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* MODAL TOP HEADER */}
        <div className="p-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs">
              <Settings className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                System & Portal Settings
              </h3>
              <p className="text-[11px] text-slate-500">
                Device storage, offline sync management, and application preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HORIZONTAL SETTINGS TABS */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
          
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'storage' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>1. Storage Management & CBC Cache</span>
          </button>

          <button
            onClick={() => setActiveTab('connectivity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'connectivity' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>2. Offline & Network Continuity</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'preferences' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. General & Preferences</span>
          </button>

        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'storage' && (
            <StorageManagementDashboard onClose={onClose} />
          )}

          {activeTab === 'connectivity' && (
            <div className="p-6 max-w-2xl mx-auto space-y-6 text-xs text-slate-700">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Intermittent Connectivity Shield</h4>
                    <p className="text-[11px] text-slate-500">How EduSmart handles low-bandwidth or offline environments</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block">Automatic Background Sync</span>
                      <span className="text-[11px] text-slate-500">Automatically update cached CBC lesson notes whenever connection is restored</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block">Low Data / 2G-3G Optimization</span>
                      <span className="text-[11px] text-slate-500">Prioritize text-based notes and formulas before loading high-resolution multimedia</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-800 block">Pre-cache Frequently Accessed Notes</span>
                      <span className="text-[11px] text-slate-500">Keep Grade 4 to Grade 7 core strand summaries perpetually ready offline</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="p-6 max-w-2xl mx-auto space-y-6 text-xs text-slate-700">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Application Preferences</h4>
                    <p className="text-[11px] text-slate-500">Customize reading contrast and typography</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Reading Text Size</span>
                      <span className="text-[11px] text-slate-500">Optimize font scaling for classroom tablets and mobile screens</span>
                    </div>
                    <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700">
                      <option>Standard (100%)</option>
                      <option>Medium (110%)</option>
                      <option>Large (125%)</option>
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Service Worker Status</span>
                      <span className="text-[11px] text-slate-500">PWA Offline Worker is actively registered</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Active & Protected
                    </span>
                  </div>

                  {/* Mobile Screen Overlap Protection Setting */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-emerald-950 block">Mobile Screen Overlap Protection</span>
                      </div>
                      <span className="text-[11px] text-emerald-800 mt-0.5 block">
                        Disables screen overlapping and floating item collisions on mobile phones across all pages
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMobileOverlapProtectionEnabled}
                        onChange={(e) => setMobileOverlapProtection(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Multi-Tenancy School Campus Configuration */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <School className="w-4 h-4 text-indigo-700" />
                        <span className="font-bold text-slate-900">Multi-Tenancy Active Campus</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
                        {currentTenant.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {allTenants.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => switchTenant(t.id)}
                          className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                            currentTenant.id === t.id
                              ? 'bg-white border-emerald-500 shadow-2xs font-bold text-emerald-950 ring-1 ring-emerald-500'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-[12px] text-slate-900">{t.name}</div>
                            <div className="text-[10px] text-slate-500">{t.city} · {t.totalStudents} Learners</div>
                          </div>
                          {currentTenant.id === t.id && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold">
            EduSmart PORTAL · CBC Offline Caching & Storage Subsystem
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
