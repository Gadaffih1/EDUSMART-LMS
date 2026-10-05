import React from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Clock, 
  Medal, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { 
  CoCurricularActivity, 
  LearnerCoCurricularProfile, 
  CoCurricularCompetition, 
  CoCurricularTrip,
  CoCurricularAnnouncement 
} from '../../types';

interface DashboardTabProps {
  activities: CoCurricularActivity[];
  profiles: LearnerCoCurricularProfile[];
  competitions: CoCurricularCompetition[];
  trips: CoCurricularTrip[];
  announcements: CoCurricularAnnouncement[];
  onSelectTab: (tab: any) => void;
  onSelectActivity: (act: CoCurricularActivity) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  activities,
  profiles,
  competitions,
  trips,
  announcements,
  onSelectTab,
  onSelectActivity
}) => {
  const sportsCount = activities.filter(a => a.type === 'sport').length;
  const clubsCount = activities.filter(a => a.type === 'club').length;
  const uniqueLearnerIds = new Set(profiles.map(p => p.studentId)).size;
  const upcomingComps = competitions.filter(c => c.status === 'Upcoming');
  const completedComps = competitions.filter(c => c.status === 'Completed');
  const scheduledTrips = trips.filter(t => t.status === 'Scheduled');

  // Total medals/awards
  const totalAwards = competitions.reduce((acc, c) => acc + (c.awards?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EduSmart Holistic Talent & Activities Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Co-Curricular Command Center
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Nurturing 21st-century CBC competencies: athletics, competitive sports academies, national champion clubs, creative arts, and student talent portfolios.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSelectTab('competitions')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>Upcoming Fixtures ({upcomingComps.length})</span>
            </button>
            <button
              onClick={() => onSelectTab('attendance')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Take Attendance</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Registered Learners</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{uniqueLearnerIds}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Enrollments</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sports Teams</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{sportsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">U-11, U-13, Track & Pool</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Clubs & Societies</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{clubsCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Debate, STEM, Music, Arts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Competitions</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{upcomingComps.length}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Regional & County</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Awards & Trophies</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalAwards}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Trophies & Medals</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scheduled Tours</div>
          <div className="text-2xl font-black text-teal-600 mt-1">{scheduledTrips.length}</div>
          <div className="text-[10px] text-teal-700 font-semibold mt-1">EduSmart Transport</div>
        </div>
      </div>

      {/* Main Grid: Activities Today & Upcoming Tournaments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Activities Directory Quick View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>⚡</span>
              <span>Active Sports Academies & Clubs</span>
            </h3>
            <button
              onClick={() => onSelectTab('activities')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All ({activities.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activities.slice(0, 6).map((activity) => (
              <div 
                key={activity.id}
                onClick={() => onSelectActivity(activity)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1 bg-slate-50 rounded-lg">{activity.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {activity.name}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {activity.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activity.currentMembersCount}/{activity.maxParticipants}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">👤 {activity.patronName}</span>
                  <span className="text-emerald-600 font-bold">{activity.meetingDays.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Competition Achievements */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Medal className="w-4 h-4 text-amber-500" />
                <span>Recent Podium Finishes & Honors</span>
              </h3>
              <button
                onClick={() => onSelectTab('competitions')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                View Hall of Fame →
              </button>
            </div>

            <div className="space-y-2.5">
              {completedComps.slice(0, 3).map((comp) => (
                <div key={comp.id} className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-2xs">
                      🏆
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{comp.title}</div>
                      <div className="text-[11px] text-amber-900 font-medium">
                        {comp.ourPosition} · {comp.activityName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-white text-slate-700 font-mono text-[10px] font-bold rounded border border-amber-200">
                      {comp.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Broadcasts & Trips */}
        <div className="space-y-4">
          
          {/* Announcements Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>📢</span>
                <span>Co-Curricular Notices</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                Live
              </span>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      ann.priority === 'Urgent' ? 'bg-rose-100 text-rose-700' :
                      ann.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {ann.priority}
                    </span>
                    <span className="text-slate-400 font-mono">{ann.date}</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 leading-snug">{ann.title}</h5>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
                    {ann.message}
                  </p>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    Posted by: {ann.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External Trips & Transport Integration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>🚌</span>
                <span>Upcoming Team Excursions</span>
              </h3>
              <button
                onClick={() => onSelectTab('trips')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700"
              >
                Logistics →
              </button>
            </div>

            <div className="space-y-2.5">
              {scheduledTrips.slice(0, 2).map((trip) => (
                <div key={trip.id} className="p-3 rounded-xl border border-teal-200 bg-teal-50/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-950">{trip.activityName}</span>
                    <span className="font-mono text-[10px] font-bold text-teal-700">{trip.date}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-teal-600" />
                    <span>{trip.destination}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-teal-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Bus: <strong>{trip.busAllocated}</strong></span>
                    <span className="text-emerald-700 font-bold">Departs: {trip.departureTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
