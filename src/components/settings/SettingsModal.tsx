import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  CheckCircle2,
  Maximize2,
  Minimize2
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { isMobileOverlapProtectionEnabled, setMobileOverlapProtection } = useMobileLayout();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md transition-all duration-200 ${
        isFullscreen ? 'p-0 overflow-hidden' : 'p-2 sm:p-4 md:p-6 overflow-hidden'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="System and Portal Settings"
    >
      <div 
        className={`bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-700/50 transition-all duration-200 ${
          isFullscreen ? 'w-screen h-screen rounded-none border-0' : 'max-w-5xl w-full h-[90vh] max-h-[92vh] rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* MODAL TOP HEADER WITH FULL PAGE VIEW AND UNMISSABLE CLOSE BUTTON */}
        <div className="p-3 sm:px-6 sm:py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Settings className="w-4 h-4 text-slate-100" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                System & Portal Settings
              </h3>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                Device storage, offline sync management, and application preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Full Page View Button */}
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title={isFullscreen ? 'Restore standard view' : 'Expand to full page view'}
              aria-label={isFullscreen ? 'Restore standard view' : 'Expand to full page view'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Exit Full Page</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Full Page View</span>
                </>
              )}
            </button>

            {/* UNMISSABLE CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="px-3 sm:px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Close Settings (Esc)"
              aria-label="Close Settings"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
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

        {/* MODAL BODY (SCROLLABLE WITH MIN-H-0) */}
        <div className="flex-1 min-h-0 overflow-y-auto">
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

                  {/* Multi-Tenancy School Campus Institutional Info */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <School className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-slate-900">Current Institution Campus</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {currentTenant.code}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{currentTenant.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {currentTenant.city}, {currentTenant.county} · {currentTenant.motto}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Active Campus
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Multi-institution campus switching is managed exclusively from the central Super Administrator Portal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 gap-2">
          <span className="text-[11px] text-slate-500 font-semibold truncate">
            EduSmart PORTAL · CBC Offline Caching & Storage Subsystem
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
              title={isFullscreen ? 'Restore standard view' : 'Expand to full page view'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-600" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{isFullscreen ? 'Exit Full Page' : 'Full Page'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              Close Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
