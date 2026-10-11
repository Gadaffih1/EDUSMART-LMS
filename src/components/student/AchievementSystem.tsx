import React, { useState, useEffect } from 'react';
import { User, LearnerBadge } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Printer, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  Zap, 
  Star, 
  RefreshCw, 
  ChevronRight,
  Filter,
  Check,
  Flame,
  TrendingUp,
  FileCheck2,
  FolderGit2
} from 'lucide-react';

interface AchievementSystemProps {
  currentUser: User;
  onOpenCertificate?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({ 
  currentUser,
  onOpenCertificate,
  onNavigateToTab 
}) => {
  const [badges, setBadges] = useState<LearnerBadge[]>(() => Storage.getBadges());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'attendance' | 'practical' | 'digital'>('all');
  const [newlyAwarded, setNewlyAwarded] = useState<LearnerBadge | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showActivitySimulator, setShowActivitySimulator] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Evaluate badges on mount
  useEffect(() => {
    evaluateBadges();
  }, [currentUser]);

  const evaluateBadges = () => {
    setEvaluating(true);
    setTimeout(() => {
      const result = Storage.evaluateBadgesForStudent(currentUser);
      setBadges([...result.allBadges]);
      setEvaluating(false);

      if (result.newlyUnlocked.length > 0) {
        setNewlyAwarded(result.newlyUnlocked[0]);
        setShowCelebration(true);
      }
    }, 400);
  };

  const totalXP = badges.filter(b => b.unlocked).reduce((sum, b) => sum + b.xpPoints, 0);
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;

  // Filtered badges
  const filteredBadges = selectedCategory === 'all'
    ? badges
    : badges.filter(b => b.category === selectedCategory);

  // Get badge icon
  const getBadgeIcon = (iconName: string, unlocked: boolean) => {
    const iconClass = `w-7 h-7 ${unlocked ? 'drop-shadow-xs' : 'text-slate-400'}`;
    switch (iconName) {
      case 'Trophy':
        return <Trophy className={`${iconClass} ${unlocked ? 'text-amber-500' : ''}`} />;
      case 'Clock':
        return <Clock className={`${iconClass} ${unlocked ? 'text-blue-500' : ''}`} />;
      case 'BookOpen':
        return <BookOpen className={`${iconClass} ${unlocked ? 'text-emerald-500' : ''}`} />;
      case 'ShieldCheck':
        return <ShieldCheck className={`${iconClass} ${unlocked ? 'text-purple-500' : ''}`} />;
      case 'Sparkles':
        return <Sparkles className={`${iconClass} ${unlocked ? 'text-rose-500' : ''}`} />;
      case 'Zap':
        return <Zap className={`${iconClass} ${unlocked ? 'text-yellow-500' : ''}`} />;
      case 'Star':
        return <Star className={`${iconClass} ${unlocked ? 'text-cyan-500' : ''}`} />;
      case 'Award':
      default:
        return <Award className={`${iconClass} ${unlocked ? 'text-indigo-500' : ''}`} />;
    }
  };

  // Activity simulator actions for quick interactive demonstration
  const handleSimulatePerfectQuiz = () => {
    const newAttempt = {
      id: `attempt-sim-${Date.now()}`,
      quizId: 'quiz-math-g4-01',
      quizTitle: 'Fractions & Decimals Master Assessment',
      subject: 'Mathematics' as const,
      grade: currentUser.grade || 4,
      studentId: currentUser.id,
      studentName: currentUser.name,
      stream: currentUser.stream || 'Dove',
      score: 10,
      totalQuestions: 10,
      percentage: 100,
      passed: true,
      userAnswers: {},
      completedAt: new Date().toISOString().split('T')[0]
    };
    Storage.saveQuizAttempt(newAttempt);
    setToastMessage('Perfect 100% quiz attempt logged! Evaluating badges...');
    evaluateBadges();
  };

  const handleSimulateResourceExplore = () => {
    const randId = `resource-sim-${Date.now()}`;
    Storage.recordResourceView(currentUser.id, randId);
    setToastMessage('Curriculum lesson note studied! Evaluating badges...');
    evaluateBadges();
  };

  const handleSimulatePortfolioUpload = () => {
    Storage.addPortfolioItem({
      id: `pf-sim-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      grade: currentUser.grade || 4,
      subject: 'Creative Arts',
      title: 'Traditional Beaded Bracelet Project',
      learningStrand: 'Indigenous Crafts',
      category: 'Creative Arts & Craft',
      description: 'Handcrafted traditional pattern artifact using organic sisal and wooden beads.',
      reflection: 'Practiced geometric symmetry and indigenous weaving traditions.',
      teacherFeedback: 'Outstanding application of geometric symmetry. Exceeding Expectations.',
      competencyLevel: 'Exceeding Expectations',
      awardedPoints: 25,
      createdAt: new Date().toISOString().split('T')[0]
    });
    setToastMessage('E-Portfolio practical artifact uploaded! Evaluating badges...');
    evaluateBadges();
  };

  // Next badge to unlock
  const nextBadge = badges.find(b => !b.unlocked);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Banner: Student Achievement Console */}
      <div className="bg-gradient-to-r from-amber-600 via-emerald-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-200">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Student Achievement & Digital Badging System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Honors & Competency Badges
          </h2>
          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
            Digital badges are automatically awarded based on your continuous learning activities — scoring high in topical quizzes, maintaining flawless attendance, exploring curriculum resources, and uploading portfolio practicals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCertificate(true)}
              className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Official CBC Certificate</span>
            </button>
            <button
              onClick={evaluateBadges}
              disabled={evaluating}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl border border-white/30 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
              <span>{evaluating ? 'Evaluating...' : 'Check Activity & Award'}</span>
            </button>
          </div>
        </div>

        {/* Level, XP Capsule & Circular Progress */}
        <div className="bg-white/15 backdrop-blur-md p-5 rounded-2xl border border-white/30 text-center shrink-0 min-w-[240px] space-y-3 z-10">
          <div className="flex items-center justify-between text-xs text-amber-200 font-bold uppercase tracking-wider">
            <span>Current Rank</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Level {currentLevel}</span>
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentLevel === 1 ? 'Apprentice Scholar' : currentLevel === 2 ? 'Active Explorer' : currentLevel === 3 ? 'Distinguished Scholar' : 'Master Academician'}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-200">
              <span>{totalXP} Total BP</span>
              <span>{xpInCurrentLevel}/100 BP</span>
            </div>
            <div className="w-full bg-black/25 h-2.5 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-300 to-emerald-300 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, xpInCurrentLevel))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-200 font-mono text-right">
              {100 - xpInCurrentLevel} BP to Level {currentLevel + 1}
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 flex items-center justify-around text-xs">
            <div>
              <div className="font-extrabold text-base text-white">{unlockedCount}</div>
              <div className="text-[10px] text-slate-200">Badges Won</div>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <div className="font-extrabold text-base text-white">{badges.length - unlockedCount}</div>
              <div className="text-[10px] text-slate-200">In Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Quick Simulator & Info Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Automatic Activity-Based Badge Awards
            </h3>
            <p className="text-xs text-slate-500">
              Completing regular school tasks triggers real-time badge evaluations and awards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowActivitySimulator(!showActivitySimulator)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{showActivitySimulator ? 'Hide Activity Simulators' : 'Test Award Triggers'}</span>
          </button>
        </div>
      </div>

      {/* Simulator Drawer */}
      {showActivitySimulator && (
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Simulate Learner Activity to Trigger Instant Badging</span>
            </div>
            <span className="text-[11px] text-slate-500">Live storage verification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleSimulatePerfectQuiz}
              className="p-3 bg-white hover:bg-amber-50/50 rounded-xl border border-slate-200 text-left transition-colors space-y-1 shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-amber-800">
                <span>1. Submit 100% Quiz</span>
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[11px] text-slate-500">Awards 'Top Scorer' badge (+150 BP)</p>
            </button>

            <button
              onClick={handleSimulateResourceExplore}
              className="p-3 bg-white hover:bg-emerald-50/50 rounded-xl border border-slate-200 text-left transition-colors space-y-1 shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                <span>2. Study Curriculum Resource</span>
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">Awards 'Resource Explorer' badge (+120 BP)</p>
            </button>

            <button
              onClick={handleSimulatePortfolioUpload}
              className="p-3 bg-white hover:bg-purple-50/50 rounded-xl border border-slate-200 text-left transition-colors space-y-1 shadow-2xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-purple-800">
                <span>3. Upload Portfolio Project</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-[11px] text-slate-500">Awards 'Portfolio Artisan' badge (+130 BP)</p>
            </button>
          </div>
        </div>
      )}

      {/* Next Target In Focus */}
      {nextBadge && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs shrink-0">
              {getBadgeIcon(nextBadge.iconName, false)}
            </div>
            <div>
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Next Target in Progress</div>
              <h4 className="text-sm font-extrabold text-slate-900">{nextBadge.title} (+{nextBadge.xpPoints} BP)</h4>
              <p className="text-xs text-slate-600 mt-0.5">{nextBadge.activityCriteria || nextBadge.description}</p>
            </div>
          </div>

          <div className="min-w-[180px] space-y-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
              <span>Progress</span>
              <span>{nextBadge.currentProgress || 0}/{nextBadge.targetProgress || 1} {nextBadge.progressMetric || ''}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ 
                  width: `${Math.min(100, Math.round(((nextBadge.currentProgress || 0) / (nextBadge.targetProgress || 1)) * 100))}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Badges ({badges.length})
          </button>
          <button
            onClick={() => setSelectedCategory('academic')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedCategory === 'academic'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Academic (Top Scorer & Subjects)
          </button>
          <button
            onClick={() => setSelectedCategory('attendance')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedCategory === 'attendance'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Attendance & Discipline
          </button>
          <button
            onClick={() => setSelectedCategory('practical')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedCategory === 'practical'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            E-Portfolio & Practicals
          </button>
          <button
            onClick={() => setSelectedCategory('digital')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedCategory === 'digital'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Digital Safety & Ethics
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredBadges.length} of {badges.length} badges
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const isUnlocked = badge.unlocked;
          const progressPercent = badge.targetProgress
            ? Math.min(100, Math.round(((badge.currentProgress || 0) / badge.targetProgress) * 100))
            : (isUnlocked ? 100 : 0);

          return (
            <div
              key={badge.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                isUnlocked
                  ? 'bg-white border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md ring-1 ring-slate-100'
                  : 'bg-slate-50/70 border-dashed border-slate-300 opacity-80'
              }`}
            >
              {/* Highlight ribbon for top badges */}
              {badge.id === 'bdg-top-scorer' && isUnlocked && (
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-1 rotate-12">
                  <span className="bg-amber-500 text-white font-bold text-[9px] uppercase px-3 py-0.5 rounded shadow-2xs">
                    Distinction
                  </span>
                </div>
              )}

              <div>
                {/* Header: Icon & XP */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                    isUnlocked 
                      ? 'bg-gradient-to-tr from-amber-50 to-amber-100/70 border border-amber-200 shadow-2xs' 
                      : 'bg-slate-200/80 text-slate-400'
                  }`}>
                    {getBadgeIcon(badge.iconName, isUnlocked)}
                  </div>

                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase ${
                      isUnlocked 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      +{badge.xpPoints} BP
                    </span>
                    {badge.dateUnlocked && (
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Unlocked {badge.dateUnlocked}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-extrabold text-slate-900 text-base tracking-tight mb-1 flex items-center gap-1.5">
                  <span>{badge.title}</span>
                  {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {badge.description}
                </p>

                {/* Activity Criteria Box */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <Check className="w-3 h-3 text-slate-500" />
                    <span>Activity Requirement:</span>
                  </div>
                  <div className="text-slate-600 leading-tight">
                    {badge.activityCriteria || badge.description}
                  </div>
                </div>
              </div>

              {/* Progress & Unlock Status */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] font-medium capitalize">
                    {badge.category} Strand
                  </span>
                  <span className="font-mono font-bold text-[11px] text-slate-700">
                    {badge.targetProgress 
                      ? `${badge.currentProgress || 0}/${badge.targetProgress} ${badge.progressMetric || ''}`
                      : (isUnlocked ? '100% Achieved' : 'Pending')}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    isUnlocked ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Awarded</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </>
                    )}
                  </span>

                  {!isUnlocked && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {100 - progressPercent}% remaining
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Celebratory Badge Unlock Modal */}
      {showCelebration && newlyAwarded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-4 border-amber-400 p-8 text-center space-y-5 relative overflow-hidden">
            {/* Background Ray Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />

            <div className="text-5xl animate-bounce">🎉 🏆 ✨</div>

            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 text-amber-700 mx-auto flex items-center justify-center shadow-lg">
              {getBadgeIcon(newlyAwarded.iconName, true)}
            </div>

            <div>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                New Achievement Unlocked!
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {newlyAwarded.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-xs mx-auto leading-relaxed">
                {newlyAwarded.description}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 inline-block font-mono font-bold text-emerald-800 text-sm">
              +{newlyAwarded.xpPoints} Certification Bonus Points (BP) Added
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Claim Badge & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-amber-400 p-8 sm:p-10 relative overflow-hidden text-center space-y-6">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-2 text-sm"
            >
              ✕
            </button>

            {/* Official School Seal & Logo */}
            <div className="flex justify-center mb-1">
              <EduSmartGadsaLogo variant="full" size="md" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                Republic of Kenya · Competency-Based Curriculum
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Certificate of Academic Excellence
              </h2>
              <p className="text-xs text-slate-500">
                Official recognition of verified competency milestones, topical mastery, and exemplary digital citizenship.
              </p>
            </div>

            <div className="py-2 border-y-2 border-slate-200">
              <div className="text-xs text-slate-400 uppercase font-semibold">Awarded To</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight my-1">
                {currentUser.name}
              </div>
              <div className="text-xs font-mono text-slate-600">
                Grade {currentUser.grade || 4} · Stream {currentUser.stream || 'Dove'} · Admission: {currentUser.admissionNumber || 'ADM/2026/0412'}
              </div>
            </div>

            <div className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              In formal certification of achieving <strong>{totalXP} Certification Points</strong> across <strong>{unlockedCount} Verified Competency Badges</strong>, including <em>Top Scorer</em> in topical assessments, <em>Perfect Attendance</em> in daily roll call, and <em>Resource Explorer</em> in CBC digital curriculum resources.
            </div>

            {/* Earned Badges Showcase on Certificate */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-wrap items-center justify-center gap-2">
              {badges.filter(b => b.unlocked).map(b => (
                <span key={b.id} className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[10px] font-bold text-amber-900 shadow-2xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{b.title}</span>
                </span>
              ))}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="font-serif italic text-base text-slate-800">Dr. Arthur Mwangi</div>
                <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 uppercase font-semibold">
                  Head Teacher / Principal
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-serif italic text-base text-slate-800">Ms. Beatrice Wanjiku</div>
                <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 uppercase font-semibold">
                  Dean of Studies
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
