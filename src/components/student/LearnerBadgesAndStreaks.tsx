import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Trophy, 
  Award, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Star, 
  TrendingUp, 
  ChevronRight, 
  Lock, 
  Calendar, 
  HelpCircle, 
  Play, 
  RefreshCw,
  Gift,
  Target,
  BarChart3,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { User, LearnerStreakInfo, QuizAttempt, LearnerBadge } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface LearnerBadgesAndStreaksProps {
  currentUser: User;
  onLaunchQuiz?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LearnerBadgesAndStreaks: React.FC<LearnerBadgesAndStreaksProps> = ({
  currentUser,
  onLaunchQuiz,
  onNavigateToTab
}) => {
  // Load streak state from Storage
  const [streakInfo, setStreakInfo] = useState<LearnerStreakInfo>(() => 
    Storage.getLearnerStreakInfo(currentUser.id)
  );
  const [allBadges, setAllBadges] = useState<LearnerBadge[]>(() => Storage.getBadges());
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => 
    Storage.getQuizAttempts(currentUser.id)
  );

  const [claimedRewardId, setClaimedRewardId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Sync state if quiz attempts or badges change
  useEffect(() => {
    const refreshData = () => {
      setStreakInfo(Storage.getLearnerStreakInfo(currentUser.id));
      setAllBadges(Storage.getBadges());
      setQuizAttempts(Storage.getQuizAttempts(currentUser.id));
    };
    window.addEventListener('quiz-attempt-saved', refreshData);
    window.addEventListener('badge-unlocked', refreshData);
    return () => {
      window.removeEventListener('quiz-attempt-saved', refreshData);
      window.removeEventListener('badge-unlocked', refreshData);
    };
  }, [currentUser.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick Daily Quiz Check-in Simulator
  const handleQuickQuizCheckin = () => {
    setSimulating(true);
    setTimeout(() => {
      // Create a simulated high-score quiz attempt for today to illustrate streak increase
      const newAttempt: QuizAttempt = {
        id: `att-sim-${Date.now()}`,
        quizId: 'quiz-sim-math',
        quizTitle: 'Topical Fractions & Proportions Mastery',
        subject: 'Mathematics',
        studentId: currentUser.id,
        studentName: currentUser.name,
        grade: currentUser.grade || 4,
        stream: currentUser.stream || 'Dove',
        score: 5,
        totalQuestions: 5,
        percentage: 100,
        passed: true,
        userAnswers: { 'q-1': 0, 'q-2': 1, 'q-3': 0, 'q-4': 2, 'q-5': 3 },
        completedAt: new Date().toISOString()
      };

      Storage.saveQuizAttempt(newAttempt);
      Storage.evaluateBadgesForStudent(currentUser);
      
      const updatedStreak = Storage.getLearnerStreakInfo(currentUser.id);
      setStreakInfo(updatedStreak);
      setQuizAttempts(Storage.getQuizAttempts(currentUser.id));
      setAllBadges(Storage.getBadges());
      setSimulating(false);
      showToast('🔥 Daily Quiz Check-in recorded! Streak progressed & Bonus Points (BP) multiplied.');
    }, 500);
  };

  // Claim Milestone Reward
  const handleClaimReward = (milestoneId: string, badgeReward: string) => {
    setClaimedRewardId(milestoneId);
    showToast(`🎉 Reward Claimed: ${badgeReward}! Added to your CBC portfolio.`);
  };

  // Render milestone icon
  const getMilestoneIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-purple-500" />;
      case 'Award':
      default:
        return <Award className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Streak & Milestone Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                <span>Daily Quiz Rhythm & Streaks Matrix</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-300/30">
                {streakInfo.multiplier}x Active Bonus Points (BP) Multiplier
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Learner Badges & Streaks</span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-white/20 text-amber-100 border border-white/30">
                {streakInfo.currentTier}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-amber-50/90 leading-relaxed">
              Consistently complete topical quizzes to power your daily streak, unlock tiered achievement badges, and climb from Novice to Grandmaster Trailblazer.
            </p>
          </div>

          {/* Quick Streak Scoreboard Capsule */}
          <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/25 text-center shrink-0 min-w-[220px] space-y-2">
            <div className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">
              Current Active Streak
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-8 h-8 text-amber-300 fill-amber-300 animate-pulse" />
              <div className="text-3xl sm:text-4xl font-black text-white">
                {streakInfo.currentStreakDays} <span className="text-sm font-medium">Days</span>
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold text-amber-100 flex items-center justify-center gap-2">
              <span>Best Record: {streakInfo.longestStreakDays} Days</span>
              <span>·</span>
              <span>{streakInfo.freezeShieldsAvailable} 🛡️ Shields</span>
            </div>

            <button
              onClick={handleQuickQuizCheckin}
              disabled={simulating}
              className="w-full mt-2 py-2 bg-white text-slate-900 hover:bg-amber-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {simulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
              ) : (
                <Play className="w-3.5 h-3.5 text-orange-600 fill-orange-600" />
              )}
              <span>{simulating ? 'Recording Quiz...' : 'Daily Quiz Check-in (+BP)'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            VISUAL PROGRESS BAR TO NEXT TIER
            ======================================================== */}
        <div className="mt-6 pt-5 border-t border-white/15 space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-amber-200 uppercase tracking-wider text-[11px]">Academic Rank Milestone:</span>
              <span className="text-white font-extrabold">{streakInfo.currentTier}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/50" />
              <span className="text-amber-300">{streakInfo.nextTier}</span>
            </div>

            <div className="font-mono text-amber-200">
              {streakInfo.progressToNextTierPercent}% Completed · {streakInfo.pointsToNextTier} pts to Level Up
            </div>
          </div>

          {/* Visual Milestone Progress Bar Track */}
          <div className="relative w-full bg-black/30 h-4 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.max(streakInfo.progressToNextTierPercent, 8)}%` }}
            />
          </div>

          {/* Milestone Step Ticks */}
          <div className="grid grid-cols-4 text-center text-[10px] font-bold text-white/80 pt-0.5">
            <div className="text-left">Beginner 0%</div>
            <div>Quarter 25%</div>
            <div>Advanced 50%</div>
            <div className="text-right text-amber-200">Next Tier: {streakInfo.nextTier} 100%</div>
          </div>
        </div>
      </div>

      {/* Weekly 7-Day Consistency Tracker & Quiz Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 7-Day Visual Rhythm Strip */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <h3 className="font-black text-sm text-slate-900">7-Day Quiz Participation Consistency</h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Week of {streakInfo.weeklyActivity[0]?.date || 'This Week'}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {streakInfo.weeklyActivity.map((day, idx) => (
              <div 
                key={idx}
                className={`rounded-xl p-3 text-center border-2 transition-all flex flex-col items-center justify-between gap-1.5 ${
                  day.completed
                    ? 'bg-orange-50/70 border-orange-400 text-orange-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider">{day.day}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  {day.completed ? (
                    <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <span className="text-[10px] font-bold font-mono">
                  {day.completed ? `${day.quizzesCount || 1} Quiz` : 'Rest'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Streak Freeze Safeguards: <strong>{streakInfo.freezeShieldsAvailable} Available</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">
              Take at least 1 quiz every day to maintain multiplier bonus.
            </div>
          </div>
        </div>

        {/* Academic Participation Metrics */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">Academic Progress</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              Quiz Records
            </span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Total Quizzes Submitted:</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {streakInfo.totalQuizzesCompleted} Quizzes
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Average Quiz Distinction:</span>
              <span className="text-sm font-black text-emerald-600 font-mono">
                {streakInfo.averageQuizScore}% Mark
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Earned Badges Count:</span>
              <span className="text-sm font-black text-amber-600 font-mono">
                {allBadges.filter(b => b.unlocked).length} of {allBadges.length} Badges
              </span>
            </div>
          </div>

          {onLaunchQuiz && (
            <button
              onClick={onLaunchQuiz}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Next CBC Topical Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          ACADEMIC MILESTONES WITH VISUAL PROGRESS BARS
          ======================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <Target className="w-4 h-4 text-orange-500" />
              <span>Progress Milestones & Achievement Trackers</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Active Milestones & Reward Badges
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete defined quiz frequency targets and distinction scores to claim exclusive badge rewards.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {streakInfo.milestones.filter(m => m.achieved).length} of {streakInfo.milestones.length} Completed
            </span>
          </div>
        </div>

        {/* Milestone Cards with Visual Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streakInfo.milestones.map((milestone) => {
            const percent = Math.min(100, Math.round((milestone.current / milestone.target) * 100));
            const isClaimed = claimedRewardId === milestone.id;

            return (
              <div
                key={milestone.id}
                className={`rounded-2xl p-5 border-2 transition-all space-y-3.5 ${
                  milestone.achieved
                    ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
                      milestone.achieved ? 'bg-amber-100 border border-amber-300' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {getMilestoneIcon(milestone.icon)}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{milestone.title}</h4>
                      <p className="text-xs text-slate-500 leading-snug">{milestone.description}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                    milestone.achieved
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {milestone.achieved ? '✓ Achieved' : 'In Progress'}
                  </span>
                </div>

                {/* Individual Milestone Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">
                      Progress: {milestone.current} / {milestone.target} {milestone.unit}
                    </span>
                    <span className="font-mono text-slate-800">{percent}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        milestone.achieved
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-orange-400 to-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Badge Reward & Claim Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reward: {milestone.badgeReward}</span>
                  </div>

                  {milestone.achieved ? (
                    <button
                      onClick={() => handleClaimReward(milestone.id, milestone.badgeReward)}
                      disabled={isClaimed}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-slate-200 text-slate-500 cursor-default'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                      }`}
                    >
                      {isClaimed ? '✓ Claimed' : 'Claim Reward'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Needs {milestone.target - milestone.current} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Quiz Consistency Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Recent Quiz Participation Log ({quizAttempts.length} Total Submissions)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Single-Grade Assessment History</span>
        </div>

        <div className="space-y-2">
          {quizAttempts.slice(0, 5).map((att) => (
            <div key={att.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <div className="font-bold text-slate-800">{att.quizTitle}</div>
                  <div className="text-[10px] text-slate-500">{att.subject} · {new Date(att.completedAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-emerald-700">{att.percentage}%</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  att.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {att.percentage >= 80 ? 'Distinction' : 'Passed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
