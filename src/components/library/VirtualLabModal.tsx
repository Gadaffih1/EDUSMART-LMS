import React, { useEffect } from 'react';
import { X, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { VirtualLabWorkspace } from '../virtuallab/VirtualLabWorkspace';
import { User } from '../../types';

export const VIRTUAL_LAB_URL = 'https://chatgpt.com/s/t_6ad4b3dc26ac8191b12f4c4780daeaf0';

interface VirtualLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  initialTab?: any;
}

export const VirtualLabModal: React.FC<VirtualLabModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'home'
}) => {
  // Prevent body scroll when open to avoid double scrollbars and background peek
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-y-auto flex flex-col animate-in fade-in duration-150">
      {/* Top Floating App Bar: Clear, uncluttered LMS Header */}
      <header className="sticky top-0 z-30 bg-slate-950 border-b border-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs border border-slate-700"
            title="Return to LMS"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Back to LMS</span>
          </button>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              EduSmart Virtual Science Laboratory
            </span>
            <span className="hidden md:inline text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Unrestricted Full View
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <span>Exit Lab</span>
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Main Full-Width Laboratory Body: completely solid background, no double screen */}
      <main className="flex-1 bg-slate-100 p-3 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-y-auto">
        <VirtualLabWorkspace
          currentUser={currentUser}
          onClose={onClose}
          isEmbedded={true}
        />
      </main>
    </div>
  );
};
