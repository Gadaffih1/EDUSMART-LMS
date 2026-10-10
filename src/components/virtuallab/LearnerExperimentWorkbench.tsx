import React, { useState } from 'react';
import { 
  VirtualExperiment, 
  CBC_VIRTUAL_EXPERIMENTS, 
  JSS_LAB_REQUIREMENTS 
} from './labInventoryData';
import { InteractiveSimulationEngine } from './InteractiveSimulationEngine';
import { 
  BookOpen, 
  Boxes, 
  ShieldCheck, 
  ListOrdered, 
  FlaskConical, 
  Eye, 
  Sliders, 
  BarChart3, 
  FileCheck, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Save,
  Download,
  Clock
} from 'lucide-react';
import { User } from '../../types';

interface LearnerExperimentWorkbenchProps {
  currentUser?: User;
  initialExperiment?: VirtualExperiment;
  onCompleteSubmission?: (report: any) => void;
}

export const LearnerExperimentWorkbench: React.FC<LearnerExperimentWorkbenchProps> = ({
  currentUser,
  initialExperiment,
  onCompleteSubmission
}) => {
  const [selectedExperiment, setSelectedExperiment] = useState<VirtualExperiment>(
    initialExperiment || CBC_VIRTUAL_EXPERIMENTS[0]
  );
  const [activeStage, setActiveStage] = useState<number>(1); // 1 to 10 stages

  // Learner Experiment Submission State
  const [learnerHypothesis, setLearnerHypothesis] = useState('');
  const [recordedObservations, setRecordedObservations] = useState<any[]>([]);
  const [learnerAnalysis, setLearnerAnalysis] = useState('');
  const [learnerConclusion, setLearnerConclusion] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const STAGES = [
    { number: 1, title: 'Learn', subtitle: 'What are we investigating?', icon: BookOpen },
    { number: 2, title: 'Equipment', subtitle: 'JSS Apparatus & Chemicals', icon: Boxes },
    { number: 3, title: 'Safety', subtitle: 'Precautions & Handling', icon: ShieldCheck },
    { number: 4, title: 'Procedure', subtitle: 'Step-by-step methods', icon: ListOrdered },
    { number: 5, title: 'Experiment', subtitle: 'Interactive simulation', icon: FlaskConical },
    { number: 6, title: 'Observe', subtitle: 'Record what happens', icon: Eye },
    { number: 7, title: 'Measure', subtitle: 'Digital measurements', icon: Sliders },
    { number: 8, title: 'Analyse', subtitle: 'Data & graphs', icon: BarChart3 },
    { number: 9, title: 'Conclusion', subtitle: 'Write scientific deduction', icon: FileCheck },
    { number: 10, title: 'Submit', subtitle: 'Archive to Lab Notebook', icon: Send }
  ];

  const handleObservationFromEngine = (data: any) => {
    setRecordedObservations(prev => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), data }
    ]);
  };

  const handleSubmitReport = () => {
    const reportData = {
      id: 'rep-' + Date.now(),
      studentName: currentUser?.name || 'Amina Mwangi (Grade 7 Athi)',
      admissionNumber: currentUser?.admissionNumber || 'ADM-2026-042',
      grade: currentUser?.grade || 7,
      stream: currentUser?.stream || 'Athi',
      experimentId: selectedExperiment.id,
      experimentTitle: selectedExperiment.title,
      date: new Date().toISOString(),
      aim: selectedExperiment.aim,
      hypothesis: learnerHypothesis || selectedExperiment.hypothesis,
      observations: recordedObservations,
      analysis: learnerAnalysis || 'Observed direct correlation between measured variables.',
      conclusion: learnerConclusion || 'The experimental data supports the hypothesis.',
      score: 18,
      status: 'submitted'
    };

    try {
      const existing = JSON.parse(localStorage.getItem('edusmart_virtual_lab_reports') || '[]');
      existing.unshift(reportData);
      localStorage.setItem('edusmart_virtual_lab_reports', JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }

    setHasSubmitted(true);
    onCompleteSubmission?.(reportData);
  };

  // Associated JSS Equipment for this experiment
  const requiredApparatus = JSS_LAB_REQUIREMENTS.filter(item => 
    selectedExperiment.equipmentIds.includes(item.itemNumber)
  );

  return (
    <div className="space-y-6">
      {/* Experiment Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            CBC 10-Stage Inquiry Framework
          </span>
          <h2 className="text-lg font-black text-slate-900 mt-1">
            {selectedExperiment.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
            <span>Subject: <strong className="text-slate-800">{selectedExperiment.subject}</strong></span>
            <span>·</span>
            <span>Strand: <strong className="text-slate-800">{selectedExperiment.strand}</strong></span>
            <span>·</span>
            <span>Grade: <strong className="text-slate-800">{selectedExperiment.gradeLevel}</strong></span>
          </div>
        </div>

        {/* Experiment switcher dropdown */}
        <select
          value={selectedExperiment.id}
          onChange={(e) => {
            const found = CBC_VIRTUAL_EXPERIMENTS.find(x => x.id === e.target.value);
            if (found) {
              setSelectedExperiment(found);
              setActiveStage(1);
              setHasSubmitted(false);
            }
          }}
          className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
        >
          {CBC_VIRTUAL_EXPERIMENTS.map(exp => (
            <option key={exp.id} value={exp.id}>
              {exp.title} ({exp.gradeLevel})
            </option>
          ))}
        </select>
      </div>

      {/* 10-Stage Stepper Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[760px] gap-1">
          {STAGES.map(stage => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.number;
            const isCompleted = activeStage > stage.number;

            return (
              <button
                key={stage.number}
                onClick={() => setActiveStage(stage.number)}
                className={`flex-1 p-2 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px]">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{stage.number}. {stage.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STAGE CONTAINER BODY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs min-h-[400px]">
        
        {/* STAGE 1: LEARN (Aim & Investigation Scope) */}
        {activeStage === 1 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <BookOpen className="w-4 h-4" />
              <span>Stage 1 of 10: Scientific Inquiry & Investigation Aim</span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {selectedExperiment.title}
            </h3>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed">
              <div>
                <strong className="text-slate-900 uppercase text-[11px] tracking-wider block mb-1">Investigation Aim:</strong>
                <p className="text-slate-700 text-sm font-medium">{selectedExperiment.aim}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <strong className="text-slate-900 uppercase text-[11px] tracking-wider block mb-1">Theoretical Background:</strong>
                <p className="text-slate-600">{selectedExperiment.description}</p>
              </div>
            </div>

            {/* Hypothesis Formulation Box */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                Formulate Your Hypothesis:
              </label>
              <textarea
                rows={3}
                value={learnerHypothesis}
                onChange={(e) => setLearnerHypothesis(e.target.value)}
                placeholder={`e.g. ${selectedExperiment.hypothesis}`}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-500"
              />
              <span className="text-[10px] text-slate-400">
                A scientific prediction explaining what you expect to observe before turning on instruments.
              </span>
            </div>
          </div>
        )}

        {/* STAGE 2: EQUIPMENT (JSS Apparatus Inspection) */}
        {activeStage === 2 && (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <Boxes className="w-4 h-4" />
              <span>Stage 2 of 10: Verified JSS Apparatus & Chemical Reagents</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Required Laboratory Items from Inventory ({requiredApparatus.length} Registered Items)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {requiredApparatus.map(app => (
                <div key={app.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Item #{app.itemNumber}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Sec {app.section}</span>
                    </div>
                    <div className="text-xs font-black text-slate-900 mt-1">{app.name}</div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{app.description}</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                    <span>Qty: {app.quantity} {app.unit}</span>
                    <span className="text-emerald-700 font-bold">Checked & Calibrated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 3: SAFETY (Precautions) */}
        {activeStage === 3 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-800 rounded-full text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
              <span>Stage 3 of 10: Laboratory Safety & Protective Measures</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Mandatory Safety Protocols for this Investigation
            </h3>

            <div className="space-y-3">
              {selectedExperiment.safetyPrecautions.map((safe, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{safe}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="font-bold">Required PPE for this session:</strong>
              <div>• Protective White Laboratory Coat (Item #72)</div>
              <div>• Chemical Nitrile Examination Hand Gloves (Item #73)</div>
            </div>
          </div>
        )}

        {/* STAGE 4: PROCEDURE (Step-by-Step Instructions) */}
        {activeStage === 4 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <ListOrdered className="w-4 h-4" />
              <span>Stage 4 of 10: Step-by-Step Methodical Procedure</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Experimental Sequence
            </h3>

            <div className="space-y-2.5">
              {selectedExperiment.procedureSteps.map((step, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 5: EXPERIMENT (Interactive Workbench) */}
        {activeStage === 5 && (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <FlaskConical className="w-4 h-4" />
              <span>Stage 5 of 10: Live Interactive Simulation Stage</span>
            </div>

            <InteractiveSimulationEngine
              experiment={selectedExperiment}
              mode="learner"
              onRecordObservation={handleObservationFromEngine}
            />
          </div>
        )}

        {/* STAGE 6: OBSERVE (Recorded Observations) */}
        {activeStage === 6 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <Eye className="w-4 h-4" />
              <span>Stage 6 of 10: Qualitative & Phenomenological Observations</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Captured Experimental Phenomena
            </h3>

            {recordedObservations.length > 0 ? (
              <div className="space-y-2">
                {recordedObservations.map((obs, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-400 text-[10px] mr-2">[{obs.timestamp}]</span>
                      <span className="font-bold text-slate-800">{JSON.stringify(obs.data)}</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-[10px]">Saved</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No observations logged yet. Go to Stage 5 (Experiment) and click "Record to Notebook" while running simulations.
              </div>
            )}
          </div>
        )}

        {/* STAGE 7: MEASURE (Numerical readings table) */}
        {activeStage === 7 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <Sliders className="w-4 h-4" />
              <span>Stage 7 of 10: Precision Laboratory Quantitative Data</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Laboratory Notebook Data Table
            </h3>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2">Reading #</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">Measured Variable & Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recordedObservations.map((obs, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-mono font-bold text-slate-700">#{idx + 1}</td>
                      <td className="py-2 font-mono text-slate-500">{obs.timestamp}</td>
                      <td className="py-2 font-mono text-emerald-900">{JSON.stringify(obs.data)}</td>
                    </tr>
                  ))}
                  {recordedObservations.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400">
                        Perform measurements on Stage 5 to populate this table.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAGE 8: ANALYSE (Data Analysis & Graphs) */}
        {activeStage === 8 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <BarChart3 className="w-4 h-4" />
              <span>Stage 8 of 10: Scientific Analysis & Trend Graphing</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Analyse Your Findings
            </h3>

            <textarea
              rows={4}
              value={learnerAnalysis}
              onChange={(e) => setLearnerAnalysis(e.target.value)}
              placeholder="Explain patterns observed across your variables, deviations from expectations, and physical/chemical explanations..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-500"
            />
          </div>
        )}

        {/* STAGE 9: CONCLUSION */}
        {activeStage === 9 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <FileCheck className="w-4 h-4" />
              <span>Stage 9 of 10: Formal Scientific Conclusion</span>
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Summarize Experimental Deductions
            </h3>

            <textarea
              rows={4}
              value={learnerConclusion}
              onChange={(e) => setLearnerConclusion(e.target.value)}
              placeholder="State whether your initial hypothesis was supported or rejected. Conclude clearly based on collected evidence..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-emerald-500"
            />
          </div>
        )}

        {/* STAGE 10: SUBMIT */}
        {activeStage === 10 && (
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black">
              <Send className="w-4 h-4" />
              <span>Stage 10 of 10: Submit Report & Archive to Lab Notebook</span>
            </div>

            {hasSubmitted ? (
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-300 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-xl font-black text-emerald-950">
                  Virtual Laboratory Report Submitted Successfully!
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Your practical record for "{selectedExperiment.title}" has been saved to your Digital Lab Notebook and forwarded to your science teacher.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Review your experimental observations, analysis, and conclusions before submitting your final report to the science department.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Learner Name:</span>
                    <span className="font-bold text-slate-900">{currentUser?.name || 'Amina Mwangi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admission Number:</span>
                    <span className="font-mono font-bold text-slate-900">{currentUser?.admissionNumber || 'ADM-2026-042'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experiment:</span>
                    <span className="font-bold text-emerald-900">{selectedExperiment.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Logged Data Points:</span>
                    <span className="font-bold text-slate-900">{recordedObservations.length} readings</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmitReport}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Virtual Laboratory Report</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Stepper Navigation Next / Prev Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveStage(Math.max(1, activeStage - 1))}
          disabled={activeStage <= 1}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Stage</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-400">
          Stage {activeStage} / 10
        </span>

        <button
          onClick={() => setActiveStage(Math.min(10, activeStage + 1))}
          disabled={activeStage >= 10}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span>Next Stage</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
