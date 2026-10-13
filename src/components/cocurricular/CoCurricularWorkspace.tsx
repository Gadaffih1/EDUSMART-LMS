import React, { useState, useEffect } from 'react';
import { 
  User, 
  CoCurricularActivity, 
  LearnerCoCurricularProfile, 
  CoCurricularAttendanceRecord, 
  CoCurricularCompetition, 
  CoCurricularEquipment, 
  CoCurricularTrip, 
  CoCurricularAnnouncement, 
  CoCurricularBudgetItem,
  SchoolBus 
} from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { DashboardTab } from './DashboardTab';
import { ActivitiesTab } from './ActivitiesTab';
import { LearnerPortfolioTab } from './LearnerPortfolioTab';
import { AttendanceTab } from './AttendanceTab';
import { CompetitionsTab } from './CompetitionsTab';
import { TripsTab } from './TripsTab';
import { EquipmentBudgetTab } from './EquipmentBudgetTab';
import { ReportsTab } from './ReportsTab';
import { 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  Package, 
  DollarSign, 
  FileText, 
  Compass, 
  Sparkles, 
  LogOut,
  Bell,
  Menu,
  X,
  Eye
} from 'lucide-react';

interface CoCurricularWorkspaceProps {
  currentUser: User;
  onLogout?: () => void;
  isEmbedded?: boolean;
  readOnly?: boolean;
}

export type CoCurricularTab = 
  | 'dashboard' 
  | 'activities' 
  | 'portfolio' 
  | 'attendance' 
  | 'competitions' 
  | 'trips' 
  | 'equipment_budget' 
  | 'reports';

export const CoCurricularWorkspace: React.FC<CoCurricularWorkspaceProps> = ({
  currentUser,
  onLogout,
  isEmbedded = false,
  readOnly
}) => {
  const [activeTab, setActiveTab] = useState<CoCurricularTab>('dashboard');

  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab) {
        if (['dashboard', 'activities', 'portfolio', 'attendance', 'competitions', 'trips', 'equipment_budget', 'reports'].includes(tab)) {
          setActiveTab(tab as CoCurricularTab);
        } else if (tab === 'log-attendance') {
          setActiveTab('attendance');
        } else if (tab === 'submit-report') {
          setActiveTab('reports');
        }
      }
    };
    window.addEventListener('workspace-nav-tab', handleNavEvent);
    return () => window.removeEventListener('workspace-nav-tab', handleNavEvent);
  }, []);

  const isExecutiveOrAdmin = ['head_teacher', 'deputy_head', 'dean_of_studies', 'senior_teacher', 'hod', 'school_admin_staff', 'admin'].includes(currentUser.role);
  const isReadOnly = readOnly !== undefined ? readOnly : (currentUser.role !== 'cocurricular_team' || isExecutiveOrAdmin);

  // State from Storage
  const [activities, setActivities] = useState<CoCurricularActivity[]>(() => Storage.getCoCurricularActivities());
  const [profiles, setProfiles] = useState<LearnerCoCurricularProfile[]>(() => Storage.getLearnerCoCurricularProfiles());
  const [attendance, setAttendance] = useState<CoCurricularAttendanceRecord[]>(() => Storage.getCoCurricularAttendance());
  const [competitions, setCompetitions] = useState<CoCurricularCompetition[]>(() => Storage.getCoCurricularCompetitions());
  const [equipment, setEquipment] = useState<CoCurricularEquipment[]>(() => Storage.getCoCurricularEquipment());
  const [trips, setTrips] = useState<CoCurricularTrip[]>(() => Storage.getCoCurricularTrips());
  const [announcements, setAnnouncements] = useState<CoCurricularAnnouncement[]>(() => Storage.getCoCurricularAnnouncements());
  const [budgets, setBudgets] = useState<CoCurricularBudgetItem[]>(() => Storage.getCoCurricularBudgets());
  const [buses, setBuses] = useState<SchoolBus[]>(() => Storage.getSchoolBuses());

  const [selectedActivity, setSelectedActivity] = useState<CoCurricularActivity | null>(null);

  // Sync with storage events
  useEffect(() => {
    const handleActivities = () => setActivities(Storage.getCoCurricularActivities());
    const handleProfiles = () => setProfiles(Storage.getLearnerCoCurricularProfiles());
    const handleAttendance = () => setAttendance(Storage.getCoCurricularAttendance());
    const handleCompetitions = () => setCompetitions(Storage.getCoCurricularCompetitions());
    const handleEquipment = () => setEquipment(Storage.getCoCurricularEquipment());
    const handleTrips = () => setTrips(Storage.getCoCurricularTrips());
    const handleAnnouncements = () => setAnnouncements(Storage.getCoCurricularAnnouncements());
    const handleBudgets = () => setBudgets(Storage.getCoCurricularBudgets());

    window.addEventListener('cocurricular-activities-updated', handleActivities);
    window.addEventListener('cocurricular-profiles-updated', handleProfiles);
    window.addEventListener('cocurricular-attendance-updated', handleAttendance);
    window.addEventListener('cocurricular-competitions-updated', handleCompetitions);
    window.addEventListener('cocurricular-equipment-updated', handleEquipment);
    window.addEventListener('cocurricular-trips-updated', handleTrips);
    window.addEventListener('cocurricular-announcements-updated', handleAnnouncements);
    window.addEventListener('cocurricular-budget-updated', handleBudgets);

    return () => {
      window.removeEventListener('cocurricular-activities-updated', handleActivities);
      window.removeEventListener('cocurricular-profiles-updated', handleProfiles);
      window.removeEventListener('cocurricular-attendance-updated', handleAttendance);
      window.removeEventListener('cocurricular-competitions-updated', handleCompetitions);
      window.removeEventListener('cocurricular-equipment-updated', handleEquipment);
      window.removeEventListener('cocurricular-trips-updated', handleTrips);
      window.removeEventListener('cocurricular-announcements-updated', handleAnnouncements);
      window.removeEventListener('cocurricular-budget-updated', handleBudgets);
    };
  }, []);

  // Handlers for storage modifications
  const handleAddActivity = (act: CoCurricularActivity) => {
    Storage.addCoCurricularActivity(act);
    setActivities(Storage.getCoCurricularActivities());
  };

  const handleUpdateActivity = (id: string, updates: Partial<CoCurricularActivity>) => {
    Storage.updateCoCurricularActivity(id, updates);
    setActivities(Storage.getCoCurricularActivities());
  };

  const handleAddProfile = (p: LearnerCoCurricularProfile) => {
    Storage.addLearnerCoCurricularProfile(p);
    setProfiles(Storage.getLearnerCoCurricularProfiles());
  };

  const handleUpdateProfile = (id: string, updates: Partial<LearnerCoCurricularProfile>) => {
    Storage.updateLearnerCoCurricularProfile(id, updates);
    setProfiles(Storage.getLearnerCoCurricularProfiles());
  };

  const handleDeleteProfile = (id: string) => {
    Storage.deleteLearnerCoCurricularProfile(id);
    setProfiles(Storage.getLearnerCoCurricularProfiles());
  };

  const handleSaveAttendance = (records: CoCurricularAttendanceRecord[]) => {
    Storage.addCoCurricularAttendanceRecords(records);
    setAttendance(Storage.getCoCurricularAttendance());
  };

  const handleAddCompetition = (comp: CoCurricularCompetition) => {
    Storage.addCoCurricularCompetition(comp);
    setCompetitions(Storage.getCoCurricularCompetitions());
  };

  const handleUpdateCompetition = (id: string, updates: Partial<CoCurricularCompetition>) => {
    Storage.updateCoCurricularCompetition(id, updates);
    setCompetitions(Storage.getCoCurricularCompetitions());
  };

  const handleAddTrip = (trip: CoCurricularTrip) => {
    Storage.addCoCurricularTrip(trip);
    setTrips(Storage.getCoCurricularTrips());
  };

  const handleUpdateTrip = (id: string, updates: Partial<CoCurricularTrip>) => {
    Storage.updateCoCurricularTrip(id, updates);
    setTrips(Storage.getCoCurricularTrips());
  };

  const handleAddEquipment = (item: CoCurricularEquipment) => {
    Storage.addCoCurricularEquipment(item);
    setEquipment(Storage.getCoCurricularEquipment());
  };

  const handleAddBudget = (item: CoCurricularBudgetItem) => {
    Storage.addCoCurricularBudgetItem(item);
    setBudgets(Storage.getCoCurricularBudgets());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      {!isEmbedded && (
        <header className="bg-slate-900 border-b border-slate-800 text-white relative lg:sticky lg:top-16 z-20 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl shadow-2xs">
                <EduSmartGadsaLogo variant="horizontal" size="sm" />
              </div>
              <div className="hidden sm:block border-l border-slate-700 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 uppercase tracking-wider">
                    🎯 Co-Curriculum Hub
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    Sports, Clubs & CBC Talent Development
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="font-bold text-xs text-white flex items-center gap-1.5 justify-end">
                  <span>{currentUser.name}</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  {currentUser.designation || 'Director of Sports & Activities'}
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>⚡</span>
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Sports & Clubs ({activities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learner Portfolios ({profiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Session Roll Call</span>
            </button>

            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'competitions'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🏆</span>
              <span>Competitions ({competitions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'trips'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tours & Trips ({trips.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('equipment_budget')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'equipment_budget'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Gear & Budget</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Official Reports</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Read-Only Surveillance Notice for Executive Leadership and Admin Staff */}
        {isReadOnly && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-purple-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <div className="font-bold text-purple-900 flex items-center gap-2">
                  <span>Read-Only Co-Curriculum & Sports Surveillance</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                    No Editing Rights
                  </span>
                </div>
                <div className="text-[11px] text-purple-800 mt-0.5">
                  Accessible with no editing rights to Executive Leadership and Administration Staff ({currentUser.name}). Activity schedules, team rosters, and roll call registers are maintained by the Co-Curricular Team & Patrons.
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono font-bold text-purple-800 bg-white/80 border border-purple-200 px-2.5 py-1 rounded-lg shrink-0">
              ACTIVITIES AUDIT MODE
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            activities={activities}
            profiles={profiles}
            competitions={competitions}
            trips={trips}
            announcements={announcements}
            onSelectTab={setActiveTab}
            onSelectActivity={(act) => {
              setSelectedActivity(act);
              setActiveTab('activities');
            }}
          />
        )}

        {activeTab === 'activities' && (
          <ActivitiesTab
            activities={activities}
            profiles={profiles}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            selectedActivity={selectedActivity}
            onSelectActivity={setSelectedActivity}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'portfolio' && (
          <LearnerPortfolioTab
            profiles={profiles}
            activities={activities}
            onAddProfile={handleAddProfile}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            activities={activities}
            profiles={profiles}
            attendanceRecords={attendance}
            onSaveAttendance={handleSaveAttendance}
            currentUser={currentUser}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'competitions' && (
          <CompetitionsTab
            competitions={competitions}
            activities={activities}
            onAddCompetition={handleAddCompetition}
            onUpdateCompetition={handleUpdateCompetition}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'trips' && (
          <TripsTab
            trips={trips}
            activities={activities}
            buses={buses}
            onAddTrip={handleAddTrip}
            onUpdateTrip={handleUpdateTrip}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'equipment_budget' && (
          <EquipmentBudgetTab
            equipment={equipment}
            budgets={budgets}
            activities={activities}
            onAddEquipment={handleAddEquipment}
            onAddBudget={handleAddBudget}
            readOnly={isReadOnly}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            activities={activities}
            profiles={profiles}
            competitions={competitions}
            attendance={attendance}
          />
        )}
      </main>

    </div>
  );
};
