import React, { useState, useMemo } from 'react';
import { 
  QuizAttempt, 
  GradeLevel, 
  SubjectName, 
  getSubjectsForGrade 
} from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  Target
} from 'lucide-react';

interface PerformanceChartsProps {
  quizAttempts: QuizAttempt[];
  studentGrade: GradeLevel;
  studentName: string;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  quizAttempts,
  studentGrade,
  studentName
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [chartViewMode, setChartViewMode] = useState<'subject_bar' | 'timeline' | 'distribution'>('subject_bar');

  const availableSubjects = getSubjectsForGrade(studentGrade);

  // Filter attempts based on subject selector
  const filteredAttempts = useMemo(() => {
    if (selectedSubjectFilter === 'all') return quizAttempts;
    return quizAttempts.filter(a => a.subject === selectedSubjectFilter);
  }, [quizAttempts, selectedSubjectFilter]);

  // Chronologically sorted attempts for progress timeline
  const timelineData = useMemo(() => {
    return [...filteredAttempts]
      .reverse() // from oldest to newest
      .map((att, index) => {
        // Extract simple date label
        const dateParts = att.completedAt.split(' ');
        const label = dateParts[0] ? dateParts[0].replace('2026-', '') : `Quiz ${index + 1}`;

        return {
          index: index + 1,
          dateLabel: `${label} (${att.subject.slice(0, 4)})`,
          fullDate: att.completedAt,
          quizTitle: att.quizTitle,
          subject: att.subject,
          percentage: att.percentage,
          score: att.score,
          total: att.totalQuestions,
          passed: att.passed
        };
      });
  }, [filteredAttempts]);

  // Aggregate statistics per subject
  const subjectPerformanceData = useMemo(() => {
    const subjectMap: Record<string, { totalScorePct: number; count: number; passedCount: number; maxPct: number }> = {};

    quizAttempts.forEach(att => {
      if (!subjectMap[att.subject]) {
        subjectMap[att.subject] = { totalScorePct: 0, count: 0, passedCount: 0, maxPct: 0 };
      }
      subjectMap[att.subject].totalScorePct += att.percentage;
      subjectMap[att.subject].count += 1;
      if (att.passed) subjectMap[att.subject].passedCount += 1;
      if (att.percentage > subjectMap[att.subject].maxPct) {
        subjectMap[att.subject].maxPct = att.percentage;
      }
    });

    return availableSubjects.map(sub => {
      const entry = subjectMap[sub];
      const avg = entry && entry.count > 0 ? Math.round(entry.totalScorePct / entry.count) : 0;
      const count = entry ? entry.count : 0;
      const passRate = entry && entry.count > 0 ? Math.round((entry.passedCount / entry.count) * 100) : 0;

      return {
        subject: sub,
        shortName: sub.length > 12 ? sub.slice(0, 11) + '..' : sub,
        averagePercentage: avg,
        quizzesTaken: count,
        passRate,
        hasData: count > 0
      };
    });
  }, [quizAttempts, availableSubjects]);

  // Overall KPI statistics
  const overallStats = useMemo(() => {
    if (quizAttempts.length === 0) {
      return {
        averagePct: 0,
        totalAttempted: 0,
        totalPassed: 0,
        passRate: 0,
        topSubject: 'None',
        topSubjectAvg: 0
      };
    }

    const totalPct = quizAttempts.reduce((acc, curr) => acc + curr.percentage, 0);
    const totalPassed = quizAttempts.filter(a => a.passed).length;
    const avg = Math.round(totalPct / quizAttempts.length);
    const rate = Math.round((totalPassed / quizAttempts.length) * 100);

    // Find best performing subject with data
    const activeSubjects = subjectPerformanceData.filter(s => s.hasData);
    let best = { subject: 'All', averagePercentage: 0 };
    if (activeSubjects.length > 0) {
      best = [...activeSubjects].sort((a, b) => b.averagePercentage - a.averagePercentage)[0];
    }

    return {
      averagePct: avg,
      totalAttempted: quizAttempts.length,
      totalPassed,
      passRate: rate,
      topSubject: best.subject,
      topSubjectAvg: best.averagePercentage
    };
  }, [quizAttempts, subjectPerformanceData]);

  // Distribution Data (Mastery Levels)
  const distributionData = useMemo(() => {
    let exceeding = 0; // >= 80%
    let meeting = 0;   // 70 - 79%
    let approaching = 0; // 50 - 69%
    let below = 0;     // < 50%

    filteredAttempts.forEach(att => {
      if (att.percentage >= 80) exceeding++;
      else if (att.percentage >= 70) meeting++;
      else if (att.percentage >= 50) approaching++;
      else below++;
    });

    return [
      { name: 'Exceeding Expectations (80-100%)', count: exceeding, color: '#059669' },
      { name: 'Meeting Expectations (70-79%)', count: meeting, color: '#0284C7' },
      { name: 'Approaching (50-69%)', count: approaching, color: '#D97706' },
      { name: 'Needs Revision (<50%)', count: below, color: '#E11D48' }
    ].filter(item => item.count > 0);
  }, [filteredAttempts]);

  // Custom Chart Tooltips
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <div className="font-bold text-slate-100">{data.quizTitle}</div>
          <div className="text-emerald-400 font-semibold">{data.subject}</div>
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
            <span>Score: <strong>{data.score}/{data.total}</strong></span>
            <span>·</span>
            <span>Accuracy: <strong className="text-emerald-300">{data.percentage}%</strong></span>
          </div>
          <div className="text-[10px] text-slate-400 pt-0.5">{data.fullDate}</div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
          <div className="font-bold text-slate-100">{data.subject}</div>
          <div className="text-emerald-400 font-mono font-bold text-sm">
            Average: {data.averagePercentage}%
          </div>
          <div className="text-slate-300 text-[11px]">
            Quizzes Attempted: <strong>{data.quizzesTaken}</strong>
          </div>
          <div className="text-slate-300 text-[11px]">
            Pass Rate: <strong>{data.passRate}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Progress Analytics</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Grade {studentGrade} CBC Curriculum</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Academic Performance & Quiz Analytics
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Visual subject mastery, timeline progression, and competency breakdown for {studentName}.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setChartViewMode('subject_bar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              chartViewMode === 'subject_bar'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subject Comparison
          </button>
          <button
            onClick={() => setChartViewMode('timeline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              chartViewMode === 'timeline'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Progress Timeline
          </button>
          <button
            onClick={() => setChartViewMode('distribution')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              chartViewMode === 'distribution'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mastery Distribution
          </button>
        </div>
      </div>

      {/* KPI Highlight Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500">Average Quiz Accuracy</div>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {overallStats.averagePct}%
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">Across all learning areas</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500">Total Quizzes Attempted</div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {overallStats.totalAttempted}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">Topical assessments taken</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500">Pass Rate (≥70%)</div>
          <div className="text-2xl font-black font-mono text-blue-700 mt-1">
            {overallStats.passRate}%
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">{overallStats.totalPassed} of {overallStats.totalAttempted} passed</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500">Strongest Subject</div>
          <div className="text-base font-extrabold text-slate-900 mt-1 truncate" title={overallStats.topSubject}>
            {overallStats.topSubject}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
            {overallStats.topSubjectAvg}% Mean Accuracy
          </div>
        </div>
      </div>

      {/* Subject Filter Dropdown for Timeline & Detailed Inspection */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Filter Chart Learning Area:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Subjects Combined ({quizAttempts.length} quizzes)</option>
            {availableSubjects.map(sub => {
              const count = quizAttempts.filter(a => a.subject === sub).length;
              return (
                <option key={sub} value={sub}>
                  {sub} ({count} attempt{count !== 1 ? 's' : ''})
                </option>
              );
            })}
          </select>
        </div>

        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>CBC Benchmark Standard: <strong>70% Pass Mark</strong></span>
        </div>
      </div>

      {/* ========================================================
          CHART VIEW 1: SUBJECT PROFICIENCY COMPARISON (BAR CHART)
          ======================================================== */}
      {chartViewMode === 'subject_bar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Mean Quiz Score by Learning Area (%)
            </h3>
            <span className="text-xs font-mono text-slate-400">Target Pass: 70%</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectPerformanceData}
                margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="shortName" 
                  tick={{ fontSize: 11, fill: '#475569' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  domain={[0, 100]} 
                  ticks={[0, 20, 40, 60, 70, 80, 100]} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  unit="%" 
                />
                <Tooltip content={<CustomBarTooltip />} />
                <ReferenceLine 
                  y={70} 
                  stroke="#E11D48" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Pass Line (70%)', position: 'insideTopRight', fill: '#E11D48', fontSize: 10, fontWeight: 700 }} 
                />
                <Bar 
                  dataKey="averagePercentage" 
                  radius={[6, 6, 0, 0]}
                >
                  {subjectPerformanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        !entry.hasData 
                          ? '#CBD5E1' 
                          : entry.averagePercentage >= 80 
                          ? '#059669' 
                          : entry.averagePercentage >= 70 
                          ? '#0284C7' 
                          : '#E11D48'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span>Exceeding (≥80%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
              <span>Meeting Standard (70-79%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
              <span>Needs Revision (&lt;70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 inline-block" />
              <span>No Quizzes Taken Yet</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CHART VIEW 2: PROGRESS TIMELINE (AREA / LINE CHART)
          ======================================================== */}
      {chartViewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Quiz Accuracy Progression Over Time (%)
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {timelineData.length} Attempts Plotted
            </span>
          </div>

          {timelineData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No quiz attempts found for the selected filter. Attempt a quiz under Resources to see your timeline!
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 11, fill: '#475569' }} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    ticks={[0, 25, 50, 70, 75, 100]} 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    unit="%" 
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <ReferenceLine 
                    y={70} 
                    stroke="#E11D48" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Pass Line (70%)', position: 'insideTopLeft', fill: '#E11D48', fontSize: 10, fontWeight: 700 }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#059669" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorPercentage)" 
                    dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#FFFFFF' }}
                    activeDot={{ r: 6, fill: '#047857' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          CHART VIEW 3: MASTERY DISTRIBUTION (PIE CHART)
          ======================================================== */}
      {chartViewMode === 'distribution' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Competency Mastery Tier Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {filteredAttempts.length} Completed Quizzes
            </span>
          </div>

          {distributionData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No quiz data available for competency distribution.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${val} Quizzes`, 'Count']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '0.75rem', fontSize: '11px', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  CBC Mastery Categories
                </h4>
                {distributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.count} ({filteredAttempts.length > 0 ? Math.round((item.count / filteredAttempts.length) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Insight Box */}
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Continuous Formative Tracking:</strong> Every topical quiz attempted automatically recalculates your performance charts in real time.
          </span>
        </div>
        <div className="font-mono text-emerald-800 font-bold shrink-0">
          Sync: Automated Recharts Engine
        </div>
      </div>
    </div>
  );
};
