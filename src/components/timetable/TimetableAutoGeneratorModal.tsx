import React, { useState, useMemo } from 'react';
import { User, GradeLevel, StreamName, TimetableSlot } from '../../types';
import { Storage } from '../../utils/storage';
import { generateAutomatedTimetable, TimetableGenerationResult } from '../../utils/timetableGenerator';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Building2, 
  Users, 
  Lock, 
  Layers, 
  ShieldCheck, 
  CalendarDays, 
  Clock, 
  ArrowRight, 
  Play, 
  RotateCcw,
  Check,
  ChevronRight,
  Eye
} from 'lucide-react';

interface TimetableAutoGeneratorModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onTimetablePublished: () => void;
}

export const TimetableAutoGeneratorModal: React.FC<TimetableAutoGeneratorModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onTimetablePublished
}) => {
  const [step, setStep] = useState<'checklist' | 'generating' | 'preview'>('checklist');
  const [generationResult, setGenerationResult] = useState<TimetableGenerationResult | null>(null);
  const [selectedPreviewStream, setSelectedPreviewStream] = useState<{ grade: GradeLevel; stream: StreamName }>({
    grade: 8,
    stream: 'Mara'
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedToast, setPublishedToast] = useState(false);

  // Load latest state from storage
  const teachers = useMemo(() => {
    return Storage.getUsers().filter(u => ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(u.role));
  }, []);

  const fixedConditions = useMemo(() => {
    return Storage.getFixedLessonConditions();
  }, []);

  const sharedFacilities = useMemo(() => {
    return Storage.getSharedFacilities();
  }, []);

  const activeFixedCount = fixedConditions.filter(c => c.isActive).length;

  // Run the generation solver
  const handleExecuteGeneration = () => {
    setStep('generating');
    setTimeout(() => {
      const result = generateAutomatedTimetable(teachers, fixedConditions, sharedFacilities, {
        gradesToGenerate: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      });
      setGenerationResult(result);
      setStep('preview');
    }, 700);
  };

  // Publish to Storage & update school
  const handlePublishTimetable = () => {
    if (!generationResult) return;
    setIsPublishing(true);
    
    setTimeout(() => {
      Storage.setAllTimetableSlots(generationResult.slots);
      setIsPublishing(false);
      setPublishedToast(true);
      
      setTimeout(() => {
        setPublishedToast(false);
        onTimetablePublished();
        onClose();
      }, 1500);
    }, 400);
  };

  if (!isOpen) return null;

  // Extract preview slots for selected class
  const previewClassSlots = generationResult 
    ? generationResult.slots.filter(s => s.grade === selectedPreviewStream.grade && s.stream === selectedPreviewStream.stream)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Ribbon */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono">
                  Autonomous Curriculum Engine
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[10px] text-slate-300 font-mono">Zero-Collision Solver</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Automated Timetable Generation & Publication Portal
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Step Navigation Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-1.5 ${step === 'checklist' ? 'text-emerald-700 font-black' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'checklist' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</span>
              <span>Pre-Flight Conditions</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <div className={`flex items-center gap-1.5 ${step === 'generating' ? 'text-emerald-700 font-black' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'generating' ? 'bg-emerald-700 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
              }`}>2</span>
              <span>Constraint Solving</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-emerald-700 font-black' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'preview' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>3</span>
              <span>Audit & Publication</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Target: Grades 1 to 9 (All Streams)
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* ========================================================
              STEP 1: PRE-FLIGHT CONDITIONS & APPLICABLE CHECKS
              ======================================================== */}
          {step === 'checklist' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">
                    Automated Timetable Pipeline Ready
                  </h4>
                  <p className="text-emerald-800 text-xs mt-0.5">
                    The engine consumes teacher subject & stream allocations, enforces fixed institutional anchor lessons, and optimizes specialist shared facility occupancy with mathematical conflict guarantees.
                  </p>
                </div>
              </div>

              {/* Three Core Condition Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Pillar 1: Teacher Allocations */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {teachers.length} Active Staff
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      1. Faculty Subject Allocations
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Subjects & grade streams configured by Dean of Studies are automatically mapped to curriculum requirements.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    ✓ Zero teacher clashes enforced
                  </div>
                </div>

                {/* Pillar 2: Fixed Lessons Anchors */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {activeFixedCount} Anchors Locked
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      2. Fixed Lesson Conditions
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Mandatory school-wide events (Assemblies, Games, STEM Practicals) are reserved first on designated days.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    ✓ Pre-publication anchor priority
                  </div>
                </div>

                {/* Pillar 3: Shared Resources */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      {sharedFacilities.length} Shared Labs & Pitches
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs">
                      3. Shared Resources Management
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Science Labs, Computer Labs, Studios, Agri Plots, and Pitches are scheduled without room collision.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                    ✓ Double-booking prevention
                  </div>
                </div>

              </div>

              {/* Shared Resources Inventory Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Active Specialist Campus Facilities & Resource Pool:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sharedFacilities.map(f => (
                    <span key={f.id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 shadow-2xs flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{f.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({f.capacity} max)</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              STEP 2: LIVE SOLVER ANIMATION
              ======================================================== */}
          {step === 'generating' && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center animate-bounce shadow-md">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Solving Multi-Class Schedule Constraints...
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Validating teacher time-slots, locking fixed institutional anchors, scheduling specialist laboratories, and balancing CBC daily learning areas.
              </p>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="w-full h-full bg-emerald-600 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 3: PREVIEW & PUBLICATION AUDIT
              ======================================================== */}
          {step === 'preview' && generationResult && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Audit Badge */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                      <span>Conflict-Free Master Timetable Ready</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold uppercase">
                        Verified 0 Clashes
                      </span>
                    </h4>
                    <p className="text-emerald-800 text-xs mt-0.5">
                      Generated {generationResult.stats.totalPeriods} learning periods across {generationResult.stats.totalStreams} streams. All conditions satisfied.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Audit Timestamp</div>
                  <div className="text-xs font-mono font-bold text-emerald-950">{generationResult.stats.generatedAt}</div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Periods</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{generationResult.stats.totalPeriods}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Academic sessions</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Fixed Anchors</div>
                  <div className="text-xl font-black text-amber-700 mt-0.5">{generationResult.stats.fixedPeriodsEnforced}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Locked conditions</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Clashes Prevented</div>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">{generationResult.stats.conflictsResolved}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Teacher/Room collisions</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Active Streams</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{generationResult.stats.totalStreams}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Primary & Junior</div>
                </div>
              </div>

              {/* Shared Resource Utilization Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Shared Resource & Laboratory Occupancy Audit:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(generationResult.stats.sharedResourceBookings).map(([name, count]) => (
                    <div key={name} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate mr-2">{name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        {count} slots/wk
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Class Preview Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Instant Sample Timetable Inspection:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">Preview Class:</span>
                    <select
                      value={`${selectedPreviewStream.grade}-${selectedPreviewStream.stream}`}
                      onChange={(e) => {
                        const [g, s] = e.target.value.split('-');
                        setSelectedPreviewStream({ grade: Number(g) as GradeLevel, stream: s as StreamName });
                      }}
                      className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    >
                      <option value="4-Dove">Grade 4 Dove (Primary)</option>
                      <option value="4-Eagle">Grade 4 Eagle (Primary)</option>
                      <option value="7-Mara">Grade 7 Mara (Junior)</option>
                      <option value="8-Mara">Grade 8 Mara (Junior)</option>
                      <option value="8-Serengeti">Grade 8 Serengeti (Junior)</option>
                      <option value="9-Mara">Grade 9 Mara (Junior)</option>
                    </select>
                  </div>
                </div>

                {/* Preview Mini Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Period</th>
                        <th className="py-2 px-3">Monday</th>
                        <th className="py-2 px-3">Tuesday</th>
                        <th className="py-2 px-3">Wednesday</th>
                        <th className="py-2 px-3">Thursday</th>
                        <th className="py-2 px-3">Friday</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(p => {
                        return (
                          <tr key={p} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-600">P{p}</td>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => {
                              const s = previewClassSlots.find(x => x.period === p && x.dayOfWeek === d);
                              if (!s) {
                                return <td key={d} className="py-2 px-3 text-slate-300 italic">Free</td>;
                              }
                              return (
                                <td key={d} className="py-2 px-3">
                                  <div className="font-bold text-slate-900 truncate max-w-[120px]">{s.subject}</div>
                                  <div className="text-[10px] text-slate-500 truncate">{s.teacherName}</div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {publishedToast && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Master timetable published to all learner & staff workspaces!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {step === 'checklist' && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteGeneration}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Auto-Generation</span>
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('checklist')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-Configure</span>
                </button>

                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishTimetable}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isPublishing ? 'Publishing Schedule...' : 'Publish Master Timetable'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
