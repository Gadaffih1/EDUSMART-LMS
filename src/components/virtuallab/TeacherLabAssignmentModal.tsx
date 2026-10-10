import React, { useState } from 'react';
import { 
  X, 
  FlaskConical, 
  Laptop, 
  CheckCircle2, 
  Calendar, 
  Award, 
  BookOpen, 
  Send,
  AlertCircle
} from 'lucide-react';
import { User, GradeLevel, SubjectName, Assignment } from '../../types';
import { Storage } from '../../utils/storage';
import { CBC_VIRTUAL_EXPERIMENTS, VirtualExperiment } from './labInventoryData';
import { CBC_SCRATCH_PROJECTS, ScratchProjectTemplate } from './ComputerLabScratchStudio';

interface TeacherLabAssignmentModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess?: (createdAssignment: Assignment) => void;
  initialLabType?: 'science' | 'scratch';
  initialExperiment?: VirtualExperiment;
  initialScratchProject?: ScratchProjectTemplate;
}

export const TeacherLabAssignmentModal: React.FC<TeacherLabAssignmentModalProps> = ({
  currentUser,
  onClose,
  onSuccess,
  initialLabType = 'science',
  initialExperiment,
  initialScratchProject
}) => {
  const [labType, setLabType] = useState<'science' | 'scratch'>(initialLabType);
  const [grade, setGrade] = useState<GradeLevel>(currentUser.grade || 7);
  const [stream, setStream] = useState<string>(currentUser.stream || 'Dove');
  const [subject, setSubject] = useState<SubjectName>(
    labType === 'scratch' ? 'Computer Studies' : (currentUser.assignedSubjects?.[0] || 'Integrated Science')
  );

  const [selectedExperimentId, setSelectedExperimentId] = useState<string>(
    initialExperiment?.id || CBC_VIRTUAL_EXPERIMENTS[0].id
  );
  const [selectedScratchId, setSelectedScratchId] = useState<string>(
    initialScratchProject?.id || CBC_SCRATCH_PROJECTS[0].id
  );

  const selectedExp = CBC_VIRTUAL_EXPERIMENTS.find(e => e.id === selectedExperimentId) || CBC_VIRTUAL_EXPERIMENTS[0];
  const selectedScratch = CBC_SCRATCH_PROJECTS.find(s => s.id === selectedScratchId) || CBC_SCRATCH_PROJECTS[0];

  const [title, setTitle] = useState(
    labType === 'science' 
      ? `Practical Lab: ${selectedExp.title}`
      : `Scratch Coding Challenge: ${selectedScratch.title}`
  );
  const [instructions, setInstructions] = useState(
    labType === 'science'
      ? `Conduct the digital experiment in the Virtual Lab Workbench. Record hypothesis, data observations table, and write a formal CBC conclusion answering the inquiry questions.`
      : `Build and run the block coding script in the Scratch Coding Studio. Test collision handling, verify variable score updates, and document your algorithmic logic.`
  );

  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [maxScore, setMaxScore] = useState<number>(30);
  const [submitted, setSubmitted] = useState(false);

  const handleLabTypeChange = (newType: 'science' | 'scratch') => {
    setLabType(newType);
    if (newType === 'scratch') {
      setSubject('Computer Studies');
      setTitle(`Scratch Coding Challenge: ${selectedScratch.title}`);
      setInstructions(`Build and run the block coding script in the Scratch Coding Studio. Test collision handling, verify variable score updates, and document your algorithmic logic.`);
    } else {
      setSubject('Integrated Science');
      setTitle(`Practical Lab: ${selectedExp.title}`);
      setInstructions(`Conduct the digital experiment in the Virtual Lab Workbench. Record hypothesis, data observations table, and write a formal CBC conclusion answering the inquiry questions.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) return;

    const newAssignment: Assignment = {
      id: `asg-vlab-${Date.now()}`,
      grade,
      stream,
      subject,
      title,
      instructions,
      dueDate,
      maxScore: Number(maxScore),
      teacherName: currentUser.name,
      teacherId: currentUser.id,
      submissionsCount: 0,
      isVirtualLab: true,
      virtualLabType: labType,
      labExperimentId: labType === 'science' ? selectedExperimentId : selectedScratchId,
      labTitle: labType === 'science' ? selectedExp.title : selectedScratch.title
    } as any;

    Storage.addAssignment(newAssignment);
    window.dispatchEvent(new CustomEvent('assignments-updated'));

    setSubmitted(true);
    setTimeout(() => {
      if (onSuccess) onSuccess(newAssignment);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              labType === 'science' ? 'bg-emerald-600' : 'bg-indigo-600'
            }`}>
              {labType === 'science' ? <FlaskConical className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Assign Virtual Lab / Scratch Practical
              </h3>
              <p className="text-xs text-slate-300">
                Create a digital practical task for learners to complete in their student workbench.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">
              Lab Practical Assigned Successfully!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Learners in Grade {grade} {stream} can now access and launch this practical directly from their Course Assignments portal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Lab Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lab Discipline & Component:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLabTypeChange('science')}
                  className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                    labType === 'science'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <FlaskConical className={`w-5 h-5 ${labType === 'science' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-black">Science Practical</div>
                    <div className="text-[11px] text-slate-500">Titrations, Circuits, Microscope, Density</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLabTypeChange('scratch')}
                  className={`p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                    labType === 'scratch'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Laptop className={`w-5 h-5 ${labType === 'scratch' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-black">Scratch Computer Lab</div>
                    <div className="text-[11px] text-slate-500">Block coding, algorithms, sprites & loops</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Target Practical Selection */}
            {labType === 'science' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select CBC Virtual Experiment:</label>
                <select
                  value={selectedExperimentId}
                  onChange={(e) => {
                    setSelectedExperimentId(e.target.value);
                    const exp = CBC_VIRTUAL_EXPERIMENTS.find(x => x.id === e.target.value);
                    if (exp) {
                      setTitle(`Practical Lab: ${exp.title}`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {CBC_VIRTUAL_EXPERIMENTS.map(exp => (
                    <option key={exp.id} value={exp.id}>
                      [{exp.subject}] {exp.title} ({exp.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select CBC Scratch Project:</label>
                <select
                  value={selectedScratchId}
                  onChange={(e) => {
                    setSelectedScratchId(e.target.value);
                    const s = CBC_SCRATCH_PROJECTS.find(x => x.id === e.target.value);
                    if (s) {
                      setTitle(`Scratch Coding Challenge: ${s.title}`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {CBC_SCRATCH_PROJECTS.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      Grade {proj.grade}: {proj.title} ({proj.difficulty})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Class & Stream */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Target Grade:</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {[4, 5, 6, 7, 8, 9].map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Stream:</label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Dove">Dove</option>
                  <option value="Eagle">Eagle</option>
                  <option value="Falcon">Falcon</option>
                  <option value="All Streams">All Streams</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Max Score:</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Title & Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Assignment Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Learner Lab Instructions & Deliverables:</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Submission Due Date:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            {/* Info note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Learners only access the virtual lab through their assigned tasks. Once published, a "Launch Assigned Lab" button will appear on each learner's assignment card.
              </span>
            </div>

            {/* Submit button */}
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Lab Assignment</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
