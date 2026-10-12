import React, { useState, useEffect, useRef } from 'react';
import { 
  OfflineCacheManager, 
  OfflineCacheStatus, 
  OfflineSyncHealth 
} from '../../utils/offlineCacheManager';
import { 
  HardDrive, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface OfflineSyncIndicatorProps {
  onOpenStorageManagement?: () => void;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({ 
  onOpenStorageManagement 
}) => {
  const [status, setStatus] = useState<OfflineCacheStatus>(() => OfflineCacheManager.getStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update status on events
  useEffect(() => {
    const handleUpdate = () => {
      setStatus(OfflineCacheManager.getStatus());
    };

    const handleSyncState = (e: any) => {
      if (e.detail?.state === 'syncing') {
        setIsSyncing(true);
      } else {
        setIsSyncing(false);
        setStatus(OfflineCacheManager.getStatus());
      }
    };

    const handleOnline = () => {
      setStatus(OfflineCacheManager.getStatus());
    };

    const handleOffline = () => {
      setStatus(OfflineCacheManager.getStatus());
    };

    window.addEventListener('offline-cache-updated', handleUpdate);
    window.addEventListener('offline-cache-sync-state', handleSyncState);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setStatus(OfflineCacheManager.getStatus());

    return () => {
      window.removeEventListener('offline-cache-updated', handleUpdate);
      window.removeEventListener('offline-cache-sync-state', handleSyncState);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await OfflineCacheManager.cacheAllMaterials();
    setIsSyncing(false);
    setStatus(OfflineCacheManager.getStatus());
  };

  // Status Dot Color based on local storage sync health
  const getStatusDotClasses = () => {
    if (isSyncing) {
      return {
        dot: 'bg-blue-500 animate-pulse',
        ping: 'bg-blue-400 opacity-75 animate-ping',
        ring: 'ring-blue-200',
        label: 'Syncing CBC Materials...'
      };
    }
    if (!status.isOnline) {
      return {
        dot: 'bg-slate-400',
        ping: 'hidden',
        ring: 'ring-slate-200',
        label: 'Offline (Cache Active)'
      };
    }
    if (status.percentage === 100) {
      return {
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
        ping: 'hidden',
        ring: 'ring-emerald-200',
        label: '100% Synced'
      };
    }
    if (status.percentage > 0) {
      return {
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
        ping: 'hidden',
        ring: 'ring-amber-200',
        label: `${status.percentage}% Cached`
      };
    }
    return {
      dot: 'bg-rose-500',
      ping: 'hidden',
      ring: 'ring-rose-200',
      label: 'Not Cached'
    };
  };

  const dotConfig = getStatusDotClasses();

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Visual Indicator Button in Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-xs transition-all shadow-2xs group focus:outline-none focus:ring-2 focus:ring-emerald-500"
        title="CBC Offline Sync Status & Local Storage Cache"
        aria-label="Offline sync status indicator"
      >
        {/* Status Dot with Health Ring */}
        <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotConfig.ping}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotConfig.dot}`} />
        </span>

        {/* Progress Bar visualizer (Enhanced Navbar Feature) */}
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 tracking-tight whitespace-nowrap">
              Offline Cache
            </span>
            <span className="text-[10px] font-extrabold text-slate-500">
              {status.percentage}%
            </span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-14 sm:w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isSyncing 
                  ? 'bg-blue-500 animate-pulse' 
                  : status.percentage === 100 
                  ? 'bg-emerald-600' 
                  : status.percentage > 40 
                  ? 'bg-amber-500' 
                  : 'bg-rose-500'
              }`}
              style={{ width: `${status.percentage}%` }}
            />
          </div>
        </div>

        <HardDrive className="w-3 h-3 text-slate-400 group-hover:text-slate-600 hidden sm:inline ml-0.5" />
      </button>

      {/* Interactive Status & Sync Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">CBC Offline Sync Status</h4>
                <p className="text-[10px] text-slate-500">Intermittent Connectivity Shield</p>
              </div>
            </div>

            {/* Network indicator pill */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              status.isOnline 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {status.isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {status.isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>

          {/* Sync Health & Progress Section */}
          <div className="my-3 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Cached Learning Materials</span>
              <span className="font-bold text-slate-900">
                {status.cachedCount} / {status.totalAvailable} modules ({status.percentage}%)
              </span>
            </div>

            {/* Expanded Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isSyncing 
                    ? 'bg-blue-500 animate-pulse' 
                    : status.percentage === 100 
                    ? 'bg-emerald-600' 
                    : 'bg-amber-500'
                }`}
                style={{ width: `${status.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Local Storage Footprint:</span>
              <span className="font-bold text-slate-800">{status.formattedTotalSize}</span>
            </div>
          </div>

          {/* Quick Info */}
          <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
            Lesson notes, diagrams, and audio transcripts are saved in browser storage so learners and teachers can access critical CBC notes with zero internet.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSyncing 
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing CBC Materials...' : 'Cache All Materials Now (100%)'}</span>
            </button>

            {onOpenStorageManagement && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenStorageManagement();
                }}
                className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Storage Management Dashboard</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
