import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Accessibility, 
  Contrast, 
  Type, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  Check, 
  Volume2, 
  Sparkles, 
  Compass, 
  Search, 
  Sliders, 
  Maximize2,
  ExternalLink,
  Keyboard,
  ShieldCheck
} from 'lucide-react';
import { useAccessibility, LMSWorkspaceA11yInfo } from '../../context/AccessibilityContext';
import { Storage } from '../../utils/storage';
import { User } from '../../types';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchUser?: (user: User) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  onSwitchUser
}) => {
  const {
    highContrast,
    fontSize,
    screenReaderMode,
    reducedMotion,
    enhancedFocus,
    toggleHighContrast,
    setHighContrast,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    toggleScreenReaderMode,
    setScreenReaderMode,
    toggleReducedMotion,
    toggleEnhancedFocus,
    resetToDefaults,
    workspaces,
    announce
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'visual' | 'screen_reader' | 'navigation' | 'keyboard'>('visual');
  const [searchWorkspaceQuery, setSearchWorkspaceQuery] = useState('');
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null);

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredWorkspaces = workspaces.filter(w => 
    w.name.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) ||
    w.shortName.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) ||
    w.category.toLowerCase().includes(searchWorkspaceQuery.toLowerCase()) ||
    w.role.toLowerCase().includes(searchWorkspaceQuery.toLowerCase())
  );

  const handleQuickSwitch = (role: string) => {
    if (!onSwitchUser) return;
    const users = Storage.getUsers();
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      announce(`Switching to ${targetUser.name} (${targetUser.role})`);
      onSwitchUser(targetUser);
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-dialog-title"
      aria-describedby="a11y-dialog-desc"
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Accessibility className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="a11y-dialog-title" className="text-base sm:text-lg font-black tracking-tight text-white font-serif">
                  Accessibility & Assistive Settings
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  WCAG 2.1 AAA
                </span>
              </div>
              <p id="a11y-dialog-desc" className="text-xs text-slate-300 mt-0.5">
                Customize high-contrast display, scale font sizes, and enable screen-reader labels for all LMS workspaces.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Accessibility Dialog (Esc)"
            aria-label="Close Accessibility Settings Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'visual'}
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'visual'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Contrast & Font Size</span>
            {(highContrast || fontSize !== 100) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'screen_reader'}
            onClick={() => setActiveTab('screen_reader')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'screen_reader'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Screen Reader Mode</span>
            {screenReaderMode && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'navigation'}
            onClick={() => setActiveTab('navigation')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'navigation'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>LMS Workspaces Directory ({workspaces.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'keyboard'}
            onClick={() => setActiveTab('keyboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'keyboard'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-600" />
            <span>Focus & Motion</span>
            {(reducedMotion || enhancedFocus) && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 space-y-6">

          {/* TAB 1: VISUAL CONTRAST & FONT SIZING */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              {/* High Contrast Mode Section */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Contrast className="w-4 h-4 text-slate-900" />
                      <h3 className="text-sm font-bold text-slate-900">High-Contrast Mode</h3>
                      {highContrast && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Increases color contrast to WCAG 2.1 AAA levels with sharp 2px borders, deep black text, and distinct button outlines.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHighContrast(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !highContrast
                          ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-sm'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      aria-pressed={!highContrast}
                    >
                      Standard Contrast
                    </button>
                    <button
                      type="button"
                      onClick={() => setHighContrast(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        highContrast
                          ? 'bg-black text-white border-2 border-black shadow-md ring-2 ring-amber-400'
                          : 'bg-slate-900 text-white hover:bg-black'
                      }`}
                      aria-pressed={highContrast}
                    >
                      <Contrast className="w-3.5 h-3.5 text-amber-300" />
                      <span>High Contrast Mode</span>
                    </button>
                  </div>
                </div>

                {/* Contrast Preview Box */}
                <div className={`p-3 rounded-xl border text-xs transition-colors ${
                  highContrast 
                    ? 'bg-black text-white border-2 border-white' 
                    : 'bg-white text-slate-700 border-slate-200'
                }`}>
                  <span className="font-bold">Live Contrast Preview:</span> All dashboard cards, LMS navigation elements, and grading rubrics render with crisp distinction for users with low vision or photophobia.
                </div>
              </div>

              {/* Font Size Scaling Section */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Font Size Scaling</h3>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {fontSize}% Scale
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Increases base typography across the entire LMS platform proportionally, maintaining crisp layouts without breakage.
                    </p>
                  </div>

                  {/* Stepper buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={decreaseFontSize}
                      disabled={fontSize <= 100}
                      className="p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                      title="Decrease Font Size"
                      aria-label="Decrease Font Size"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {[100, 110, 125, 140].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFontSize(size)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            fontSize === size
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          aria-pressed={fontSize === size}
                        >
                          {size === 100 ? '100% (Standard)' : size === 110 ? '110%' : size === 125 ? '125%' : '140%'}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={increaseFontSize}
                      disabled={fontSize >= 140}
                      className="p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
                      title="Increase Font Size"
                      aria-label="Increase Font Size"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scaled Text Preview Card */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Typography Preview ({fontSize}%)
                  </div>
                  <h4 className="font-serif font-bold text-slate-900 leading-snug">
                    EduSmart Competency-Based Curriculum (CBC) Platform
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Formative strand evaluations, teacher schemes of work, and pupil portfolios are calibrated to Kenyan Ministry of Education standards.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCREEN READER MODE */}
          {activeTab === 'screen_reader' && (
            <div className="space-y-6">
              {/* Screen Reader Friendly Mode Toggle Card */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-blue-700" />
                      <h3 className="text-base font-bold text-blue-950">
                        Screen-Reader-Friendly Navigation Labels
                      </h3>
                      {screenReaderMode && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed max-w-xl">
                      When enabled, this injects explicit, context-rich ARIA labels, role identifiers, and descriptive spoken navigation landmarks across all 15 LMS workspace headers, sidebars, and action buttons.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={toggleScreenReaderMode}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0 ${
                      screenReaderMode
                        ? 'bg-blue-700 text-white ring-4 ring-blue-300'
                        : 'bg-white text-blue-900 border-2 border-blue-400 hover:bg-blue-100'
                    }`}
                    aria-pressed={screenReaderMode}
                  >
                    {screenReaderMode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Mode Active (Click to Turn Off)</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-blue-600" />
                        <span>Enable Screen Reader Labels</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Features enabled in screen reader mode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-xl border border-blue-200/80 text-xs space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verbose ARIA Labels</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Buttons and links describe their exact CBC workspace purpose rather than terse shortnames.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-blue-200/80 text-xs space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Live Speech Feedback</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Announces dynamic filter shifts, modal activations, and workspace role switches via aria-live.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-blue-200/80 text-xs space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      <span>Workspace Landmarks</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Enables semantic HTML5 landmarks (main, nav, banner, region) for seamless screen reader jumping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Screen Reader Output */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Spoken Label Comparison Sample</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => announce("Example announcement: Class Teacher Command Centre activated for Grade 7 Mara roll-call and pupil assessment remarks.")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Test Spoken Announcement
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Standard Visual Label</span>
                    <p className="font-medium text-slate-800">"Class Teacher Portal"</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-600 uppercase text-[10px] block mb-1">Screen-Reader Friendly Label</span>
                    <p className="font-semibold text-blue-950">
                      "Class Teacher Command Centre: Daily morning & afternoon roll-call registers, termly CBC report card remarks, learner discipline records, and lunch dining logs."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LMS WORKSPACES NAVIGATION DIRECTORY */}
          {activeTab === 'navigation' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    LMS Workspace Navigation Directory & Screen Reader Guide
                  </h3>
                  <p className="text-xs text-slate-600">
                    Comprehensive accessible directory of all 15 educational portals with spoken screen reader summaries and fast-switch actions.
                  </p>
                </div>

                {/* Filter / Search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchWorkspaceQuery}
                    onChange={(e) => setSearchWorkspaceQuery(e.target.value)}
                    placeholder="Search workspaces..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter LMS workspaces"
                  />
                  {searchWorkspaceQuery && (
                    <button
                      onClick={() => setSearchWorkspaceQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      aria-label="Clear workspace search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Workspaces List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredWorkspaces.map((ws, idx) => (
                  <div
                    key={ws.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-950 font-serif">
                          {ws.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ws.category === 'Learner' ? 'bg-emerald-100 text-emerald-800' :
                          ws.category === 'Academics' ? 'bg-indigo-100 text-indigo-800' :
                          ws.category === 'Leadership' ? 'bg-purple-100 text-purple-800' :
                          ws.category === 'Administration' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {ws.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Key: {ws.shortcutKey}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-snug">
                        {ws.screenReaderLabel}
                      </p>

                      <div className="text-[11px] text-slate-500 italic">
                        ARIA Spoken: "{ws.ariaDescription}"
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          announce(ws.screenReaderLabel);
                          setCopiedShortcut(ws.id);
                          setTimeout(() => setCopiedShortcut(null), 2000);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Read label aloud via screen reader announcer"
                        aria-label={`Read ${ws.name} label aloud`}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>{copiedShortcut === ws.id ? 'Announced!' : 'Hear Label'}</span>
                      </button>

                      {onSwitchUser && (
                        <button
                          type="button"
                          onClick={() => handleQuickSwitch(ws.role)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title={`Switch demo account to ${ws.shortName}`}
                          aria-label={`Switch to ${ws.name}`}
                        >
                          <span>Switch to Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredWorkspaces.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No workspaces found matching "{searchWorkspaceQuery}". Try another keyword like "Teacher", "Parent", or "Leadership".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FOCUS & MOTION */}
          {activeTab === 'keyboard' && (
            <div className="space-y-6">
              {/* Enhanced Focus Rings */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">Enhanced Focus Outlines</h3>
                    {enhancedFocus && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    Applies prominent 3px gold outlines around whichever button, tab, or input currently has keyboard focus. Essential for users navigating via Tab key.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleEnhancedFocus}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    enhancedFocus
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={enhancedFocus}
                >
                  {enhancedFocus ? 'Outlines Active' : 'Enable High-Visibility Outlines'}
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Reduced Motion Mode</h3>
                    {reducedMotion && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    Disables non-essential animations, slide-overs, pulse effects, and transitions to minimize visual fatigue and assist vestibular conditions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleReducedMotion}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    reducedMotion
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={reducedMotion}
                >
                  {reducedMotion ? 'Reduced Motion Active' : 'Enable Reduced Motion'}
                </button>
              </div>

              {/* Keyboard Shortcuts Reference */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    EduSmart Accessibility Keyboard Shortcuts
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Open Accessibility Settings</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Alt + A
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Toggle High Contrast</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Alt + C
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Close Any Modal</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Esc
                    </kbd>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Skip to Main Content</span>
                    <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                      Tab (First element)
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BAR WITH RESET AND CLOSE */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-200/80 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            title="Reset all accessibility preferences to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-slate-900 hover:bg-black transition-colors shadow-sm cursor-pointer"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
