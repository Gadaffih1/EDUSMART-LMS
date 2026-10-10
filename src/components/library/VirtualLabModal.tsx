import React from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { VirtualLabWorkspace } from '../virtuallab/VirtualLabWorkspace';
import { User } from '../../types';

export const VIRTUAL_LAB_URL = 'https://chatgpt.com/s/t_6ac78bfad95c8191841d261117b27e60';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-7xl overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dismiss Bar */}
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              In-LMS Virtual Science Laboratory Active
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Close Lab</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Workspace Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          <VirtualLabWorkspace
            currentUser={currentUser}
            onClose={onClose}
            isEmbedded={true}
          />
        </div>
      </div>
    </div>
  );
};
