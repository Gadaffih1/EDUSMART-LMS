import React, { useState } from 'react';
import { User, LibraryRoomBooking } from '../../types';
import { LibraryRoomBookingModal } from './LibraryRoomBookingModal';
import { DoorOpen, CalendarCheck, Sparkles, Plus } from 'lucide-react';

interface LibraryRoomBookingButtonProps {
  currentUser: User;
  variant?: 'header' | 'hero' | 'outline' | 'compact' | 'sidebar';
  className?: string;
  onBookingSuccess?: (booking: LibraryRoomBooking) => void;
  label?: string;
}

export const LibraryRoomBookingButton: React.FC<LibraryRoomBookingButtonProps> = ({
  currentUser,
  variant = 'header',
  className = '',
  onBookingSuccess,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Variant styling
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-purple-400/40 hover:shadow-purple-500/25 ${className}`}
          title="Reserve a Library Space or Seminar Room on spots without library lessons"
        >
          <DoorOpen className="w-3.5 h-3.5 text-purple-200" />
          <span className="hidden sm:inline">{label || 'Book Library Room'}</span>
          <span className="sm:hidden">{label || 'Book Room'}</span>
        </button>

        {isOpen && (
          <LibraryRoomBookingModal
            currentUser={currentUser}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onBookingSuccess={onBookingSuccess}
          />
        )}
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md hover:shadow-purple-500/30 transition-all flex items-center gap-2 cursor-pointer border border-purple-400/30 ${className}`}
          title="Reserve a Library Room on vacant timetable spots"
        >
          <DoorOpen className="w-4 h-4 text-purple-200" />
          <span>{label || 'Book Library Room'}</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Vacant Spots Only
          </span>
        </button>

        {isOpen && (
          <LibraryRoomBookingModal
            currentUser={currentUser}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onBookingSuccess={onBookingSuccess}
          />
        )}
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${className}`}
          title="Book Library Space"
        >
          <CalendarCheck className="w-3 h-3 text-purple-700" />
          <span>{label || 'Book Room'}</span>
        </button>

        {isOpen && (
          <LibraryRoomBookingModal
            currentUser={currentUser}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onBookingSuccess={onBookingSuccess}
          />
        )}
      </>
    );
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200 cursor-pointer ${className}`}
        >
          <DoorOpen className="w-4 h-4 text-purple-700" />
          <div className="flex-1">
            <div className="text-xs font-black text-purple-950">{label || 'Book Library Room'}</div>
            <div className="text-[10px] text-purple-700 font-medium">Free Timetable Spots Only</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        {isOpen && (
          <LibraryRoomBookingModal
            currentUser={currentUser}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onBookingSuccess={onBookingSuccess}
          />
        )}
      </>
    );
  }

  // Default Outline
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-3 py-2 bg-white hover:bg-purple-50 border border-purple-300 text-purple-900 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer ${className}`}
      >
        <DoorOpen className="w-4 h-4 text-purple-600" />
        <span>{label || 'Book Library Room'}</span>
      </button>

      {isOpen && (
        <LibraryRoomBookingModal
          currentUser={currentUser}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onBookingSuccess={onBookingSuccess}
        />
      )}
    </>
  );
};
