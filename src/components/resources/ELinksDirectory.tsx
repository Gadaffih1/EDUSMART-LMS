import React, { useState, useEffect, useMemo } from 'react';
import { 
  ELink, 
  User, 
  GradeLevel, 
  SubjectName,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  ExternalLink, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Link2, 
  ShieldCheck, 
  BookOpen,
  Laptop,
  Check,
  Copy
} from 'lucide-react';

interface ELinksDirectoryProps {
  currentUser: User;
  canManage?: boolean;
  title?: string;
  subtitle?: string;
  defaultFilterSubject?: string;
  defaultFilterGrade?: GradeLevel | 'All Grades';
  embeddedMode?: boolean;
}

const CATEGORIES: ELink['category'][] = [
  'Curriculum & Reference',
  'Science & STEM',
  'KICD & Open Access',
  'Literature & Languages',
  'Digital Library & Research',
  'General Learning'
];

export const ELinksDirectory: React.FC<ELinksDirectoryProps> = ({
  currentUser,
  canManage = false,
  title = "Curated Educational E-Links & Digital Web Repositories",
  subtitle = "Direct access to verified national curriculum repositories, interactive STEM labs, digital lending portals, and open-access educational commons.",
  defaultFilterSubject,
  defaultFilterGrade,
  embeddedMode = false
}) => {
  // State from Storage
  const [links, setLinks] = useState<ELink[]>(() => Storage.getELinks());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>(
    defaultFilterGrade ? String(defaultFilterGrade) : 'all'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    defaultFilterSubject || 'all'
  );

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ELink['category']>('Curriculum & Reference');
  const [formGradeLevel, setFormGradeLevel] = useState<GradeLevel | 'All Grades'>('All Grades');
  const [formSubject, setFormSubject] = useState<SubjectName | 'Cross-Curricular'>('Cross-Curricular');

  // Listen to Storage Updates
  useEffect(() => {
    const handleUpdate = () => {
      setLinks(Storage.getELinks());
    };
    window.addEventListener('elinks-updated', handleUpdate);
    return () => window.removeEventListener('elinks-updated', handleUpdate);
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const allSubjects = useMemo(() => {
    return Array.from(new Set([...PRIMARY_SUBJECTS, ...JUNIOR_SUBJECTS]));
  }, []);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter(l => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = l.title.toLowerCase().includes(query);
        const matchesDesc = l.description.toLowerCase().includes(query);
        const matchesUrl = l.url.toLowerCase().includes(query);
        const matchesSubj = l.subject ? l.subject.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesDesc && !matchesUrl && !matchesSubj) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && l.category !== selectedCategory) {
        return false;
      }

      // Grade filter
      if (selectedGrade !== 'all') {
        if (l.gradeLevel !== 'All Grades' && String(l.gradeLevel) !== selectedGrade) {
          return false;
        }
      }

      // Subject filter
      if (selectedSubject !== 'all') {
        if (l.subject !== 'Cross-Curricular' && l.subject !== selectedSubject) {
          return false;
        }
      }

      return true;
    });
  }, [links, searchQuery, selectedCategory, selectedGrade, selectedSubject]);

  const handleOpenNewModal = () => {
    setEditingLinkId(null);
    setFormTitle('');
    setFormUrl('');
    setFormDescription('');
    setFormCategory('Curriculum & Reference');
    setFormGradeLevel(currentUser.grade ? currentUser.grade : 'All Grades');
    setFormSubject('Cross-Curricular');
    setShowModal(true);
  };

  const handleOpenEditModal = (link: ELink) => {
    setEditingLinkId(link.id);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDescription(link.description);
    setFormCategory(link.category);
    setFormGradeLevel(link.gradeLevel || 'All Grades');
    setFormSubject(link.subject || 'Cross-Curricular');
    setShowModal(true);
  };

  const handleDeleteLink = (id: string, linkTitle: string) => {
    if (window.confirm(`Are you sure you want to remove the E-Link: "${linkTitle}"?`)) {
      Storage.deleteELink(id);
      setLinks(Storage.getELinks());
      showFeedback(`E-Link "${linkTitle}" successfully removed.`);
    }
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    let cleanUrl = formUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const roleName = currentUser.role === 'librarian' 
      ? 'Librarian' 
      : ['teacher', 'class_teacher', 'hod', 'senior_teacher'].includes(currentUser.role)
      ? 'Teacher'
      : 'Admin';

    if (editingLinkId) {
      Storage.updateELink(editingLinkId, {
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        category: formCategory,
        gradeLevel: formGradeLevel,
        subject: formSubject
      });
      showFeedback(`E-Link "${formTitle.trim()}" updated successfully.`);
    } else {
      const newLink: ELink = {
        id: `elink-${Date.now()}`,
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        category: formCategory,
        gradeLevel: formGradeLevel,
        subject: formSubject,
        addedBy: `${currentUser.name} (${roleName})`,
        addedByRole: roleName,
        createdAt: new Date().toISOString().split('T')[0],
        clicksCount: 0
      };
      Storage.addELink(newLink);
      showFeedback(`New E-Link "${formTitle.trim()}" published to digital repository.`);
    }

    setLinks(Storage.getELinks());
    setShowModal(false);
  };

  const handleOpenExternal = (link: ELink) => {
    // Record click count
    Storage.updateELink(link.id, { clicksCount: (link.clicksCount || 0) + 1 });
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (link: ELink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`space-y-6 ${embeddedMode ? '' : 'bg-white rounded-2xl border border-slate-200 p-6 shadow-xs'}`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            {canManage && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                Manage Rights Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New E-Link</span>
          </button>
        )}
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Search Field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search E-Links, portals, topics..."
              className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            >
              <option value="all">All E-Link Categories ({links.length})</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            >
              <option value="all">All Grade Levels</option>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                <option key={g} value={String(g)}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            >
              <option value="all">All Subjects & Strands</option>
              <option value="Cross-Curricular">Cross-Curricular</option>
              {allSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Tag Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-bold uppercase tracking-wider mr-1 text-[10px]">
            Quick Focus:
          </span>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isActive ? 'all' : cat)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-blue-700 text-white shadow-2xs' 
                    : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of E-Links */}
      {filteredLinks.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
          <Globe className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No E-Links Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedGrade !== 'all' 
              ? 'Try clearing your search query or adjusting your category and grade filters.'
              : 'No educational E-Links have been added yet. Click "Add New E-Link" to publish one.'}
          </p>
          {canManage && (
            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-800 transition-colors"
            >
              Add First E-Link
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => {
            const isCopied = copiedId === link.id;
            return (
              <div
                key={link.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  {/* Category and Grade Badges */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {link.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {link.gradeLevel === 'All Grades' ? 'All Grades' : `Grade ${link.gradeLevel}`}
                      {link.subject && link.subject !== 'Cross-Curricular' && ` · ${link.subject}`}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-extrabold text-slate-900 text-sm mt-3 line-clamp-2 group-hover:text-blue-800 transition-colors">
                    {link.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                    {link.description}
                  </p>

                  {/* Creator / Contributor */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="truncate max-w-[180px]">By: {link.addedBy}</span>
                    <span>{link.createdAt}</span>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(link)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isCopied ? "Link Copied!" : "Copy Web URL"}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(link)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit E-Link"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id, link.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove E-Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenExternal(link)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title={`Open ${link.title}`}
                  >
                    <span>Open E-Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT E-LINK MODAL (LIBRARIAN & TEACHER RIGHTS) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingLinkId ? 'Edit Educational E-Link' : 'Publish New Educational E-Link'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentUser.role === 'librarian' ? 'School Librarian Digital Repository Rights' : 'Subject Teacher Curated E-Resource Rights'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  E-Link Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. KICD EduTV Mathematics Streaming Portal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Destination Web URL (HTTP/HTTPS) *
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://www.kicd.ac.ke/edutv"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-mono text-blue-700 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pedagogical Description & Learner Guidance *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the learning objectives, interactive features, or curriculum syllabus areas covered by this link..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ELink['category'])}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={String(formGradeLevel)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormGradeLevel(val === 'All Grades' ? 'All Grades' : Number(val) as GradeLevel);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="All Grades">All Grades</option>
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                      <option key={g} value={String(g)}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as SubjectName | 'Cross-Curricular')}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="Cross-Curricular">Cross-Curricular</option>
                    {allSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Institutional Digital Compliance:</strong> All published E-Links are instantly synchronized to both the Librarian Digital Library directory and Subject Teacher E-Resources, and are immediately browsable by students.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {editingLinkId ? 'Save Changes' : 'Publish E-Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
