import React, { useState } from 'react';
import { User, PortfolioItem, SubjectName, getSubjectsForGrade } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  FolderGit2, 
  Plus, 
  Sparkles, 
  Award, 
  CheckCircle, 
  Image as ImageIcon, 
  ExternalLink, 
  MessageSquare,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';

interface EPortfolioModuleProps {
  currentUser: User;
}

export const EPortfolioModule: React.FC<EPortfolioModuleProps> = ({ currentUser }) => {
  const [items, setItems] = useState<PortfolioItem[]>(() => Storage.getPortfolioItems(currentUser.id));
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form states
  const subjects = getSubjectsForGrade(currentUser.grade || 4);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState<SubjectName>(subjects[0]);
  const [newStrand, setNewStrand] = useState('');
  const [newCategory, setNewCategory] = useState<PortfolioItem['category']>('Project & Model');
  const [newDescription, setNewDescription] = useState('');
  const [newReflection, setNewReflection] = useState('');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newReflection.trim()) return;

    const newItem: PortfolioItem = {
      id: `port-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      grade: currentUser.grade || 4,
      subject: newSubject,
      title: newTitle.trim(),
      description: newDescription.trim(),
      learningStrand: newStrand.trim() || 'Practical Skills & Inventions',
      category: newCategory,
      evidenceUrl: newEvidenceUrl.trim() || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
      reflection: newReflection.trim(),
      competencyLevel: 'Meeting Expectations',
      awardedPoints: 50,
      createdAt: new Date().toISOString().split('T')[0]
    };

    Storage.addPortfolioItem(newItem);
    setItems(Storage.getPortfolioItems(currentUser.id));
    setAddSuccess(true);
    setNewTitle('');
    setNewStrand('');
    setNewDescription('');
    setNewReflection('');
    setNewEvidenceUrl('');
    setTimeout(() => {
      setAddSuccess(false);
      setShowAddModal(false);
    }, 1500);
  };

  const filteredItems = items.filter(it => 
    filterCategory === 'all' || it.category === filterCategory
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 hidden sm:block">
            <EduSmartGadsaLogo variant="horizontal" size="xs" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
              <FolderGit2 className="w-4 h-4" />
              <span>Digital E-Portfolio & Practical Evidence Showcase</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Learner Project Artifacts & Reflections
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Upload and showcase school projects, agricultural models, scientific experiments, and creative arts crafts for teacher assessment and parental review.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project Artifact</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {['all', 'Project & Model', 'Experiment & Science', 'Creative Arts & Craft', 'Reflective Journal'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? `All Artifacts (${items.length})` : cat}
          </button>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            {/* Artifact Preview Image */}
            {item.evidenceUrl && (
              <div className="h-44 w-full overflow-hidden bg-slate-100 relative group">
                <img
                  src={item.evidenceUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                  {item.category}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
                  +{item.awardedPoints} XP
                </span>
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                  <span>{item.subject}</span>
                  <span>{item.createdAt}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                <div className="text-[11px] font-semibold text-emerald-800 mb-2">
                  Strand: {item.learningStrand}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Learner Reflection */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Learner Reflection</span>
                </span>
                <p className="text-slate-700 italic text-[11px]">"{item.reflection}"</p>
              </div>

              {/* Teacher Feedback / Competency Seal */}
              {item.teacherFeedback ? (
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Teacher Evaluation</span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900">
                      {item.competencyLevel}
                    </span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">{item.teacherFeedback}</p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-mono">
                  Pending Class Teacher portfolio review
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Artifact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload Project Evidence & Artifact</h3>
                <p className="text-xs text-slate-500">Document your practical CBC achievements and reflections.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project or Experiment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Model Windmill for Grain Grinding"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Learning Area (Subject) *</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value as SubjectName)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {subjects.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Artifact Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Project & Model">Project & Model</option>
                    <option value="Experiment & Science">Experiment & Science</option>
                    <option value="Creative Arts & Craft">Creative Arts & Craft</option>
                    <option value="Reflective Journal">Reflective Journal</option>
                    <option value="Digital Evidence">Digital Evidence</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Curriculum Strand & Sub-strand</label>
                <input
                  type="text"
                  value={newStrand}
                  onChange={(e) => setNewStrand(e.target.value)}
                  placeholder="e.g. Physical Sciences · Energy Transformations"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Description & Methods *</label>
                <textarea
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe what you built or tested, materials used, and steps followed..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Learner Self-Reflection *</label>
                <textarea
                  rows={2}
                  required
                  value={newReflection}
                  onChange={(e) => setNewReflection(e.target.value)}
                  placeholder="What did you learn? What challenge did you overcome?"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Evidence Photo / Document URL</label>
                <input
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (optional)"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              {addSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Portfolio artifact published successfully! Earned +50 XP.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Save to E-Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
