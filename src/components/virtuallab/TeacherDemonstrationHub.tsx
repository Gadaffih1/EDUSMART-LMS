import React, { useState } from 'react';
import { 
  VirtualExperiment, 
  CBC_VIRTUAL_EXPERIMENTS 
} from './labInventoryData';
import { InteractiveSimulationEngine } from './InteractiveSimulationEngine';
import { 
  Presentation, 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  CheckCircle2, 
  Volume2, 
  Sparkles, 
  MessageSquare, 
  Maximize2,
  ChevronRight,
  Lightbulb,
  Radio
} from 'lucide-react';

interface TeacherDemonstrationHubProps {
  onAssignExperiment?: (experiment: VirtualExperiment) => void;
}

export const TeacherDemonstrationHub: React.FC<TeacherDemonstrationHubProps> = ({
  onAssignExperiment
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(CBC_VIRTUAL_EXPERIMENTS[0].id);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showExpectedResult, setShowExpectedResult] = useState<boolean>(false);
  const [highlightEquipment, setHighlightEquipment] = useState<boolean>(true);
  const [activePollIndex, setActivePollIndex] = useState<number | null>(null);
  const [studentVotes, setStudentVotes] = useState<Record<string, number>>({ A: 14, B: 2, C: 22, D: 1 });
  const [hasRevealedAnswer, setHasRevealedAnswer] = useState<boolean>(false);

  const currentExp = CBC_VIRTUAL_EXPERIMENTS.find(e => e.id === selectedExpId) || CBC_VIRTUAL_EXPERIMENTS[0];

  // Classroom quick interactive questions by experiment
  const classroomQuestions: Record<string, { question: string; options: { key: string; text: string; correct?: boolean }[] }> = {
    'exp-01': {
      question: 'Teacher Question: If we add 3 drops of phenolphthalein (Item #4) to dilute Hydrochloric Acid (Item #16), what will happen?',
      options: [
        { key: 'A', text: 'Solution immediately turns bright magenta pink' },
        { key: 'B', text: 'Solution remains completely colourless', correct: true },
        { key: 'C', text: 'Solution turns deep royal blue' },
        { key: 'D', text: 'A dense white precipitate forms' }
      ]
    },
    'exp-02': {
      question: 'Teacher Question: In a series circuit with two identical torch bulbs (Item #50), what happens if one bulb is unscrewed?',
      options: [
        { key: 'A', text: 'The remaining bulb stays on and glows twice as bright' },
        { key: 'B', text: 'Both bulbs go off because the circuit loop is broken', correct: true },
        { key: 'C', text: 'The battery cell overheats and bursts' },
        { key: 'D', text: 'Current doubles across the circuit' }
      ]
    },
    'exp-03': {
      question: 'Teacher Question: Which distinctive organelle will be clearly visible in the onion peel cells (Item #31) but absent in cheek cells?',
      options: [
        { key: 'A', text: 'Cell membrane' },
        { key: 'B', text: 'Cellulose cell wall', correct: true },
        { key: 'C', text: 'Spherical cell nucleus' },
        { key: 'D', text: 'Mitochondria' }
      ]
    },
    'exp-04': {
      question: 'Teacher Question: Why does engine oil (Item #75) float above water in the separating funnel (Item #36)?',
      options: [
        { key: 'A', text: 'Engine oil is denser than water' },
        { key: 'B', text: 'Engine oil has lower density (~0.88 g/cm³) than water (~1.00 g/cm³)', correct: true },
        { key: 'C', text: 'Engine oil dissolves completely into the water' },
        { key: 'D', text: 'Surface tension repels the liquids' }
      ]
    },
    'exp-05': {
      question: 'Teacher Question: The volume of water displaced from the Eureka can (Item #25) is exactly equal to:',
      options: [
        { key: 'A', text: 'The mass of the irregular solid in grams' },
        { key: 'B', text: 'The volume of the submerged object', correct: true },
        { key: 'C', text: 'Half the volume of the measuring cylinder' },
        { key: 'D', text: 'The total capacity of the can' }
      ]
    }
  };

  const activeQuestion = classroomQuestions[currentExp.id] || classroomQuestions['exp-01'];

  return (
    <div className="space-y-6">
      {/* Teacher Demonstration Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/25 border border-emerald-300/30 px-2.5 py-0.5 rounded-full text-emerald-200">
                👨‍🏫 Teacher Demonstration Mode
              </span>
              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                Classroom Presentation & Projector View
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-2 text-white">
              Interactive Smartboard Science Laboratory
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Designed for classroom projection onto smart boards, projectors, and tablets. Project live CBC practicals with pause/reset controls, interactive questioning, and answer reveals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAssignExperiment?.(currentExp)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Assign to Class / Stream</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Demonstration Experiment Selector Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <span className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-2.5">
          Select Demonstration Experiment:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {CBC_VIRTUAL_EXPERIMENTS.map(exp => (
            <button
              key={exp.id}
              onClick={() => {
                setSelectedExpId(exp.id);
                setHasRevealedAnswer(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                selectedExpId === exp.id
                  ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500 text-emerald-950 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase">{exp.subject} · {exp.gradeLevel}</div>
              <div className="text-xs font-black line-clamp-1 mt-0.5">{exp.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Teacher Smartboard Controls Bar */}
      <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Classroom Controls:</span>
          
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showMeasurements ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showMeasurements ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Measurements ({showMeasurements ? 'Visible' : 'Hidden'})</span>
          </button>

          <button
            onClick={() => setShowExpectedResult(!showExpectedResult)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showExpectedResult ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Expected Scientific Result</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActivePollIndex(activePollIndex === null ? 0 : null);
              setHasRevealedAnswer(false);
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Launch Class Poll Question</span>
          </button>
        </div>
      </div>

      {/* Live Classroom Interactive Question Modal / Box */}
      {activePollIndex !== null && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <span>Projected Classroom Question</span>
            </div>
            <button
              onClick={() => setActivePollIndex(null)}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
            >
              Close Question
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {activeQuestion.question}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeQuestion.options.map(opt => {
              const isCorrect = opt.correct;
              return (
                <div 
                  key={opt.key}
                  className={`p-3.5 rounded-2xl border text-xs transition-all flex items-start gap-3 ${
                    hasRevealedAnswer && isCorrect
                      ? 'border-emerald-500 bg-emerald-100/90 font-bold text-emerald-950 ring-2 ring-emerald-500'
                      : 'border-amber-200 bg-white text-slate-800'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-black flex items-center justify-center shrink-0">
                    {opt.key}
                  </span>
                  <div className="flex-1">
                    <div>{opt.text}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Learner Votes: {studentVotes[opt.key] || 0} students
                    </div>
                  </div>
                  {hasRevealedAnswer && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setHasRevealedAnswer(!hasRevealedAnswer)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {hasRevealedAnswer ? 'Hide Correct Answer' : 'Reveal Correct Answer to Class'}
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Stage for Demonstration */}
      <InteractiveSimulationEngine
        experiment={currentExp}
        mode="demonstration"
      />

      {/* Expected Result Reveal Card */}
      {showExpectedResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-2xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
            <Lightbulb className="w-4 h-4 text-emerald-700" />
            <span>CBC Expected Scientific Conclusion & Grading Rubric</span>
          </div>
          <p className="text-emerald-900 leading-relaxed">
            <strong>Aim:</strong> {currentExp.aim}
          </p>
          <p className="text-emerald-800 leading-relaxed">
            <strong>Theoretical Deduction:</strong> {currentExp.hypothesis}
          </p>
        </div>
      )}
    </div>
  );
};
