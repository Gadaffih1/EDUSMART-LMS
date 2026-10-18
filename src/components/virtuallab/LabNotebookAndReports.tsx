import React, { useState, useEffect } from 'react';
import { SyncEngine } from '../../utils/syncEngine';
import { 
  FileText, 
  Award, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import { User } from '../../types';

interface LabNotebookAndReportsProps {
  currentUser?: User;
}

export const LabNotebookAndReports: React.FC<LabNotebookAndReportsProps> = ({
  currentUser
}) => {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'notebook' | 'reports' | 'results'>('notebook');

  useEffect(() => {
    try {
      const reportsKey = `edusmart_tenant_${currentUser?.schoolId || 'tenant-riara'}_virtual_lab_reports`;
      const stored = JSON.parse(localStorage.getItem(reportsKey) || '[]');
      if (stored.length > 0) {
        setReports(stored);
        setSelectedReport(stored[0]);
      } else {
        // Seed standard initial learner reports
        const initialReports = [
          {
            id: 'rep-01',
            studentName: currentUser?.name || 'Amina Mwangi',
            admissionNumber: currentUser?.admissionNumber || 'ADM-2026-042',
            grade: 7,
            stream: 'Athi',
            experimentTitle: 'Acids, Bases & Indicators Spectrum Investigation',
            date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
            score: '18/20',
            status: 'Marked',
            teacherFeedback: 'Excellent classification of strong acids and alkalis using universal indicator.',
            observations: [
              { timestamp: '10:14 AM', data: { substance: 'Hydrochloric Acid', ph: 1.0, color: 'Deep Red' } },
              { timestamp: '10:19 AM', data: { substance: 'Sodium Hydroxide', ph: 13.8, color: 'Deep Violet' } }
            ],
            analysis: 'Universal indicator provided accurate pH differentiation compared to single-color litmus paper strips.',
            conclusion: 'Acids turned blue litmus red and universal indicator red/orange; bases gave blue and violet hues.'
          },
          {
            id: 'rep-02',
            studentName: currentUser?.name || 'Amina Mwangi',
            admissionNumber: currentUser?.admissionNumber || 'ADM-2026-042',
            grade: 7,
            stream: 'Athi',
            experimentTitle: 'Simple Electric Circuits & Ohm\'s Law Workbench',
            date: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
            score: '19/20',
            status: 'Marked',
            teacherFeedback: 'Accurate graphical slope representing internal resistance.',
            observations: [
              { timestamp: '11:05 AM', data: { voltage: '3.0V', current: '0.30A', resistance: '10Ω' } },
              { timestamp: '11:12 AM', data: { voltage: '6.0V', current: '0.60A', resistance: '10Ω' } }
            ],
            analysis: 'Current doubled proportionally as dry cells were increased from 2 to 4 in series.',
            conclusion: 'Verified Ohm\'s Law V = I × R with linear relationship.'
          }
        ];
        setReports(initialReports);
        setSelectedReport(initialReports[0]);
        SyncEngine.persistItem('edusmart_virtual_lab_reports', JSON.stringify(initialReports));
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Switcher Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Digital Laboratory Notebook & Official Reports</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Permanent academic record of practical investigations, observations, and teacher assessments.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab('notebook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'notebook' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Lab Notebook
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'reports' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Formal Lab Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveSubTab('results')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'results' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Department Lab Results
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: MY LAB NOTEBOOK OVERVIEW */}
      {activeSubTab === 'notebook' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400">My Experiments</span>
              <FlaskConical className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-emerald-50 text-emerald-950 font-bold rounded-xl flex items-center justify-between">
                <span>✓ Acids & Bases Spectrum</span>
                <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded">Completed</span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-950 font-bold rounded-xl flex items-center justify-between">
                <span>✓ Simple Electric Circuit</span>
                <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded">Completed</span>
              </div>
              <div className="p-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-between">
                <span>⏳ Virtual Microscope Peels</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded">In Progress</span>
              </div>
              <div className="p-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-between">
                <span>⏳ Separating Funnel (Oil & Water)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Assigned</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400">Reports Summary</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Submitted</span>
                <div className="text-2xl font-black text-slate-900 mt-1">4</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 uppercase font-bold">Marked</span>
                <div className="text-2xl font-black text-emerald-950 mt-1">2</div>
              </div>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
              <strong>Pending Grading:</strong> 2 laboratory reports awaiting teacher review for Grade 7 Athi.
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400">My Lab Practical Score</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white text-center">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Average Practical Mark</span>
              <div className="text-4xl font-black mt-1">92.5%</div>
              <span className="text-[11px] text-emerald-100 mt-1 inline-block">Exceeding Expectations (Level 4)</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FORMAL LAB REPORTS GENERATOR & VIEWER */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reports list */}
          <div className="lg:col-span-4 space-y-2.5">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
              Saved Laboratory Reports:
            </span>
            {reports.map(rep => (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedReport?.id === rep.id
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500 text-emerald-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{rep.date}</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Score: {rep.score}
                  </span>
                </div>
                <div className="text-xs font-black mt-1">{rep.experimentTitle}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{rep.studentName} · {rep.admissionNumber}</div>
              </button>
            ))}
          </div>

          {/* Selected Report Document Viewer */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            {selectedReport ? (
              <div className="space-y-6">
                {/* Formal Report Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                      EduSmart Kenya CBC Laboratory Report
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2">
                      {selectedReport.experimentTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Report</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Learner</span>
                    <div className="font-bold text-slate-900">{selectedReport.studentName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Admission No.</span>
                    <div className="font-mono font-bold text-slate-900">{selectedReport.admissionNumber}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Grade & Stream</span>
                    <div className="font-bold text-slate-900">Grade {selectedReport.grade} ({selectedReport.stream})</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Date</span>
                    <div className="font-mono text-slate-900">{selectedReport.date}</div>
                  </div>
                </div>

                {/* Report Sections */}
                <div className="space-y-4 text-xs leading-relaxed">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider mb-1">1. Aim & Hypothesis:</h4>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{selectedReport.conclusion || 'Investigation of chemical and physical principles.'}</p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider mb-1">2. Experimental Observations Table:</h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 font-mono text-[11px]">
                      {selectedReport.observations?.map((o: any, idx: number) => (
                        <div key={idx} className="py-1 border-b border-slate-200/60 last:border-none flex justify-between">
                          <span>Point #{idx + 1} ({o.timestamp})</span>
                          <span className="font-bold text-emerald-800">{JSON.stringify(o.data)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider mb-1">3. Analysis & Scientific Deduction:</h4>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">{selectedReport.analysis}</p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider mb-1">4. Teacher Feedback & Score:</h4>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <span className="text-emerald-900">{selectedReport.teacherFeedback}</span>
                      <span className="text-base font-black text-emerald-950 font-mono">{selectedReport.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a report from the left panel to inspect the full laboratory record.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DEPARTMENT LAB RESULTS (Class Analytics) */}
      {activeSubTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              Grade 7 Practical Laboratory Ledger (Simple Circuit & Chemical Reactions)
            </h3>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-bold">
              Class Size: 48 Learners
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Admission No.</th>
                  <th className="p-3">Experiment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Time Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Amina Mwangi', adm: 'ADM-2026-042', exp: 'Simple Electric Circuit', status: 'Submitted', score: '18/20', time: '22 mins' },
                  { name: 'Brian Kiprono', adm: 'ADM-2026-043', exp: 'Simple Electric Circuit', status: 'Submitted', score: '16/20', time: '19 mins' },
                  { name: 'David Mutua', adm: 'ADM-2026-044', exp: 'Simple Electric Circuit', status: 'In Progress', score: '—', time: '12 mins' },
                  { name: 'Faith Wanjiku', adm: 'ADM-2026-045', exp: 'Simple Electric Circuit', status: 'Submitted', score: '20/20', time: '24 mins' }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{row.name}</td>
                    <td className="p-3 font-mono text-slate-500">{row.adm}</td>
                    <td className="p-3 text-slate-700">{row.exp}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{row.score}</td>
                    <td className="p-3 text-slate-500">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
