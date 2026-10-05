import React, { useState } from 'react';
import { 
  Printer, 
  FileText, 
  Award, 
  Trophy, 
  Users, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';
import { 
  CoCurricularActivity, 
  LearnerCoCurricularProfile, 
  CoCurricularCompetition, 
  CoCurricularAttendanceRecord 
} from '../../types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface ReportsTabProps {
  activities: CoCurricularActivity[];
  profiles: LearnerCoCurricularProfile[];
  competitions: CoCurricularCompetition[];
  attendance: CoCurricularAttendanceRecord[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  activities,
  profiles,
  competitions,
  attendance
}) => {
  type ReportType = 'participation' | 'sports_register' | 'competitions' | 'annual_summary';
  const [selectedReport, setSelectedReport] = useState<ReportType>('annual_summary');

  return (
    <div className="space-y-6">
      
      {/* Header and Report Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Institutional Co-Curricular Governance Reports
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Formal registers, CBC participation certificates, and Ministry audit documentation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value as any)}
            className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800"
          >
            <option value="annual_summary">Annual Co-Curricular & Talent Report</option>
            <option value="participation">Learner Participation & Roster Register</option>
            <option value="sports_register">Sports Academy Squad Registers</option>
            <option value="competitions">Competitions, Trophies & Awards Digest</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Document (PDF)</span>
          </button>
        </div>
      </div>

      {/* Official Report Paper View */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-8 shadow-md max-w-4xl mx-auto space-y-6">
        
        {/* Document Header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
          <EduSmartGadsaLogo variant="full" size="md" />
          <div className="text-right">
            <div className="text-xs font-black text-emerald-900 uppercase tracking-wider">
              EduSmart Model Academy · Co-Curricular Directorate
            </div>
            <div className="text-[11px] font-semibold text-slate-700">
              Department of Sports, Talent Development, Clubs & Societies
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Report Generated: 2026-10-04 · Nairobi, Kenya
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
            {selectedReport === 'annual_summary' && 'Official Annual Co-Curricular & Talent Development Report (Term 3, 2026)'}
            {selectedReport === 'participation' && 'Comprehensive Learner Activity Participation & Leadership Register'}
            {selectedReport === 'sports_register' && 'Sports Academies, Age Categories & Squad Personnel Register'}
            {selectedReport === 'competitions' && 'Inter-School Competitions, National Championships & Honors Digest'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compiled for Institutional Board of Management, MOE Quality Assurance & Parent Body
          </p>
        </div>

        {/* Metric Badges Summary */}
        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Total Activities</span>
            <div className="text-xl font-black text-slate-900 mt-1">{activities.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Enrolled Learners</span>
            <div className="text-xl font-black text-emerald-700 mt-1">{profiles.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Competitions Held</span>
            <div className="text-xl font-black text-blue-700 mt-1">{competitions.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Trophies & Medals</span>
            <div className="text-xl font-black text-amber-600 mt-1">
              {competitions.reduce((acc, c) => acc + (c.awards?.length || 0), 0)}
            </div>
          </div>
        </div>

        {/* Dynamic Table based on selectedReport */}
        {selectedReport === 'annual_summary' && (
          <div className="space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              Activities & Academy Summary
            </h4>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Activity Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Director / Coach</th>
                  <th className="p-2 text-center">Enrollment</th>
                  <th className="p-2">Venue</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-bold text-slate-900">{a.icon} {a.name}</td>
                    <td className="p-2 text-slate-600">{a.category}</td>
                    <td className="p-2 text-slate-800">{a.patronName}</td>
                    <td className="p-2 text-center font-mono">{a.currentMembersCount}/{a.maxParticipants}</td>
                    <td className="p-2 text-slate-600">{a.venue}</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'competitions' && (
          <div className="space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
              Championship Honors & Tournament Record
            </h4>
            <div className="space-y-3">
              {competitions.map((comp) => (
                <div key={comp.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-sm text-slate-900">{comp.title}</div>
                      <div className="text-slate-600 font-medium">{comp.activityName} · {comp.venue}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-950 font-black rounded-lg">
                      {comp.ourPosition}
                    </span>
                  </div>
                  <div className="mt-2 text-slate-700">
                    <strong>Awards:</strong> {comp.awards.join(', ') || 'N/A'}
                  </div>
                  {comp.report && (
                    <div className="mt-1 text-slate-600 italic">
                      {comp.report}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Signatures */}
        <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="font-bold text-slate-900">Coach Benjamin Omwenga</div>
            <div className="text-[10px] text-slate-500">Director of Sports & Co-Curricular Activities</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">TSC No: TSC/SP-38910</div>
          </div>
          <div>
            <div className="font-bold text-slate-900">Dr. Arthur Mwangi, PhD</div>
            <div className="text-[10px] text-slate-500">Head Teacher & Chief Executive</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">Republic of Kenya School Stamp</div>
          </div>
        </div>

      </div>

    </div>
  );
};
