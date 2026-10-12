import React, { useState, useEffect } from 'react';
import { 
  OfflineCacheManager, 
  OfflineCacheStatus, 
  CachedCBCModule, 
  SubjectStorageSummary 
} from '../../utils/offlineCacheManager';
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Calculator, 
  FlaskConical, 
  Globe2, 
  Palette, 
  Languages, 
  HeartHandshake, 
  Wrench, 
  Wheat, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Eye, 
  X, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Sparkles,
  Info
} from 'lucide-react';

interface StorageManagementDashboardProps {
  onClose?: () => void;
}

export const StorageManagementDashboard: React.FC<StorageManagementDashboardProps> = ({ 
  onClose 
}) => {
  const [status, setStatus] = useState<OfflineCacheStatus>(() => OfflineCacheManager.getStatus());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [previewModule, setPreviewModule] = useState<CachedCBCModule | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Sync with real-time storage events
  useEffect(() => {
    const handleUpdate = () => {
      setStatus(OfflineCacheManager.getStatus());
    };

    window.addEventListener('offline-cache-updated', handleUpdate);
    window.addEventListener('online', handleUpdate);
    window.addEventListener('offline', handleUpdate);

    return () => {
      window.removeEventListener('offline-cache-updated', handleUpdate);
      window.removeEventListener('online', handleUpdate);
      window.removeEventListener('offline', handleUpdate);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    await OfflineCacheManager.cacheAllMaterials();
    setIsSyncingAll(false);
    showToast('All CBC learning materials successfully cached for offline use!', 'success');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all locally cached CBC learning materials? You will need an internet connection to access them again.')) {
      OfflineCacheManager.clearAllCache();
      showToast('All cached CBC materials cleared from local storage.', 'info');
    }
  };

  const handleClearSubject = (subject: string) => {
    if (window.confirm(`Clear cached learning materials for "${subject}"?`)) {
      OfflineCacheManager.clearCacheBySubject(subject);
      showToast(`Cleared cache for ${subject}.`, 'info');
    }
  };

  const handleCacheSubject = (subject: string) => {
    OfflineCacheManager.cacheSubject(subject);
    showToast(`Cached all available modules for ${subject}.`, 'success');
  };

  const handleToggleModule = (module: CachedCBCModule) => {
    if (module.isCached) {
      OfflineCacheManager.clearModule(module.id);
      showToast(`Removed "${module.title}" from local storage cache.`, 'info');
    } else {
      OfflineCacheManager.cacheModule(module.id);
      showToast(`Downloaded "${module.title}" for offline access.`, 'success');
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Mathematics': return <Calculator className="w-5 h-5 text-blue-600" />;
      case 'Integrated Science': return <FlaskConical className="w-5 h-5 text-emerald-600" />;
      case 'English': return <BookOpen className="w-5 h-5 text-indigo-600" />;
      case 'Kiswahili': return <Languages className="w-5 h-5 text-amber-600" />;
      case 'Social Studies': return <Globe2 className="w-5 h-5 text-purple-600" />;
      case 'Agriculture & Nutrition': return <Wheat className="w-5 h-5 text-lime-600" />;
      case 'Creative Arts & Sports': return <Palette className="w-5 h-5 text-rose-600" />;
      case 'Christian Religious Education': return <HeartHandshake className="w-5 h-5 text-sky-600" />;
      case 'Pre-Technical Studies': return <Wrench className="w-5 h-5 text-orange-600" />;
      default: return <BookOpen className="w-5 h-5 text-slate-600" />;
    }
  };

  // Filter subjects and modules
  const filteredSubjects = status.bySubject.map(s => {
    const matchingModules = s.modules.filter(m => {
      const matchesSearch = searchQuery === '' || 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.strandTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = selectedGrade === 'all' || m.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });

    return {
      ...s,
      filteredModules: matchingModules
    };
  }).filter(s => s.filteredModules.length > 0);

  return (
    <div className="bg-slate-50 min-h-full flex flex-col font-sans">
      
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-2 ${
          feedbackToast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          feedbackToast.type === 'warn' ? 'bg-amber-950 text-amber-200 border-amber-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {feedbackToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <div className="bg-white border-b border-slate-200 p-4 sm:p-6 sticky top-0 z-10 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <HardDrive className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Device Storage Management
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  status.isOnline 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {status.isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
                  {status.isOnline ? 'Online Sync Active' : 'Offline Mode (Local Storage)'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                CBC Learning Materials Storage Management
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Close Storage Management"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
        
        {/* TOP METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Device Storage Footprint */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Device Storage Used</span>
              <HardDrive className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {status.formattedTotalSize}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Browser Local Storage & IndexedDB Cache
            </p>
          </div>

          {/* 2. Offline Availability */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Offline Availability</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {status.percentage}%
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${status.percentage}%` }}
              />
            </div>
          </div>

          {/* 3. Cached Modules Count */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Cached Modules</span>
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {status.cachedCount} <span className="text-sm font-semibold text-slate-400">/ {status.totalAvailable}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {status.totalAvailable - status.cachedCount} modules available to sync
            </p>
          </div>

          {/* 4. Connectivity Health */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Sync Health</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${
                status.syncHealth === 'synced' ? 'bg-emerald-500' :
                status.syncHealth === 'partial' ? 'bg-amber-500' :
                'bg-slate-400'
              }`} />
              <span className="capitalize">{status.syncHealth === 'partial' ? 'Partially Synced' : status.syncHealth}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Last checked: {new Date(status.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search & Grade Filter */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CBC subjects, strands or notes..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Grades</option>
                <option value={4}>Grade 4</option>
                <option value={5}>Grade 5</option>
                <option value={6}>Grade 6</option>
                <option value={7}>Grade 7</option>
              </select>
            </div>
          </div>

          {/* Global Cache Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSyncingAll 
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed' 
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Downloading...' : 'Cache All Materials (100%)'}</span>
            </button>

            <button
              onClick={handleClearAll}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all offline cache"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Entire Cache</span>
            </button>
          </div>

        </div>

        {/* INTERMITTENT CONNECTIVITY NOTICE */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <span className="font-extrabold text-emerald-900 block">Offline CBC Learning Material Continuity Shield</span>
            <p className="text-emerald-800 leading-relaxed">
              When intermittent connectivity occurs or when travelling to remote school campuses, EduSmart automatically serves cached lesson notes, audio transcripts, and diagrams directly from local device memory. You can manually delete individual subjects below to manage device storage space.
            </p>
          </div>
        </div>

        {/* SUBJECT-BY-SUBJECT BREAKDOWN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Storage Usage by CBC Learning Area ({filteredSubjects.length} Subjects)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Click any subject to view and clear specific modules
            </span>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
              No CBC learning areas match your filter criteria.
            </div>
          ) : (
            filteredSubjects.map(subj => {
              const isExpanded = expandedSubjects[subj.subject] ?? true;

              return (
                <div key={subj.subject} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
                  
                  {/* Subject Summary Header Card */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                    
                    <div 
                      className="flex items-center gap-3 cursor-pointer select-none flex-1"
                      onClick={() => toggleSubject(subj.subject)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                        {getSubjectIcon(subj.subject)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {subj.subject}
                          </h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {subj.cachedModules} of {subj.totalModules} cached
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Storage Used: <span className="font-bold text-slate-800">{subj.formattedSize}</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex items-center gap-4">
                      {/* Mini progress bar */}
                      <div className="w-28 sm:w-36 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>Offline Ready</span>
                          <span>{subj.percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              subj.percentage === 100 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${subj.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Subject Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {subj.cachedModules < subj.totalModules ? (
                          <button
                            onClick={() => handleCacheSubject(subj.subject)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Download all modules for this subject"
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">Cache All</span>
                          </button>
                        ) : (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fully Cached</span>
                          </span>
                        )}

                        <button
                          onClick={() => handleClearSubject(subj.subject)}
                          disabled={subj.cachedModules === 0}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            subj.cachedModules === 0 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                          title="Clear cache for this subject"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span className="hidden sm:inline">Clear Subject</span>
                        </button>

                        <button
                          onClick={() => toggleSubject(subj.subject)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* Expandable Module Breakdown List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {subj.filteredModules.map(mod => (
                        <div key={mod.id} className="p-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                          
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              mod.isCached ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300'
                            }`} />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {mod.title}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Grade {mod.grade}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {mod.strandTopic}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {mod.summary}
                              </p>
                            </div>
                          </div>

                          {/* Module Size & Granular Clear/Cache Action */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <span className="text-xs font-bold text-slate-600">
                              {OfflineCacheManager.formatBytes(mod.sizeBytes)}
                            </span>

                            <button
                              onClick={() => setPreviewModule(mod)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Preview Lesson Notes & Key Takeaways"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {mod.isCached ? (
                              <button
                                onClick={() => handleToggleModule(mod)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Clear module from local cache"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Clear Cache</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleModule(mod)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Download and cache module"
                              >
                                <Download className="w-3 h-3" />
                                <span>Cache Locally</span>
                              </button>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* CONTENT PREVIEW MODAL */}
      {previewModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95">
            
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{previewModule.title}</h4>
                  <p className="text-xs text-slate-500">Grade {previewModule.grade} · {previewModule.subject}</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewModule(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Curriculum Strand & Summary:</span>
                <p>{previewModule.summary}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 text-sm block mb-1">Lesson Content (Cached Offline Copy):</span>
                <p className="whitespace-pre-line text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                  {previewModule.content}
                </p>
              </div>

              {previewModule.keyTakeaways && previewModule.keyTakeaways.length > 0 && (
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-1.5">Key Core Competencies & Takeaways:</span>
                  <ul className="list-disc pl-4 space-y-1 text-emerald-800">
                    {previewModule.keyTakeaways.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Size in storage: <strong className="text-slate-800">{OfflineCacheManager.formatBytes(previewModule.sizeBytes)}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleModule(previewModule);
                    setPreviewModule({
                      ...previewModule,
                      isCached: !previewModule.isCached
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewModule.isCached 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  {previewModule.isCached ? 'Remove from Cache' : 'Cache for Offline Access'}
                </button>

                <button
                  onClick={() => setPreviewModule(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
