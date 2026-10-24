import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  SubjectName, 
  TeacherLessonFile,
  PRIMARY_SUBJECTS,
  JUNIOR_SUBJECTS,
  getStreamsForGrade,
  getSubjectsForGrade 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  FolderPlus, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  BookOpen, 
  Check, 
  X,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';

interface TeacherLessonFileManagerProps {
  currentUser: User;
}

// CBC Curriculum strand & competency reference knowledge base
const CBC_CURRICULUM_MAP: Record<string, {
  strands: string[];
  subStrands: string[];
  defaultCompetencies: string[];
  defaultValues: string[];
}> = {
  'Mathematics': {
    strands: ['Numbers & Operations', 'Measurement & Geometry', 'Data Handling & Statistics', 'Algebraic Thinking'],
    subStrands: ['Fractions & Decimals', 'Perimeter & Area', 'Whole Numbers & Integers', 'Money & Financial Literacy', 'Linear Equations'],
    defaultCompetencies: ['Critical Thinking & Problem Solving', 'Digital Literacy', 'Learning to Learn'],
    defaultValues: ['Integrity', 'Responsibility', 'Diligence']
  },
  'Integrated Science': {
    strands: ['Living Things and Environment', 'Matter & Chemical Reactions', 'Force, Energy and Motion', 'Earth & Space Science'],
    subStrands: ['Plant & Animal Classification', 'Human Body Systems & Digestion', 'Separation of Mixtures & Filtration', 'Light, Sound and Reflection'],
    defaultCompetencies: ['Critical Thinking & Problem Solving', 'Communication & Collaboration', 'Self-Efficacy'],
    defaultValues: ['Environmental Stewardship', 'Respect for Life', 'Integrity']
  },
  'English': {
    strands: ['Listening and Speaking', 'Reading & Comprehension', 'Language Structures & Functions', 'Creative Writing'],
    subStrands: ['Narrative & Descriptive Essays', 'Oral Literature & Poetry', 'Tenses, Adjectives & Prepositions', 'Summary Writing'],
    defaultCompetencies: ['Communication and Collaboration', 'Creativity and Imagination', 'Self-Efficacy'],
    defaultValues: ['Respect', 'Unity', 'Love']
  },
  'Kiswahili': {
    strands: ['Kusikiliza na Kuzungumza', 'Kusoma na Ufahamu', 'Sarufi na Matumizi ya Lugha', 'Kuandika Insha'],
    subStrands: ['Ngeli za Nomino', 'Ushairi na Fasihi Simulizi', 'Insha za Wasifu na Maelezo', 'Methali na Nahau za Kiswahili'],
    defaultCompetencies: ['Mawasiliano na Ushirikiano', 'Ubunifu na Mawazo', 'Uraia'],
    defaultValues: ['Heshima', 'Umoja', 'Uzalendo']
  },
  'Social Studies': {
    strands: ['People and Their Environment', 'Culture and Social Organization', 'Resources and Economic Activities', 'Political Systems & Governance'],
    subStrands: ['Physical Landscapes & The Rift Valley', 'Democracy, Law and Citizenship', 'Trade, Agriculture and Mining', 'Kenyan National Heritage'],
    defaultCompetencies: ['Citizenship', 'Critical Thinking', 'Communication and Collaboration'],
    defaultValues: ['Patriotism', 'Unity', 'Peace', 'Integrity']
  },
  'Agriculture and Nutrition': {
    strands: ['Crop Production & Gardening', 'Animal Rearing & Health', 'Food Nutrition & Preservation', 'Soil & Water Conservation'],
    subStrands: ['Kitchen Gardening & Nursery Beds', 'Poultry & Small Domestic Stock', 'Balanced Diets & Food Hygiene', 'Composting & Organic Mulching'],
    defaultCompetencies: ['Self-Efficacy', 'Problem Solving', 'Creativity and Innovation'],
    defaultValues: ['Hard Work', 'Responsibility', 'Environmental Care']
  },
  'Pretechnical Education': {
    strands: ['Technical Drawing & Engineering Design', 'Materials, Hand Tools & Hardware', 'Safety in the Workplace', 'Basic Electrical Principles'],
    subStrands: ['Orthographic & Isometric Drawing', 'Workshop Safety & PPE Protocols', 'Woodwork & Metalwork Joinery', 'Simple Electric Circuits'],
    defaultCompetencies: ['Digital Literacy', 'Creativity and Imagination', 'Critical Thinking'],
    defaultValues: ['Integrity', 'Diligence', 'Precision']
  },
  'Pre-Technical Studies': {
    strands: ['Technical Drawing & Engineering Design', 'Materials, Hand Tools & Hardware', 'Safety in the Workplace', 'Basic Electrical Principles'],
    subStrands: ['Orthographic & Isometric Drawing', 'Workshop Safety & PPE Protocols', 'Woodwork & Metalwork Joinery', 'Simple Electric Circuits'],
    defaultCompetencies: ['Digital Literacy', 'Creativity and Imagination', 'Critical Thinking'],
    defaultValues: ['Integrity', 'Diligence', 'Precision']
  },
  'Computer Studies': {
    strands: ['Computer Systems & Hardware', 'Digital Literacy & Web Applications', 'Programming & Computational Thinking', 'Data Security & Ethics'],
    subStrands: ['Scratch Visual Coding & Loops', 'Spreadsheet Formulas & Data Analysis', 'Internet Safety & Cyber Ethics', 'Algorithm Design'],
    defaultCompetencies: ['Digital Literacy', 'Critical Thinking & Problem Solving', 'Creativity and Imagination'],
    defaultValues: ['Integrity', 'Responsibility', 'Respect for Intellectual Property']
  },
  'Creative Arts': {
    strands: ['Visual Arts and Design', 'Music and Performing Arts', 'Theatre and Film', 'Indigenous Crafts'],
    subStrands: ['Colour Theory and Painting', 'Traditional Folk Songs & Rhythm', 'Dramatization and Storytelling', 'Pottery, Weaving & Beadwork'],
    defaultCompetencies: ['Creativity and Imagination', 'Communication and Collaboration', 'Self-Efficacy'],
    defaultValues: ['Peace', 'Love', 'Cultural Respect']
  },
  'Physical and Health Education': {
    strands: ['Physical Fitness & Athletics', 'Games and Sportsmanship', 'First Aid and Safety', 'Healthy Living & Wellness'],
    subStrands: ['Track & Field Events', 'Team Ball Games (Football, Volleyball)', 'Sports Injuries and CPR Basics', 'Substance Abuse Prevention'],
    defaultCompetencies: ['Self-Efficacy', 'Communication and Collaboration', 'Citizenship'],
    defaultValues: ['Discipline', 'Fair Play', 'Respect']
  }
};

export const TeacherLessonFileManager: React.FC<TeacherLessonFileManagerProps> = ({ currentUser }) => {
  const [files, setFiles] = useState<TeacherLessonFile[]>(() => Storage.getTeacherLessonFiles());
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(currentUser.grade || 4);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>('Mathematics');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [filterFileType, setFilterFileType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<TeacherLessonFile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with live updates
  useEffect(() => {
    const handleFilesUpdated = () => setFiles(Storage.getTeacherLessonFiles());
    window.addEventListener('teacher-lesson-files-updated', handleFilesUpdated);
    return () => window.removeEventListener('teacher-lesson-files-updated', handleFilesUpdated);
  }, []);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadGrade, setUploadGrade] = useState<GradeLevel>(currentUser.grade || 4);
  const [uploadSubject, setUploadSubject] = useState<SubjectName>('Mathematics');
  const [uploadStream, setUploadStream] = useState<string>('all');
  const [uploadTerm, setUploadTerm] = useState<1 | 2 | 3>(1);
  const [uploadFileType, setUploadFileType] = useState<'pdf' | 'image' | 'doc' | 'slides'>('pdf');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('1.5 MB');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadIsVisible, setUploadIsVisible] = useState(true);

  // CBC Auto-Tagging Fields
  const [strand, setStrand] = useState('');
  const [subStrand, setSubStrand] = useState('');
  const [coreCompetency, setCoreCompetency] = useState('');
  const [values, setValues] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const validSubjectsForGrade = useMemo(() => {
    return getSubjectsForGrade(uploadGrade);
  }, [uploadGrade]);

  const validStreamsForGrade = useMemo(() => {
    return getStreamsForGrade(uploadGrade);
  }, [uploadGrade]);

  // Automatic CBC tagging trigger based on grade, subject and title
  useEffect(() => {
    const mapping = CBC_CURRICULUM_MAP[uploadSubject] || CBC_CURRICULUM_MAP['Mathematics'];
    
    // Choose sensible default strand based on title or subject
    const selectedStrand = mapping.strands[0] || 'Core CBC Curriculum';
    const selectedSubStrand = mapping.subStrands[0] || 'General Subject Competencies';
    const selectedCompetency = mapping.defaultCompetencies.join(', ');
    const selectedValues = mapping.defaultValues.join(', ');

    setStrand(selectedStrand);
    setSubStrand(selectedSubStrand);
    setCoreCompetency(selectedCompetency);
    setValues(selectedValues);

    // Auto-generate tags
    const generatedTags = [
      uploadSubject,
      `Grade ${uploadGrade}`,
      uploadGrade >= 7 ? 'Junior School' : 'Primary CBC',
      mapping.strands[0].split(' ')[0],
      `Term ${uploadTerm}`
    ];
    setTags(generatedTags);
  }, [uploadSubject, uploadGrade, uploadTerm]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    if (file.type.startsWith('image/')) {
      setUploadFileType('image');
    } else {
      setUploadFileType('pdf');
    }

    if (!uploadTitle.trim()) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadFileUrl(event.target?.result as string || '');
    };
    reader.readAsDataURL(file);
  };

  // Add custom tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter(t => t !== tToRemove));
  };

  // Submit new lesson file
  const handleSaveFile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadTitle.trim()) {
      alert('Please enter a lesson resource title');
      return;
    }

    const fallbackUrl = uploadFileType === 'image'
      ? 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80';

    const newFile: TeacherLessonFile = {
      id: `lfile-${Date.now()}`,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      title: uploadTitle.trim(),
      description: uploadDescription.trim() || `CBC Lesson Resource for ${uploadSubject} Grade ${uploadGrade}`,
      fileName: uploadFileName || `${uploadTitle.replace(/\s+/g, '_')}.${uploadFileType === 'image' ? 'png' : 'pdf'}`,
      fileType: uploadFileType,
      fileSize: uploadFileSize || '1.8 MB',
      fileUrl: uploadFileUrl || fallbackUrl,
      subject: uploadSubject,
      grade: uploadGrade,
      stream: uploadStream === 'all' ? undefined : (uploadStream as StreamName),
      term: uploadTerm,
      strand: strand || 'CBC Core Strand',
      subStrand: subStrand || 'Subject Sub-strand',
      coreCompetency: coreCompetency || 'Critical Thinking & Problem Solving',
      values: values || 'Integrity, Responsibility',
      tags: tags.length > 0 ? tags : [uploadSubject, `Grade ${uploadGrade}`],
      isVisibleToStudents: uploadIsVisible,
      downloadsCount: 0,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    Storage.addTeacherLessonFile(newFile);
    setShowUploadModal(false);

    // Reset form
    setUploadTitle('');
    setUploadDescription('');
    setUploadFileName('');
    setUploadFileUrl('');
    setToastMessage(`🎉 Uploaded "${newFile.title}" with automatic CBC curriculum tags!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle student visibility
  const handleToggleVisibility = (file: TeacherLessonFile) => {
    Storage.updateTeacherLessonFile(file.id, {
      isVisibleToStudents: !file.isVisibleToStudents
    });
    setToastMessage(`Resource is now ${!file.isVisibleToStudents ? 'VISIBLE' : 'HIDDEN'} to learners.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Delete file
  const handleDeleteFile = (file: TeacherLessonFile) => {
    if (confirm(`Are you sure you want to delete "${file.title}"?`)) {
      Storage.deleteTeacherLessonFile(file.id);
      setToastMessage('Resource removed from repository.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Filtered files for display
  const displayedFiles = useMemo(() => {
    return files.filter(f => {
      // Grade filter
      if (selectedGrade && f.grade !== selectedGrade) return false;

      // Subject filter
      if (selectedSubject && f.subject !== selectedSubject) return false;

      // Stream filter
      if (filterStream !== 'all') {
        if (f.stream && f.stream !== filterStream) return false;
      }

      // File type filter
      if (filterFileType !== 'all') {
        if (f.fileType !== filterFileType) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = f.title.toLowerCase().includes(q);
        const strandMatch = f.strand.toLowerCase().includes(q);
        const subStrandMatch = f.subStrand.toLowerCase().includes(q);
        const tagMatch = f.tags.some(t => t.toLowerCase().includes(q));
        return titleMatch || strandMatch || subStrandMatch || tagMatch;
      }

      return true;
    });
  }, [files, selectedGrade, selectedSubject, filterStream, filterFileType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KICD CBC Curriculum Lesson Repository</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white">
            Lesson Resource & File Manager
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Upload and organize pedagogical resources (PDFs, worksheets, apparatus diagrams, high-resolution visual charts). Every resource is automatically tagged with CBC Strands, Sub-strands, Core Competencies, and Values.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Lesson Resource</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, strand, or CBC tag..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Grade & Subject Selectors */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Grade Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Grade:</span>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as GradeLevel[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Subject Dropdown */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value as SubjectName)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {getSubjectsForGrade(selectedGrade).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Stream Filter */}
            <select
              value={filterStream}
              onChange={(e) => setFilterStream(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Streams</option>
              {getStreamsForGrade(selectedGrade).map(st => (
                <option key={st} value={st}>{st} Stream Only</option>
              ))}
            </select>

            {/* File Type Filter */}
            <select
              value={filterFileType}
              onChange={(e) => setFilterFileType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF Documents</option>
              <option value="image">Diagrams / Images</option>
            </select>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-900">{displayedFiles.length}</strong> resources for <strong>Grade {selectedGrade} · {selectedSubject}</strong>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Visible to Learners</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Draft / Hidden</span>
            </span>
          </div>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {displayedFiles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No lesson resources found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No lesson files match your current grade ({selectedGrade}) and subject ({selectedSubject}) filter. Click the button below to upload your first lesson resource.
          </p>
          <button
            type="button"
            onClick={() => {
              setUploadGrade(selectedGrade);
              setUploadSubject(selectedSubject);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload for {selectedSubject}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedFiles.map((file) => (
            <div 
              key={file.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
            >
              {/* Top Details & Badges */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      file.fileType === 'pdf' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}>
                      {file.fileType === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                        {file.fileType.toUpperCase()} · {file.fileSize}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                        {file.title}
                      </h4>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    file.isVisibleToStudents
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {file.isVisibleToStudents ? 'Visible to Learners' : 'Hidden'}
                  </span>
                </div>

                {file.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {file.description}
                  </p>
                )}

                {/* CBC Automatic Tagging Metadata Box */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">CBC Strand:</span>
                    <span className="font-extrabold text-blue-900">{file.strand}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">Sub-strand:</span>
                    <span className="font-bold text-slate-800">{file.subStrand}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-bold">Core Competency:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[220px]" title={file.coreCompetency}>
                      {file.coreCompetency}
                    </span>
                  </div>
                  {file.stream && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-indigo-600 font-bold">Stream Exclusive:</span>
                      <span className="font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px]">
                        {file.stream} Stream
                      </span>
                    </div>
                  )}
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {file.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 font-mono">
                  By {file.teacherName.split(' ')[0]} · {file.uploadedAt}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Preview resource"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={file.fileUrl}
                    download={file.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(file)}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      file.isVisibleToStudents
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={file.isVisibleToStudents ? "Hide from students" : "Make visible to students"}
                  >
                    {file.isVisibleToStudents ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          UPLOAD MODAL WITH AUTOMATIC CBC CURRICULUM TAGGING
          ======================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pedagogical CBC Resource Uploader</span>
                </div>
                <h3 className="text-xl font-black text-slate-950 font-serif">
                  Upload Lesson Resource & Auto-Tag
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFile} className="space-y-5 text-xs">
              {/* File Drop Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-blue-50/40 hover:bg-blue-50/80 transition-all space-y-2 group"
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    {uploadFileName || 'Click to select PDF or image file from device'}
                  </span>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    Supports CBC PDF handouts, apparatus charts, PNG/JPG worksheets (up to 25MB)
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Resource Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Grade 4 Integrated Science Filtration & Apparatus Chart"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pedagogical Description / Instructions for Learners
                  </label>
                  <textarea
                    rows={2}
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Detailed guidance on how learners should use this handout during practical inquiry..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Grade, Subject, Stream, Term */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade</label>
                  <select
                    value={uploadGrade}
                    onChange={(e) => setUploadGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value as SubjectName)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    {validSubjectsForGrade.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stream Allocation</label>
                  <select
                    value={uploadStream}
                    onChange={(e) => setUploadStream(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">All Streams</option>
                    {validStreamsForGrade.map(st => (
                      <option key={st} value={st}>{st} Stream Only</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">School Term</label>
                  <select
                    value={uploadTerm}
                    onChange={(e) => setUploadTerm(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>
              </div>

              {/* Automatic CBC Curriculum Tagging Box */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-950 font-black">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Automatic CBC Curriculum Metadata (Customizable)</span>
                  </div>
                  <span className="text-[10px] bg-indigo-200/80 text-indigo-900 font-bold px-2 py-0.5 rounded-full uppercase">
                    KICD Aligned
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">CBC Strand</label>
                    <input
                      type="text"
                      value={strand}
                      onChange={(e) => setStrand(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-slate-900 font-bold"
                      placeholder="e.g. Numbers & Operations"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Sub-strand</label>
                    <input
                      type="text"
                      value={subStrand}
                      onChange={(e) => setSubStrand(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-slate-900 font-bold"
                      placeholder="e.g. Fractions & Decimals"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Core Competency</label>
                    <input
                      type="text"
                      value={coreCompetency}
                      onChange={(e) => setCoreCompetency(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-slate-900"
                      placeholder="e.g. Critical Thinking & Problem Solving"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">Values</label>
                    <input
                      type="text"
                      value={values}
                      onChange={(e) => setValues(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-slate-900"
                      placeholder="e.g. Integrity, Responsibility, Respect"
                    />
                  </div>
                </div>

                {/* Tag Pills Manager */}
                <div className="space-y-2 pt-2 border-t border-indigo-200/60">
                  <label className="block text-[11px] font-bold text-indigo-900">Curriculum Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-lg bg-white border border-indigo-300 text-indigo-900 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                        <span>#{t}</span>
                        <button type="button" onClick={() => handleRemoveTag(t)} className="text-slate-400 hover:text-rose-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Add custom tag (press Enter)..."
                      className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs text-slate-800 flex-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">Make visible to enrolled learners immediately</span>
                  <span className="text-[11px] text-slate-500">
                    If checked, learners in Grade {uploadGrade} ({uploadStream === 'all' ? 'All Streams' : `${uploadStream} Stream`}) can access this handout right away.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={uploadIsVisible}
                  onChange={(e) => setUploadIsVisible(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to Repository</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          PREVIEW MODAL
          ======================================================== */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {previewFile.fileType === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{previewFile.title}</h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Grade {previewFile.grade} · {previewFile.subject} · {previewFile.strand}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-96 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center relative">
              {previewFile.fileType === 'image' ? (
                <img 
                  src={previewFile.fileUrl} 
                  alt={previewFile.title} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-white space-y-3 p-6">
                  <FileText className="w-16 h-16 text-blue-400 mx-auto" />
                  <div className="font-bold text-lg">{previewFile.fileName}</div>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    KICD CBC pedagogical document ready for classroom viewing and offline printing.
                  </p>
                  <a
                    href={previewFile.fileUrl}
                    download={previewFile.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Handout</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <div>
                Tags: {previewFile.tags.map(t => `#${t}`).join(' ')}
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
