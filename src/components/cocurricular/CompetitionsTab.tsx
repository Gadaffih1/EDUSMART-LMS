import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import { CoCurricularCompetition, CoCurricularActivity } from '../../types';

interface CompetitionsTabProps {
  competitions: CoCurricularCompetition[];
  activities: CoCurricularActivity[];
  onAddCompetition: (comp: CoCurricularCompetition) => void;
  onUpdateCompetition: (id: string, updates: Partial<CoCurricularCompetition>) => void;
  readOnly?: boolean;
}

export const CompetitionsTab: React.FC<CompetitionsTabProps> = ({
  competitions,
  activities,
  onAddCompetition,
  onUpdateCompetition,
  readOnly = false
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Upcoming' | 'Completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Competition Form State
  const [title, setTitle] = useState('');
  const [activityId, setActivityId] = useState(activities[0]?.id || '');
  const [category, setCategory] = useState('Junior Secondary / Regional League');
  const [date, setDate] = useState('2026-10-25');
  const [venue, setVenue] = useState('');
  const [host, setHost] = useState('');
  const [participatingSchools, setParticipatingSchools] = useState('EduSmart Academy, Nairobi Academy, Strathmore');
  const [coachAccompanying, setCoachAccompanying] = useState('Coach Benjamin Omwenga');
  const [status, setStatus] = useState<'Upcoming' | 'Completed'>('Upcoming');
  const [ourPosition, setOurPosition] = useState('Pending Tournament Fixture');
  const [scoreOrTime, setScoreOrTime] = useState('TBD');
  const [awards, setAwards] = useState('');
  const [report, setReport] = useState('');

  const filtered = competitions.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const act = activities.find(a => a.id === activityId);
    if (!title || !act) return;

    const newComp: CoCurricularCompetition = {
      id: `comp-${Date.now()}`,
      title,
      activityId: act.id,
      activityName: act.name,
      category,
      date,
      venue,
      host,
      participatingSchools: participatingSchools.split(',').map(s => s.trim()),
      ourPosition: status === 'Completed' ? ourPosition : 'Scheduled Match / Fixture',
      scoreOrTime,
      awards: awards ? awards.split(',').map(a => a.trim()) : [],
      coachAccompanying,
      status,
      report: report || 'Inter-school competition fixture logged in EduSmart.'
    };

    onAddCompetition(newComp);
    setShowAddModal(false);
    setTitle('');
    setVenue('');
    setReport('');
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
              placeholder="Search tournaments, events, hosts or venues..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setStatusFilter('Upcoming')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'Upcoming' ? 'bg-white shadow-2xs text-amber-700' : 'text-slate-500'
              }`}
            >
              Upcoming ({competitions.filter(c => c.status === 'Upcoming').length})
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'Completed' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500'
              }`}
            >
              Completed ({competitions.filter(c => c.status === 'Completed').length})
            </button>
          </div>
        </div>

        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Tournament / Fixture</span>
          </button>
        )}
      </div>

      {/* Competitions Cards */}
      <div className="space-y-4">
        {filtered.map((comp) => {
          const isCompleted = comp.status === 'Completed';

          return (
            <div
              key={comp.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
                isCompleted 
                  ? 'border-amber-200 hover:border-amber-300 bg-gradient-to-r from-white via-amber-50/10 to-white' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs ${
                    isCompleted ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCompleted ? '🏆' : '🗓️'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                        {comp.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {comp.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                      <span className="font-bold text-emerald-700">{comp.activityName}</span>
                      <span>Category: {comp.category}</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{comp.venue} (Host: {comp.host})</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700">📅 {comp.date}</span>
                    </div>
                  </div>
                </div>

                {/* Score / Position Badge */}
                <div className="text-left md:text-right">
                  <div className={`inline-block px-3 py-1.5 rounded-xl font-black text-xs ${
                    isCompleted 
                      ? 'bg-amber-100 text-amber-950 border border-amber-300' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {comp.ourPosition}
                  </div>
                  {comp.scoreOrTime && (
                    <div className="text-[11px] font-mono text-slate-500 mt-1 font-semibold">
                      {comp.scoreOrTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Tournament Details & Accompanying Staff */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Accompanying Coach:</span>
                  <div className="font-semibold text-slate-800">{comp.coachAccompanying}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Participating Schools:</span>
                  <div className="font-medium text-slate-600 line-clamp-1">
                    {comp.participatingSchools.join(', ')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Awards & Trophies:</span>
                  <div className="font-bold text-emerald-700">
                    {comp.awards?.length ? comp.awards.join(' · ') : 'Fixtures in preparation'}
                  </div>
                </div>
              </div>

              {/* Tournament Match Report */}
              {comp.report && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-0.5">Official Event & Tournament Report:</span>
                  {comp.report}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Tournament Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Create Tournament / Event Entry</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Competition / Tournament Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kenya National Drama & Music Festival"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Activity</label>
                  <select
                    value={activityId}
                    onChange={(e) => setActivityId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {activities.map((a) => (
                      <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                    placeholder="e.g. Nyayo National Stadium"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Host Organization</label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="e.g. Kenya Secondary Schools Sports Assoc"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accompanying Coach / Patron</label>
                <input
                  type="text"
                  required
                  value={coachAccompanying}
                  onChange={(e) => setCoachAccompanying(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Upcoming">Upcoming Fixture</option>
                    <option value="Completed">Completed Tournament</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Position / Outcome</label>
                  <input
                    type="text"
                    value={ourPosition}
                    onChange={(e) => setOurPosition(e.target.value)}
                    placeholder="e.g. 1st Place / Quarter Finals"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Summary / Report</label>
                <textarea
                  rows={2}
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Official tournament log notes, key scorers, and remarks..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
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
                  Log Competition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
