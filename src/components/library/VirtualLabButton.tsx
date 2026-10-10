import React, { useState } from 'react';
import { FlaskConical, ExternalLink, Sparkles, Atom } from 'lucide-react';
import { VirtualLabModal, VIRTUAL_LAB_URL } from './VirtualLabModal';
import { User } from '../../types';

interface VirtualLabButtonProps {
  variant?: 'header' | 'hero' | 'banner' | 'card' | 'compact';
  className?: string;
  label?: string;
  showBadge?: boolean;
  currentUser?: User;
}

export const VirtualLabButton: React.FC<VirtualLabButtonProps> = ({
  variant = 'header',
  className = '',
  label = 'Virtual LAB',
  showBadge = true,
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Variant: Header (compact for navigation bars and digital library action toolbars)
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-emerald-500/25 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-emerald-400/40 ${className}`}
          title="Open EduSmart CBC Virtual LAB & Interactive Science Workbench"
        >
          <div className="relative flex items-center justify-center">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-200" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <span>{label}</span>
          {showBadge && (
            <span className="hidden sm:inline text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
              CBC STEM
            </span>
          )}
        </button>

        {isOpen && (
          <VirtualLabModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            currentUser={currentUser}
          />
        )}
      </>
    );
  }

  // Variant: Hero (prominent for dashboard hero areas)
  if (variant === 'hero') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-md hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer border border-emerald-300/40 ${className}`}
          title="Launch CBC Virtual Science Laboratory"
        >
          <div className="relative flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-emerald-100" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping" />
          </div>
          <span>{label}</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
            Virtual LAB
          </span>
        </button>

        {isOpen && (
          <VirtualLabModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            currentUser={currentUser}
          />
        )}
      </>
    );
  }

  // Variant: Compact
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer ${className}`}
          title="Virtual LAB"
        >
          <FlaskConical className="w-3 h-3 text-emerald-200" />
          <span>{label}</span>
        </button>

        {isOpen && (
          <VirtualLabModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  }

  // Variant: Card (for digital library listings)
  if (variant === 'card') {
    return (
      <>
        <div className={`bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-500/30 shadow-md flex flex-col justify-between ${className}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Featured Digital Portal</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-300">Grade 4–9</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <FlaskConical className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-base font-black tracking-tight text-white">
                  CBC Virtual LAB
                </h4>
                <div className="text-xs text-emerald-200/80">Interactive Science Workbench</div>
              </div>
            </div>

            <p className="text-xs text-emerald-100/70 mt-2 line-clamp-2">
              Virtual science experiments, pH indicators, Ohm's law circuits, compound microscope, and experiment protocols.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-300 font-medium">Digital Science Lab</span>
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Launch Virtual LAB</span>
            </button>
          </div>
        </div>

        {isOpen && (
          <VirtualLabModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            currentUser={currentUser}
          />
        )}
      </>
    );
  }

  // Variant: Banner (full-width interactive showcase banner for Digital Library)
  return (
    <>
      <div className={`bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-950 text-white rounded-2xl p-5 sm:p-6 border border-emerald-500/40 shadow-md relative overflow-hidden ${className}`}>
        {/* Background glow decoration */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                <Atom className="w-3 h-3 text-emerald-300" />
                <span>CBC STEM Digital Innovation</span>
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                Science & Technology Practical Portal
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-300" />
              <span>EduSmart Virtual LAB</span>
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Equip your learners with virtual science inquiries, acid-base chemical titrations, electric circuit simulations, and digital microscopy without physical consumable constraints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FlaskConical className="w-4 h-4 text-emerald-900" />
              <span>Launch Virtual LAB (In-LMS)</span>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <VirtualLabModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          currentUser={currentUser}
        />
      )}
    </>
  );
};
