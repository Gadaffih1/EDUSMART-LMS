import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Trophy,
  Edit2,
  CheckCircle2,
  X
} from 'lucide-react';
import { CoCurricularActivity, LearnerCoCurricularProfile, GradeLevel, CoCurricularCategory } from '../../types';

interface ActivitiesTabProps {
  activities: CoCurricularActivity[];
  profiles: LearnerCoCurricularProfile[];
  onAddActivity: (act: CoCurricularActivity) => void;
  onUpdateActivity: (id: string, updates: Partial<CoCurricularActivity>) => void;
  selectedActivity: CoCurricularActivity | null;
  onSelectActivity: (act: CoCurricularActivity | null) => void;
  readOnly?: boolean;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  activities,
  profiles,
  onAddActivity,
  onUpdateActivity,
  selectedActivity,
  onSelectActivity,
  readOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sport' | 'club'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for new activity
  const [name, setName] = useState('');
  const [type, setType] = useState<'sport' | 'club'>('sport');
  const [category, setCategory] = useState<CoCurricularCategory>('Sports');
  const [description, setDescription] = useState('');
  const [patronName, setPatronName] = useState('');
  const [patronPhone, setPatronPhone] = useState('+254 7');
  const [patronEmail, setPatronEmail] = useState('@edusmart.ac.ke');
  const [venue, setVenue] = useState('');
  const [meetingDays, setMeetingDays] = useState<string[]>(['Tuesday', 'Thursday']);
  const [meetingTime, setMeetingTime] = useState('04:00 PM - 05:15 PM');
  const [maxParticipants, setMaxParticipants] = useState<number>(35);
  const [icon, setIcon] = useState('⚽');

  const filtered = activities.filter(act => {
    const matchesSearch = act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          act.patronName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          act.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || act.type === typeFilter;
    const matchesCat = categoryFilter === 'all' || act.category === categoryFilter;
    return matchesSearch && matchesType && matchesCat;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !patronName || !venue) return;

    const newActivity: CoCurricularActivity = {
      id: `act-${Date.now()}`,
      name,
      type,
      category,
      description,
      patronName,
      patronPhone,
      patronEmail,
      venue,
      meetingDays,
      meetingTime,
      targetGrades: [3, 4, 5, 6, 7, 8, 9],
      maxParticipants: Number(maxParticipants) || 30,
      currentMembersCount: 0,
      status: 'Active',
      achievementsCount: 0,
      icon
    };

    onAddActivity(newActivity);
    setShowAddModal(false);
    // Reset
    setName('');
    setDescription('');
    setPatronName('');
    setVenue('');
  };

  const getRoster = (activityId: string) => {
    return profiles.filter(p => p.activityId === activityId);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sports academies, clubs, patrons or venues..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="sport">Sports Only</option>
            <option value="club">Clubs & Societies</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 hidden md:block"
          >
            <option value="all">All Categories</option>
            <option value="Sports">Sports</option>
            <option value="Clubs & Societies">Clubs & Societies</option>
            <option value="Creative Arts & Music">Creative Arts & Music</option>
            <option value="STEM & Innovation">STEM & Innovation</option>
            <option value="Leadership & Service">Leadership & Service</option>
          </select>
        </div>

        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Activity</span>
          </button>
        )}
      </div>

      {/* Grid of Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((activity) => {
          const roster = getRoster(activity.id);
          const isSelected = selectedActivity?.id === activity.id;

          return (
            <div
              key={activity.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isSelected 
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      {activity.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {activity.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          activity.type === 'sport' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {activity.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {activity.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {roster.length || activity.currentMembersCount}/{activity.maxParticipants}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                  {activity.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span>👤</span>
                      <span>Patron / Coach:</span>
                    </span>
                    <span className="font-bold text-slate-900">{activity.patronName}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Venue:</span>
                    </span>
                    <span className="font-medium text-slate-800">{activity.venue}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Schedule:</span>
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 font-bold">
                      {activity.meetingDays.join(', ')} · {activity.meetingTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectActivity(isSelected ? null : activity)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Close Member Roster' : `View Roster (${roster.length})`}</span>
                </button>

                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span>{activity.achievementsCount} Honors</span>
                </span>
              </div>

              {/* Collapsible Roster Panel */}
              {isSelected && (
                <div className="p-4 bg-emerald-50/40 border-t border-emerald-200 text-xs animate-in fade-in duration-200">
                  <div className="font-extrabold text-emerald-950 mb-2 flex items-center justify-between">
                    <span>Enrolled Learners ({roster.length})</span>
                    <span className="text-[10px] text-emerald-700">Official Roster</span>
                  </div>

                  {roster.length === 0 ? (
                    <div className="text-slate-400 italic py-2">No learners enrolled yet.</div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {roster.map((r) => (
                        <div key={r.id} className="p-2 bg-white rounded-lg border border-emerald-200/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{r.studentName}</span>
                            <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                              Gr {r.grade} {r.stream} · {r.admissionNumber}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <span>➕</span>
                <span>Register School Activity / Team</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. U-15 Volleyball Club"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    required
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="sport">Competitive Sport</option>
                    <option value="club">Club & Society</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Sports">Sports</option>
                    <option value="Clubs & Societies">Clubs & Societies</option>
                    <option value="Creative Arts & Music">Creative Arts & Music</option>
                    <option value="STEM & Innovation">STEM & Innovation</option>
                    <option value="Leadership & Service">Leadership & Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Objectives</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline syllabus, weekly drills, or national competition targets..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patron / Coach Name</label>
                  <input
                    type="text"
                    required
                    value={patronName}
                    onChange={(e) => setPatronName(e.target.value)}
                    placeholder="e.g. Coach Dennis Ochieng"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patron Phone</label>
                  <input
                    type="text"
                    value={patronPhone}
                    onChange={(e) => setPatronPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Main Pitch / STEM Lab"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-xs"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
