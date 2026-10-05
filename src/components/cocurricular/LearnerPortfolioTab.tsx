import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Trophy, 
  Medal, 
  Award, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  HeartPulse,
  BookOpen
} from 'lucide-react';
import { 
  LearnerCoCurricularProfile, 
  CoCurricularActivity, 
  TalentArea, 
  ActivityMemberRole, 
  RegistrationStatus 
} from '../../types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface LearnerPortfolioTabProps {
  profiles: LearnerCoCurricularProfile[];
  activities: CoCurricularActivity[];
  onAddProfile: (profile: LearnerCoCurricularProfile) => void;
  onUpdateProfile: (id: string, updates: Partial<LearnerCoCurricularProfile>) => void;
  onDeleteProfile: (id: string) => void;
}

export const LearnerPortfolioTab: React.FC<LearnerPortfolioTabProps> = ({
  profiles,
  activities,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<LearnerCoCurricularProfile | null>(null);
  const [printTranscriptMode, setPrintTranscriptMode] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  // New Profile Form
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('stu-custom');
  const [admissionNumber, setAdmissionNumber] = useState('ADM/2026/');
  const [grade, setGrade] = useState<number>(4);
  const [stream, setStream] = useState<string>('Dove');
  const [activityId, setActivityId] = useState(activities[0]?.id || '');
  const [role, setRole] = useState<ActivityMemberRole>('Member');
  const [talent, setTalent] = useState<TalentArea>('Football');
  const [notes, setNotes] = useState('');

  const filtered = profiles.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.activityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || p.registrationStatus === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const act = activities.find(a => a.id === activityId);
    if (!studentName || !act) return;

    const newProfile: LearnerCoCurricularProfile = {
      id: `lcp-${Date.now()}`,
      studentId: studentId || `stu-${Date.now()}`,
      studentName,
      admissionNumber,
      grade: grade as any,
      stream: stream as any,
      activityId: act.id,
      activityName: act.name,
      category: act.category,
      role,
      registrationStatus: 'Active',
      registrationDate: new Date().toISOString().split('T')[0],
      attendanceRate: 100,
      talentStrengths: [talent],
      competitionsAttended: [],
      awardsEarned: [],
      coachNotes: notes || 'Registered for Term 3 session.',
      parentConsentGiven: true
    };

    onAddProfile(newProfile);
    setShowRegisterModal(false);
    setStudentName('');
  };

  const handleStatusChange = (id: string, newStatus: RegistrationStatus) => {
    onUpdateProfile(id, { registrationStatus: newStatus });
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search learner name, ADM number or activity..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Domains</option>
            <option value="Sports">Sports</option>
            <option value="Clubs & Societies">Clubs & Societies</option>
            <option value="Creative Arts & Music">Creative Arts & Music</option>
            <option value="STEM & Innovation">STEM & Innovation</option>
            <option value="Leadership & Service">Leadership & Service</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 hidden sm:block"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Learner</span>
        </button>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Learner Co-Curricular Portfolios ({filtered.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal tracking of talent areas, active roles, attendance reliability, and competition honors.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Learner Details</th>
                <th className="py-3 px-4">Activity / Academy</th>
                <th className="py-3 px-4">Role & Leadership</th>
                <th className="py-3 px-4">Talent Focus</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4">Parent Consent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{profile.studentName}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {profile.admissionNumber} · Grade {profile.grade} {profile.stream}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{profile.activityName}</div>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {profile.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      profile.role.includes('Captain') || profile.role.includes('President')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {profile.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {profile.talentStrengths.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                      profile.attendanceRate >= 90 ? 'bg-emerald-100 text-emerald-800' :
                      profile.attendanceRate >= 75 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {profile.attendanceRate}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {profile.parentConsentGiven ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={profile.registrationStatus}
                      onChange={(e) => handleStatusChange(profile.id, e.target.value as any)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
                        profile.registrationStatus === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        profile.registrationStatus === 'Approved' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                        profile.registrationStatus === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => {
                        setSelectedProfile(profile);
                        setPrintTranscriptMode(true);
                      }}
                      title="Print Official Co-Curricular Transcript"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold hidden md:inline">Transcript</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Transcript Modal */}
      {printTranscriptMode && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 my-8 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Official Learner Transcript Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 text-white font-black text-xs rounded-xl hover:bg-emerald-800 flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setPrintTranscriptMode(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="mt-6 p-6 border-2 border-emerald-800/40 rounded-2xl bg-white space-y-6">
              <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4">
                <EduSmartGadsaLogo variant="full" size="md" />
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Republic of Kenya · Ministry of Education
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600">
                    Competency-Based Curriculum (CBC) Co-Curricular Record
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Doc Ref: EDU-CCR-{selectedProfile.admissionNumber.replace(/\//g, '-')}-2026
                  </div>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Learner Name</span>
                  <div className="font-extrabold text-slate-900">{selectedProfile.studentName}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Admission Number</span>
                  <div className="font-mono font-bold text-slate-900">{selectedProfile.admissionNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Grade & Stream</span>
                  <div className="font-bold text-slate-900">Grade {selectedProfile.grade} {selectedProfile.stream}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Attendance Rate</span>
                  <div className="font-bold text-emerald-700">{selectedProfile.attendanceRate}% Certified</div>
                </div>
              </div>

              {/* Main Co-Curricular Record */}
              <div>
                <h4 className="font-black text-sm text-slate-900 border-b border-slate-200 pb-1 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Enrolled Academy & Leadership Position</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Activity / Team:</span>
                    <span className="font-bold text-slate-900">{selectedProfile.activityName} ({selectedProfile.category})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Leadership Assignment:</span>
                    <span className="font-bold text-emerald-800">{selectedProfile.role}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Identified Strengths & Talents:</span>
                    <span className="font-bold text-blue-700">{selectedProfile.talentStrengths.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Honors and Competitions */}
              <div>
                <h4 className="font-black text-sm text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Competitions & Accolades Earned</span>
                </h4>
                {selectedProfile.awardsEarned.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {selectedProfile.awardsEarned.map((a, i) => (
                      <li key={i} className="font-semibold">{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">Active team contributor in regular season tournaments.</p>
                )}
              </div>

              {/* Coach / Patron Remarks */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-900 block mb-1">Director of Sports & Patron Remarks:</span>
                <p className="text-slate-700 italic">{selectedProfile.coachNotes}</p>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-bold text-slate-900">Coach Benjamin Omwenga</div>
                  <div className="text-[10px] text-slate-500">Director of Sports & Activities</div>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <div className="font-bold text-slate-900">Dr. Arthur Mwangi, PhD</div>
                  <div className="text-[10px] text-slate-500">Head Teacher & Institutional Registrar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Learner Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <span>➕</span>
                <span>Enroll Learner in Co-Curricular Activity</span>
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Learner Full Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Brian Otieno"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Activity / Sport</label>
                <select
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name} ({a.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Position</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Member">Regular Member</option>
                    <option value="Team Captain">Team Captain</option>
                    <option value="Vice Captain">Vice Captain</option>
                    <option value="Club President">Club President</option>
                    <option value="Secretary">Secretary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Talent Strength</label>
                  <select
                    value={talent}
                    onChange={(e) => setTalent(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Football">Football</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Athletics">Athletics</option>
                    <option value="Swimming">Swimming</option>
                    <option value="Debate & Public Speaking">Debate & Public Speaking</option>
                    <option value="Robotics & STEM">Robotics & STEM</option>
                    <option value="Music & Instruments">Music & Instruments</option>
                    <option value="Drama & Acting">Drama & Acting</option>
                    <option value="Fine Art">Fine Art</option>
                    <option value="Chess">Chess</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-xs"
                >
                  Enroll Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
