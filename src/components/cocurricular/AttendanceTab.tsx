import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Search, 
  Printer, 
  Save, 
  Sparkles,
  Users
} from 'lucide-react';
import { 
  CoCurricularActivity, 
  LearnerCoCurricularProfile, 
  CoCurricularAttendanceRecord,
  User 
} from '../../types';

interface AttendanceTabProps {
  activities: CoCurricularActivity[];
  profiles: LearnerCoCurricularProfile[];
  attendanceRecords: CoCurricularAttendanceRecord[];
  onSaveAttendance: (records: CoCurricularAttendanceRecord[]) => void;
  currentUser: User;
  readOnly?: boolean;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  activities,
  profiles,
  attendanceRecords,
  onSaveAttendance,
  currentUser,
  readOnly = false
}) => {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-04');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Local status map for active session
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Excused' | 'Late'>>({});
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeActivity = activities.find(a => a.id === selectedActivityId) || activities[0];
  const enrolledMembers = profiles.filter(p => p.activityId === selectedActivityId);

  const filteredMembers = enrolledMembers.filter(m => 
    m.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusClick = (studentId: string, status: 'Present' | 'Absent' | 'Excused' | 'Late') => {
    if (readOnly) return;
    setSessionStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'Present' | 'Absent' | 'Excused' | 'Late'> = {};
    enrolledMembers.forEach(m => {
      updated[m.studentId] = 'Present';
    });
    setSessionStatuses(updated);
  };

  const handleSaveAttendance = () => {
    if (!activeActivity) return;

    const newRecords: CoCurricularAttendanceRecord[] = enrolledMembers.map(m => ({
      id: `att-${Date.now()}-${m.studentId}`,
      activityId: activeActivity.id,
      activityName: activeActivity.name,
      date: selectedDate,
      studentId: m.studentId,
      studentName: m.studentName,
      grade: m.grade,
      stream: m.stream,
      status: sessionStatuses[m.studentId] || 'Present',
      recordedBy: currentUser.name,
      notes: sessionNotes[m.studentId] || undefined
    }));

    onSaveAttendance(newRecords);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Past logs for this activity
  const pastActivityRecords = attendanceRecords.filter(r => r.activityId === selectedActivityId);

  return (
    <div className="space-y-6">
      
      {/* Session Header / Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <span>📋</span>
              <span>Session Roll Call & Register</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Co-Curricular Activity Attendance
            </h3>
            <p className="text-xs text-slate-500">
              Record live session presence. Attendance metrics directly update student co-curricular portfolios.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly ? (
              <>
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Mark All Present
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Submit Roll Call</span>
                </button>
              </>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs font-bold">
                Read-Only Attendance Audit
              </span>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Attendance successfully saved and synced to student portfolios!</span>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Activity</label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-medium"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.icon} {a.name} ({a.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Session Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Learners</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search member name..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Roll Call Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeActivity?.icon}</span>
            <div>
              <h4 className="font-bold text-sm text-slate-900">{activeActivity?.name}</h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {activeActivity?.venue} · Scheduled: {activeActivity?.meetingDays.join(', ')} ({activeActivity?.meetingTime})
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
            {enrolledMembers.length} Members Enrolled
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No registered members found for this activity matching your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const currentStatus = sessionStatuses[member.studentId] || 'Present';

              return (
                <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{member.studentName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {member.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {member.admissionNumber} · Grade {member.grade} {member.stream} · Career Attendance: {member.attendanceRate}%
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatusClick(member.studentId, 'Present')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusClick(member.studentId, 'Late')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'Late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Late
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusClick(member.studentId, 'Excused')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'Excused'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Excused
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusClick(member.studentId, 'Absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
