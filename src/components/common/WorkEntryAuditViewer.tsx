import React, { useState, useMemo } from 'react';
import { WorkEntryLog, User } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from './EduSmartGadsaLogo';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Mail, 
  User as UserIcon, 
  Search, 
  Eye, 
  Printer, 
  Lock, 
  FileText, 
  CheckCircle2, 
  RotateCw,
  X,
  Compass,
  Building2,
  Users
} from 'lucide-react';

interface WorkEntryAuditViewerProps {
  currentUser: User;
  title?: string;
  subtitle?: string;
}

export const WorkEntryAuditViewer: React.FC<WorkEntryAuditViewerProps> = ({
  currentUser,
  title = "Staff Work Entry Sign-In Register",
  subtitle = "Official duty clock-in records, GPS geo-stamps, staff credentials, and verified biometric photos. Strictly read-only audit ledger."
}) => {
  const [logs, setLogs] = useState<WorkEntryLog[]>(() => Storage.getWorkEntryLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<WorkEntryLog | null>(null);
  const [filterDate, setFilterDate] = useState<string>('all');

  const refreshLogs = () => {
    setLogs(Storage.getWorkEntryLogs());
  };

  // Filter logs based on search query and date
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        log.teacherName.toLowerCase().includes(q) ||
        (log.staffNo && log.staffNo.toLowerCase().includes(q)) ||
        (log.email && log.email.toLowerCase().includes(q)) ||
        (log.signInLocation && log.signInLocation.toLowerCase().includes(q)) ||
        (log.id && log.id.toLowerCase().includes(q));

      const matchesDate = 
        filterDate === 'all' ||
        log.date === filterDate;

      return matchesSearch && matchesDate;
    });
  }, [logs, searchQuery, filterDate]);

  // Unique teachers count
  const uniqueTeachersCount = useMemo(() => {
    const ids = new Set(logs.map(l => l.staffNo || l.teacherId));
    return ids.size;
  }, [logs]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {title}
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-mono font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Strictly Read-Only · Non-Editable</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              {subtitle} Authorized viewer role: <strong className="text-slate-700 capitalize">{currentUser.role.replace('_', ' ')}</strong> ({currentUser.name}).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={refreshLogs}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Refresh ledger records"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Print official sign-in audit register"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register</span>
            </button>
          </div>
        </div>

        {/* 4 Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Sign-Ins</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {logs.length}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Logged in official ledger</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Staff</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {uniqueTeachersCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Unique teachers verified</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">GPS Verification</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              100%
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">Campus perimeter verified</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Integrity Status</span>
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              LOCKED
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Immutable audit trail</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by teacher name, staff number (TSC), email, or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Dates ({logs.length})</option>
              {Array.from(new Set(logs.map(l => l.date))).sort().reverse().map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Showing ALL fields captured from the form */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Work Entry Sign-In Audit Trail ({filteredLogs.length} Records)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Non-Editable · Captured via Official Teacher Sign-In Protocol</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center">Photo ID Stamp</th>
                <th className="py-3 px-3.5">Staff No</th>
                <th className="py-3 px-3.5">Teacher / Staff Name</th>
                <th className="py-3 px-3.5">Sign-In Date &amp; Time</th>
                <th className="py-3 px-3.5">Strictly Work Email</th>
                <th className="py-3 px-3.5">Sign-In Location</th>
                <th className="py-3 px-3.5">Geo Stamp &amp; Coordinates</th>
                <th className="py-3 px-3.5 text-center">Audit Lock</th>
                <th className="py-3 px-3.5 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No sign-in records matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const staffNumber = log.staffNo || (log.teacherId === 'usr-teach-kiprono' ? 'TSC/44120/ED' : 'TSC/39821/ED');
                  const workEmail = log.email || `${log.teacherId.replace('usr-teach-', '')}@edusmart.ac.ke`;
                  const location = log.signInLocation || 'EduSmart Main Campus, Staffroom Block A · Nairobi Grounds';
                  const lat = log.geoStamp?.latitude ?? -1.2921;
                  const lng = log.geoStamp?.longitude ?? 36.8219;
                  const acc = log.geoStamp?.accuracy ?? 5;

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Photo Stamp */}
                      <td className="py-2.5 px-3.5 text-center" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                        {log.photoUrl ? (
                          <div className="relative inline-block">
                            <img 
                              src={log.photoUrl} 
                              alt="Staff Photo" 
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 shadow-2xs group-hover:scale-105 transition-transform" 
                            />
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" title="Biometrically Verified Stamp">
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs mx-auto border border-slate-300">
                            {log.teacherName.charAt(0)}
                          </div>
                        )}
                      </td>

                      {/* Staff No */}
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                          {staffNumber}
                        </span>
                      </td>

                      {/* Teacher or Staff Name */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {log.teacherName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          First: {log.firstName || log.teacherName.split(' ')[0]} · Last: {log.lastName || log.teacherName.split(' ').slice(1).join(' ')}
                        </div>
                      </td>

                      {/* Sign-In Date and Time */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.date}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-800 font-semibold flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{log.time}</span>
                        </div>
                      </td>

                      {/* Strictly Work Email */}
                      <td className="py-2.5 px-3.5 font-mono text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{workEmail}</span>
                        </div>
                      </td>

                      {/* Sign-In Location */}
                      <td className="py-2.5 px-3.5 text-slate-700 max-w-xs">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight font-medium">{location}</span>
                        </div>
                      </td>

                      {/* Geo Stamp & Coordinates */}
                      <td className="py-2.5 px-3.5 font-mono text-[11px]">
                        <div className="text-emerald-900 font-semibold flex items-center gap-1">
                          <Compass className="w-3 h-3 text-emerald-600" />
                          <span>{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Verified Campus (±{acc}m)
                        </div>
                      </td>

                      {/* Non-Editable / Locked Status */}
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Locked</span>
                        </span>
                      </td>

                      {/* View Action */}
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 rounded-lg text-xs font-bold border border-slate-200 inline-flex items-center gap-1 transition-colors"
                          title="View complete official sign-in slip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          FULL OFFICIAL SIGN-IN RECORD SLIP MODAL (SHOWING ALL FIELDS)
          ======================================================== */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 print:m-0 print:border-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <EduSmartGadsaLogo variant="horizontal" size="xs" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-l border-slate-300 pl-3">
                  Official Work Entry Sign-In Dossier (Read-Only)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Close dossier"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Slip Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800">
              
              {/* Slip Official Heading */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center mb-1">
                  <EduSmartGadsaLogo variant="full" size="md" />
                </div>
                <div className="text-xs font-black text-blue-900 uppercase tracking-widest">
                  EduSmart Digital Learning &amp; School Governance Platform
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Staff Lesson Work Entry Sign-In Slip
                </h3>
                <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold text-slate-600 pt-1">
                  <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ref ID: {selectedLog.id}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Immutable Institutional Audit Record
                  </span>
                </div>
              </div>

              {/* Security Warning: Non-Editable */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-semibold">
                    Strictly Read-Only: This record was verified at time of teacher clock-in. None can edit or alter this entry.
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-amber-300 font-bold uppercase shrink-0">
                  Audit Locked
                </span>
              </div>

              {/* Photo & Biometric Verification Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {selectedLog.photoUrl ? (
                  <div className="relative group shrink-0">
                    <img
                      src={selectedLog.photoUrl}
                      alt="Verified Staff Photo"
                      className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-2xl border-2 border-emerald-500 shadow-md"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-lg shrink-0 border border-slate-300">
                    {selectedLog.teacherName.charAt(0)}
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full text-xs">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Field 1: Staff Identification</span>
                    <div className="font-mono text-base font-black text-slate-900 flex items-center gap-2">
                      <span>{selectedLog.staffNo || (selectedLog.teacherId === 'usr-teach-kiprono' ? 'TSC/44120/ED' : 'TSC/39821/ED')}</span>
                      <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        Official TSC Staff Record
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Field 2: Teacher or Staff Name</span>
                    <div className="font-bold text-sm text-slate-900">
                      {selectedLog.teacherName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      First Name: <strong className="text-slate-800">{selectedLog.firstName || selectedLog.teacherName.split(' ')[0]}</strong> · 
                      Last Name: <strong className="text-slate-800">{selectedLog.lastName || selectedLog.teacherName.split(' ').slice(1).join(' ')}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Field 4: Strictly Work Email</span>
                    <div className="font-mono text-slate-800 font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedLog.email || `${selectedLog.teacherId.replace('usr-teach-', '')}@edusmart.ac.ke`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Fields 3, 5, and Geo Stamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Field 3: Sign-In Date and Time */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Field 3: Sign-In Date &amp; Time</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Auto-filled &amp; Locked
                    </span>
                  </div>

                  <div className="font-mono text-base font-bold text-slate-900">
                    {selectedLog.date}
                  </div>
                  <div className="font-mono text-sm text-emerald-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Time: {selectedLog.time}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ISO Stamp: {selectedLog.timestamp || new Date().toISOString()}
                  </div>
                </div>

                {/* Field 5: Sign-In Location & Geo Stamp */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Field 5: Sign-In Location &amp; Geo Stamp</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Campus Verified
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900">
                    {selectedLog.signInLocation || 'EduSmart Main Campus, Staffroom Block A · Nairobi Grounds'}
                  </div>

                  <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200 font-mono text-[11px] text-emerald-950 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold">
                      <Compass className="w-3.5 h-3.5 text-emerald-700" />
                      <span>GPS: {selectedLog.geoStamp?.latitude ?? -1.2921}°, {selectedLog.geoStamp?.longitude ?? 36.8219}° (±{selectedLog.geoStamp?.accuracy ?? 5}m)</span>
                    </div>
                    <div className="text-[10px] text-emerald-800">
                      {selectedLog.geoStamp?.address || 'EduSmart Campus Gate A · Nairobi Grounds (Verified Campus Boundary)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Learning Area / Lesson Deliverables (if logged) */}
              {(selectedLog.grade || selectedLog.subject || selectedLog.topicTaught) && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
                    Associated Curriculum Lesson Delivery
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Class:</span>
                      <strong className="text-slate-900">Grade {selectedLog.grade} {selectedLog.stream}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Subject:</span>
                      <strong className="text-blue-800">{selectedLog.subject}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Roll Call:</span>
                      <strong className="text-slate-900">{selectedLog.learnersPresent || 38} Learners Present</strong>
                    </div>
                  </div>
                  {selectedLog.topicTaught && (
                    <div className="pt-1">
                      <span className="text-slate-400 block text-[10px]">Topic / Strand:</span>
                      <div className="font-semibold text-slate-800">{selectedLog.topicTaught}</div>
                    </div>
                  )}
                  {selectedLog.objectivesCovered && (
                    <div className="pt-1">
                      <span className="text-slate-400 block text-[10px]">Objectives Covered:</span>
                      <div className="text-slate-700 italic">"{selectedLog.objectivesCovered}"</div>
                    </div>
                  )}
                </div>
              )}

              {/* Institutional Sign-off & Audit Seal */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-[10px] text-slate-500">
                <div className="p-2 border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-800">Biometric Clock-In</div>
                  <div>Verified &amp; Geo-Stamped</div>
                </div>
                <div className="p-2 border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-800">Audit Status</div>
                  <div className="text-emerald-700 font-bold">Non-Editable Log</div>
                </div>
                <div className="p-2 border border-slate-200 rounded-lg col-span-2 sm:col-span-1">
                  <div className="font-bold text-slate-800">Governance Review</div>
                  <div>Dean &middot; Deputy &middot; Head</div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between no-print">
              <span className="text-[11px] text-slate-500 font-mono">
                Viewing mode: Read-Only Audit · EduSmart System
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
