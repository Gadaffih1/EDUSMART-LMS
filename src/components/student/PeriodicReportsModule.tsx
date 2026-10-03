import React, { useState } from 'react';
import { User, PeriodicReport } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  FileText, 
  Calendar, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  Printer, 
  Download, 
  Layers, 
  Sparkles,
  ChevronRight,
  School
} from 'lucide-react';

interface PeriodicReportsModuleProps {
  currentUser: User;
}

export const PeriodicReportsModule: React.FC<PeriodicReportsModuleProps> = ({ currentUser }) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'Weekly' | 'Monthly' | 'Termly' | 'Annually'>('all');
  const allReports = Storage.getPeriodicReports(currentUser.id, periodFilter);
  const [selectedReportId, setSelectedReportId] = useState<string>(allReports[0]?.id || '');

  const activeReport = allReports.find(r => r.id === selectedReportId) || allReports[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Research-Based Periodic Progress Reports</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic & Competency Progression Dossiers
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Summarized periodic reports designed for easy interpretation by learners and parents. Track weekly milestones, monthly digests, termly summative evaluations, and annual progression dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report Dossier</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {(['all', 'Weekly', 'Monthly', 'Termly', 'Annually'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setPeriodFilter(period)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              periodFilter === period
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {period === 'all' ? `All Periodic Dossiers (${Storage.getPeriodicReports(currentUser.id).length})` : `${period} Reports`}
          </button>
        ))}
      </div>

      {/* Main Report View Layout */}
      {allReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Reports in this Category</h3>
          <p className="text-xs text-slate-400 mt-1">Select another periodic filter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Report Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Reporting Period
            </h3>
            {allReports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-xs space-y-1.5 ${
                  activeReport?.id === r.id
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    r.periodType === 'Weekly' ? 'bg-blue-100 text-blue-800' :
                    r.periodType === 'Monthly' ? 'bg-purple-100 text-purple-800' :
                    r.periodType === 'Termly' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {r.periodType}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{r.generatedAt}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm line-clamp-1">{r.periodLabel}</div>
                <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                  <span>Mean: <strong className="text-emerald-700 font-mono">{r.academicMean}%</strong></span>
                  <span>Attendance: <strong className="text-slate-900 font-mono">{r.attendanceRate}%</strong></span>
                </div>
              </button>
            ))}
          </div>

          {/* Right 2 Columns: Full Report Dossier */}
          {activeReport && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              {/* Dossier Header */}
              <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                    <EduSmartGadsaLogo variant="horizontal" size="sm" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{activeReport.periodLabel}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Learner: {activeReport.studentName} · Grade {activeReport.grade} · Dossier ID #{activeReport.id}
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase bg-slate-100 text-slate-800 self-start sm:self-auto">
                  {activeReport.periodType} Format
                </span>
              </div>

              {/* High-Level Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Academic Mean</div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-0.5">{activeReport.academicMean}%</div>
                  <div className="text-[10px] text-emerald-800 font-medium">Exceeding Expectations</div>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-800">Attendance Rate</div>
                  <div className="text-2xl font-extrabold font-mono text-blue-700 mt-0.5">{activeReport.attendanceRate}%</div>
                  <div className="text-[10px] text-blue-800 font-medium">On-Time Presence</div>
                </div>

                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-[10px] uppercase font-bold text-purple-800">Quizzes Completed</div>
                  <div className="text-2xl font-extrabold font-mono text-purple-700 mt-0.5">{activeReport.quizzesCompleted}</div>
                  <div className="text-[10px] text-purple-800 font-medium">Auto-Marked</div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Assignments Done</div>
                  <div className="text-2xl font-extrabold font-mono text-amber-700 mt-0.5">{activeReport.assignmentsTurnedIn}</div>
                  <div className="text-[10px] text-amber-800 font-medium">100% Timely</div>
                </div>
              </div>

              {/* CBC Core Competency Rubrics Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Research-Based CBC Core Competency Assessments</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">CBC Core Competency</th>
                        <th className="py-2.5 px-3">Performance Level</th>
                        <th className="py-2.5 px-3">Observational Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeReport.coreCompetencies.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{c.name}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              c.level === 'Exceeding' ? 'bg-emerald-100 text-emerald-800' :
                              c.level === 'Meeting' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.level}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{c.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strengths & Support Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] block">
                    Key Academic Strengths Observed
                  </span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                    {activeReport.keyStrengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                  <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] block">
                    Research-Based Support Recommendations
                  </span>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                    {activeReport.supportRecommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Faculty Remarks */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Senior Teacher & Class Lead Comprehensive Remarks
                </span>
                <p className="text-slate-800 italic leading-relaxed text-[11px]">
                  "{activeReport.teacherRemarks}"
                </p>
                <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Sign-off: Mr. David Kiprono (Class Teacher) & Ms. Beatrice Wanjiku (Dean of Studies)</span>
                  <span>Officially Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
