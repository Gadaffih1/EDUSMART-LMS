import React, { useState } from 'react';
import { User, LearnerBadge } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Printer, 
  Download, 
  Trophy, 
  Star, 
  Zap, 
  ShieldCheck, 
  Clock,
  BookOpen
} from 'lucide-react';

interface GamificationBadgesModuleProps {
  currentUser: User;
}

export const GamificationBadgesModule: React.FC<GamificationBadgesModuleProps> = ({ currentUser }) => {
  const [badges, setBadges] = useState<LearnerBadge[]>(() => Storage.getBadges());
  const [showCertificate, setShowCertificate] = useState(false);
  const [celebrateEffect, setCelebrateEffect] = useState(false);

  const totalXP = Storage.getTotalXP();
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;

  const handleOpenCertificate = () => {
    setShowCertificate(true);
    setCelebrateEffect(true);
    setTimeout(() => setCelebrateEffect(false), 3000);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case 'Clock':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6 text-emerald-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-purple-500" />;
      case 'Award':
      default:
        return <Award className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Gamification Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-200 uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Learner Recognition & Certification Rewards</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Competency Badges & Bonus Points (BP)
          </h2>
          <p className="text-xs sm:text-sm text-slate-100 mt-1 max-w-2xl leading-relaxed">
            Earn bonus points (BP) by completing topical quizzes, turning in assignments on time, contributing practical projects, and demonstrating positive online citizenship.
          </p>
        </div>

        {/* Level & BP Capsule */}
        <div className="bg-white/15 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-center shrink-0 min-w-[200px] space-y-1">
          <div className="text-[10px] uppercase font-bold text-amber-200">Current Rank</div>
          <div className="text-2xl font-black text-white">Level {currentLevel} Scholar</div>
          <div className="text-xs font-mono font-bold text-emerald-200">{totalXP} Total BP Earned</div>
          
          <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-amber-300 h-full transition-all duration-500"
              style={{ width: `${xpInCurrentLevel}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-200 font-mono text-right">
            {100 - xpInCurrentLevel} BP to Level {currentLevel + 1}
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <span>{unlockedCount} of {badges.length} Badges Unlocked</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 font-bold">100% Verified Mastery</span>
        </div>

        <button
          onClick={handleOpenCertificate}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          <Award className="w-4 h-4 text-amber-200" />
          <span>Generate Certificate of Achievement</span>
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
              badge.unlocked
                ? 'bg-white border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md'
                : 'bg-slate-50/80 border-dashed border-slate-300 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                badge.unlocked ? 'bg-amber-50 border border-amber-200' : 'bg-slate-200 text-slate-400'
              }`}>
                {badge.unlocked ? getBadgeIcon(badge.iconName) : <Lock className="w-5 h-5 text-slate-400" />}
              </div>

              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  badge.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  +{badge.xpPoints} BP
                </span>
                {badge.dateUnlocked && (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Unlocked: {badge.dateUnlocked}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{badge.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {badge.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 capitalize font-medium">{badge.category} Category</span>
              <span className={`font-bold flex items-center gap-1 ${badge.unlocked ? 'text-emerald-700' : 'text-slate-400'}`}>
                {badge.unlocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unlocked</span>
                  </>
                ) : (
                  <span>Locked</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Official Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border-4 border-amber-400 p-8 sm:p-10 relative overflow-hidden text-center space-y-6">
            
            {/* Confetti Visual Celebration */}
            {celebrateEffect && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <div className="text-6xl animate-bounce">🎉 🌟 ✨ 🎊 🏆</div>
              </div>
            )}

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
                This certifies that the undernamed learner has achieved commendable competency progression.
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
              In formal recognition of distinguished mastery in <strong>Fractions & Mathematics Operations</strong>, outstanding completion of <strong>Digital Safe Search & Ethics</strong>, and faithful compilation of the <strong>Grade 4 CBC Practical E-Portfolio</strong> with <strong>{totalXP} Certification Bonus Points (BP)</strong>.
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
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
