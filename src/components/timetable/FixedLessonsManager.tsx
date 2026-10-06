import React, { useState } from 'react';
import { FixedLessonCondition, GradeLevel, StreamName, SubjectName } from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Lock, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  CalendarDays, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Info
} from 'lucide-react';

interface FixedLessonsManagerProps {
  onConditionsChanged?: () => void;
  onTriggerAutoGeneration?: () => void;
}

const DAYS_OF_WEEK: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
  'Monday', 
  'Tuesday', 
  'Wednesday', 
  'Thursday', 
  'Friday'
];

export const FixedLessonsManager: React.FC<FixedLessonsManagerProps> = ({
  onConditionsChanged,
  onTriggerAutoGeneration
}) => {
  const [conditions, setConditions] = useState<FixedLessonCondition[]>(() => Storage.getFixedLessonConditions());
  const [showModal, setShowModal] = useState(false);
  const [conditionToEdit, setConditionToEdit] = useState<FixedLessonCondition | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Pastoral Care & Assembly');
  const [formDay, setFormDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formGrades, setFormGrades] = useState<GradeLevel[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [formRoom, setFormRoom] = useState('Main Assembly Quadrangle');
  const [formTeacher, setFormTeacher] = useState('Faculty Lead');
  const [formNotes, setFormNotes] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Open modal for add or edit
  const handleOpenModal = (cond?: FixedLessonCondition) => {
    if (cond) {
      setConditionToEdit(cond);
      setFormTitle(cond.title);
      setFormSubject(cond.subject);
      setFormDay(cond.dayOfWeek);
      setFormPeriod(cond.period);
      setFormGrades([...cond.grades]);
      setFormRoom(cond.roomName || 'Specialist Facility');
      setFormTeacher(cond.teacherName || 'Faculty Supervisor');
      setFormNotes(cond.notes || '');
    } else {
      setConditionToEdit(null);
      setFormTitle('');
      setFormSubject('Physical Education & Sports');
      setFormDay('Friday');
      setFormPeriod(8);
      setFormGrades([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      setFormRoom('Main Sports Pitch');
      setFormTeacher('Mr. Peter Ochieng');
      setFormNotes('Co-curricular sports, drills, athletics training, and clubs.');
    }
    setShowModal(true);
  };

  // Toggle active condition
  const handleToggleActive = (id: string) => {
    const target = conditions.find(c => c.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    Storage.saveFixedLessonCondition(updated);
    setConditions(Storage.getFixedLessonConditions());
    if (onConditionsChanged) onConditionsChanged();
  };

  // Delete condition
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this fixed lesson condition?')) {
      Storage.deleteFixedLessonCondition(id);
      setConditions(Storage.getFixedLessonConditions());
      setNotificationMsg('Fixed lesson condition deleted.');
      setTimeout(() => setNotificationMsg(null), 3000);
      if (onConditionsChanged) onConditionsChanged();
    }
  };

  // Reset to initial standard conditions
  const handleReset = () => {
    if (window.confirm('Reset all fixed lesson conditions to institutional defaults (Assembly, Games, STEM Lab, Remedial)?')) {
      const initial = Storage.resetFixedLessonConditions();
      setConditions(initial);
      setNotificationMsg('Fixed lesson conditions reset to institutional defaults.');
      setTimeout(() => setNotificationMsg(null), 3000);
      if (onConditionsChanged) onConditionsChanged();
    }
  };

  // Save condition
  const handleSaveCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload: FixedLessonCondition = {
      id: conditionToEdit ? conditionToEdit.id : `fix-${Date.now()}`,
      title: formTitle.trim(),
      subject: formSubject,
      dayOfWeek: formDay,
      period: formPeriod,
      grades: formGrades,
      streams: 'all',
      roomName: formRoom.trim() || undefined,
      teacherName: formTeacher.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isActive: true
    };

    Storage.saveFixedLessonCondition(payload);
    setConditions(Storage.getFixedLessonConditions());
    setShowModal(false);
    setNotificationMsg(`Fixed lesson condition "${payload.title}" saved successfully!`);
    setTimeout(() => setNotificationMsg(null), 3500);

    if (onConditionsChanged) onConditionsChanged();
  };

  // Toggle grade in form
  const handleToggleGradeInForm = (g: GradeLevel) => {
    if (formGrades.includes(g)) {
      if (formGrades.length > 1) {
        setFormGrades(formGrades.filter(x => x !== g));
      }
    } else {
      setFormGrades([...formGrades, g].sort());
    }
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
          {onTriggerAutoGeneration && (
            <button
              onClick={onTriggerAutoGeneration}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Apply to Schedule</span>
            </button>
          )}
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Pre-Publication Scheduling Constraints</span>
            <span>·</span>
            <span>Institutional Anchors</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Fixed Lessons & Specific Day Conditions
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            Configure mandatory school routines that must occur on designated days and periods before general subjects are populated. The auto-generator locks these anchor periods in place first and builds all other lessons around them without displacement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to default institutional anchors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fixed Condition</span>
          </button>
        </div>
      </div>

      {/* Condition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {conditions.map(cond => {
          return (
            <div 
              key={cond.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                cond.isActive 
                  ? 'bg-white border-slate-200 shadow-xs' 
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl text-white ${cond.isActive ? 'bg-slate-900' : 'bg-slate-400'}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {cond.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-emerald-800">
                        <span>{cond.subject}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-600 font-normal">
                          {cond.dayOfWeek} · Period {cond.period}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => handleToggleActive(cond.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      cond.isActive 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cond.isActive ? 'Active Anchor' : 'Disabled'}
                  </button>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Facility / Location:</span>
                    <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">
                      {cond.roomName || 'Campus Main Classroom'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Supervisor:</span>
                    <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">
                      {cond.teacherName || 'Institutional Faculty Lead'}
                    </span>
                  </div>
                </div>

                {/* Targeted Grades */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Targeted Grades ({cond.grades.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cond.grades.map(g => (
                      <span key={g} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                        Grade {g}
                      </span>
                    ))}
                  </div>
                </div>

                {cond.notes && (
                  <p className="text-[11px] text-slate-500 mt-3 italic line-clamp-2">
                    "{cond.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleDelete(cond.id)}
                  className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <button
                  onClick={() => handleOpenModal(cond)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================
          ADD / EDIT FIXED CONDITION MODAL
          ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Scheduling Condition Configuration
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {conditionToEdit ? 'Edit Fixed Lesson Condition' : 'Define Fixed Lesson Condition'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCondition} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Condition Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. School-Wide Morning Assembly"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Period Number</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold font-mono"
                  >
                    <option value={10}>Period 10 (Early Morning Remedial 07:00 - Gr 6–9)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                    <option value={11}>Period 11 (Late Evening Remedial 15:45 - Gr 6–9)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Learning Area / Subject</label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Pastoral Care & Assembly, Physical Education & Sports"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility / Room</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="e.g. Main Sports Pitch"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supervising Instructor</label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="e.g. Mr. Peter Ochieng"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Targeted Grades */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Applicable Grade Levels ({formGrades.length} selected):
                </label>
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => {
                    const isSel = formGrades.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleToggleGradeInForm(g)}
                        className={`px-2 py-1 text-xs font-bold rounded cursor-pointer ${
                          isSel ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Gr {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructional Directives / Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Explain special protocols or student preparations..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Save Condition
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
