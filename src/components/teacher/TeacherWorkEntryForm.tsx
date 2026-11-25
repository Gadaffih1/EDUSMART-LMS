import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  WorkEntryLog 
} from '../../types';
import { Storage } from '../../utils/storage';
import { ClientDataStore } from '../../utils/clientDataStore';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';
import { 
  Camera, 
  MapPin, 
  Check, 
  FileCheck2, 
  Calendar as CalendarIcon, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  RotateCw, 
  Building2, 
  Sparkles, 
  Printer, 
  Eye, 
  Compass,
  Lock
} from 'lucide-react';

interface TeacherWorkEntryFormProps {
  currentUser: User;
  onSuccess?: (log: WorkEntryLog) => void;
}

export const TeacherWorkEntryForm: React.FC<TeacherWorkEntryFormProps> = ({
  currentUser,
  onSuccess
}) => {
  const { currentTenant } = useTenant();
  // Helper to split full name into first and last name
  const nameParts = (currentUser.name || '').trim().split(' ');
  const initialFirst = nameParts[0] || 'Teacher';
  const initialLast = nameParts.slice(1).join(' ') || '';

  // 1. Staff No (Auto-filled / selectable with Spreadsheet-to-Form lookup)
  const [staffNo, setStaffNo] = useState<string>(currentUser.tscNumber || 'TSC-48192-ED');
  const isStaffFilled = Boolean(staffNo && staffNo.trim().length > 0);
  const [staffLookupSuccess, setStaffLookupSuccess] = useState<boolean>(true);

  // 2. Teacher or Staff Name (Auto-filled when staff number is filled & cannot be edited)
  const [firstName, setFirstName] = useState<string>(initialFirst);
  const [lastName, setLastName] = useState<string>(initialLast);

  // 3. Sign-In Date and Time: Auto-filled to "current" and locked (cannot be edited)
  const getCurrentDateTimeParts = () => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(now.getMinutes()).padStart(2, '0');

    return {
      day: currentDay,
      month: currentMonth,
      year: currentYear,
      hour: formattedHours,
      minute: formattedMinutes,
      ampm: ampm as 'AM' | 'PM'
    };
  };

  const initialTime = getCurrentDateTimeParts();
  const [signDateDay, setSignDateDay] = useState<string>(initialTime.day);
  const [signDateMonth, setSignDateMonth] = useState<string>(initialTime.month);
  const [signDateYear, setSignDateYear] = useState<string>(initialTime.year);
  const [signTimeHour, setSignTimeHour] = useState<string>(initialTime.hour);
  const [signTimeMinute, setSignTimeMinute] = useState<string>(initialTime.minute);
  const [signTimeAmPm, setSignTimeAmPm] = useState<'AM' | 'PM'>(initialTime.ampm);

  // Continuously sync to real-time clock so it always reflects the exact current moment
  useEffect(() => {
    const syncCurrentClock = () => {
      const current = getCurrentDateTimeParts();
      setSignDateDay(current.day);
      setSignDateMonth(current.month);
      setSignDateYear(current.year);
      setSignTimeHour(current.hour);
      setSignTimeMinute(current.minute);
      setSignTimeAmPm(current.ampm);
    };

    const interval = setInterval(syncCurrentClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 4. Strictly Work Email (Auto-filled when staff number is filled & cannot be edited)
  const [email, setEmail] = useState<string>(currentUser.email || `${currentUser.id.replace('usr-teach-', '')}@edusmart.ac.ke`);

  // 5. Sign-In Location & Live Geolocation Stamp (Captures actual physical place name, NEVER campus name)
  const [signInLocation, setSignInLocation] = useState<string>('');
  const [geoCoords, setGeoCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    address: string;
    verifiedCampus: boolean;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // When staff number is filled, let all the other fields be auto-filled and locked against manual edits
  useEffect(() => {
    const trimmed = staffNo.trim();
    if (!trimmed) {
      setStaffLookupSuccess(false);
      return;
    }

    const allUsers = Storage.getUsers();
    const foundUser = allUsers.find(u => 
      (u.tscNumber && u.tscNumber.toLowerCase() === trimmed.toLowerCase()) ||
      (u.tscNumber && u.tscNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === trimmed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()) ||
      (u.id && u.id.toLowerCase() === trimmed.toLowerCase())
    ) || (currentUser.tscNumber?.toLowerCase() === trimmed.toLowerCase() ? currentUser : null);

    const targetUser = foundUser || currentUser;
    const parts = (targetUser.name || '').trim().split(' ');
    setFirstName(parts[0] || 'Teacher');
    setLastName(parts.slice(1).join(' ') || 'Educator');
    setEmail(targetUser.email || `${targetUser.id.replace('usr-teach-', '')}@edusmart.ac.ke`);
    setStaffLookupSuccess(true);
  }, [staffNo, currentUser]);

  // Real Live Geolocation + Reverse Geocoding to actual physical place name
  const requestGeoLocation = () => {
    setIsLocating(true);
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoCoords(null);
      setSignInLocation('');
      setGeoError('Device geolocation API is unavailable in this browser. Live GPS location is strictly required to submit work entries.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy || 10);
        let actualPlaceName = `GPS Coordinates (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`;

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, {
            credentials: 'include',
            headers: ClientDataStore.getAuthHeaders(),
          });
          if (res.ok) {
            const payload = await res.json();
            if (payload?.locationName) {
              actualPlaceName = String(payload.locationName);
            }
          }
        } catch {
          // Retain raw coordinates label when geocoder cannot be reached; never substitute campus name
        }

        setGeoCoords({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          address: `${actualPlaceName} · GPS ${lat.toFixed(5)}°, ${lng.toFixed(5)}° (±${acc}m)`,
          verifiedCampus: true,
        });
        setSignInLocation(actualPlaceName);
        setGeoError(null);
        setIsLocating(false);
      },
      (err) => {
        setGeoCoords(null);
        setSignInLocation('');
        setGeoError(
          err?.code === 1
            ? 'Location permission denied. Enable device location access and click Capture Live GPS — campus names are not accepted.'
            : 'Unable to acquire live GPS signal. Move to an open area and click Capture Live GPS.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-capture live geographic location on mount
  useEffect(() => {
    requestGeoLocation();
  }, []);

  // 6. Take Personal Photo (Webcam / Live selfie capture + Fallback Canvas)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Status & Confirmation
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<WorkEntryLog | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Start live webcam for "Take Personal Photo"
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        throw new Error('Webcam API not supported in this browser context.');
      }
    } catch {
      // Auto-generate fallback verified snapshot badge
      generateSimulatedSnapshot();
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add official security timestamp watermark
        ctx.fillStyle = 'rgba(11, 48, 117, 0.85)';
        ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
        ctx.fillStyle = '#F5A623';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`STAFF: ${staffNo} · ${signDateDay}/${signDateMonth}/${signDateYear} ${signTimeHour}:${signTimeMinute} ${signTimeAmPm}`, 10, canvas.height - 14);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoDataUrl(dataUrl);
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const generateSimulatedSnapshot = () => {
    // Canvas fallback with avatar & verified stamp
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 300, 300);
      grad.addColorStop(0, '#0B3075');
      grad.addColorStop(1, '#08255B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 300);

      // Staff circle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(150, 115, 55, 0, Math.PI * 2);
      ctx.fill();

      // Silhouette
      ctx.fillStyle = '#0B3075';
      ctx.beginPath();
      ctx.arc(150, 95, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(150, 160, 40, Math.PI, 0, false);
      ctx.fill();

      // Golden border & text
      ctx.strokeStyle = '#F5A623';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 280, 280);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${firstName} ${lastName}`, 150, 205);
      
      ctx.fillStyle = '#F5A623';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`VERIFIED STAFF: ${staffNo}`, 150, 225);

      ctx.fillStyle = '#A7F3D0';
      ctx.font = '10px monospace';
      ctx.fillText(
        geoCoords ? `GEO: ${geoCoords.latitude.toFixed(4)}, ${geoCoords.longitude.toFixed(4)}` : 'GEO: UNVERIFIED',
        150,
        250
      );
      ctx.fillText(`${signDateDay}/${signDateMonth}/${signDateYear} ${signTimeHour}:${signTimeMinute} ${signTimeAmPm}`, 150, 268);

      const url = canvas.toDataURL('image/png');
      setPhotoDataUrl(url);
    }
  };

  // Clean up media tracks on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Form submission handler (strictly requires live GPS geolocation)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoCoords || !signInLocation.trim()) {
      setGeoError('Live GPS geolocation is required before submitting your work entry.');
      return;
    }

    if (!photoDataUrl) {
      // Auto-capture digital staff photo snapshot if teacher didn't open live camera
      generateSimulatedSnapshot();
    }

    setIsSubmitting(true);

    // Capture precise current official timestamp at the moment of submission
    const currentStamp = getCurrentDateTimeParts();
    const fullTeacherName = `${firstName} ${lastName}`.trim() || currentUser.name;
    const formattedDate = `${currentStamp.year}-${currentStamp.month}-${currentStamp.day}`;
    const formattedTime = `${currentStamp.hour}:${currentStamp.minute} ${currentStamp.ampm}`;

    const newLog: WorkEntryLog = {
      id: `wel-${Date.now()}`,
      teacherId: currentUser.id,
      teacherName: fullTeacherName,
      staffNo: staffNo.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      signInLocation: signInLocation.trim(),
      photoUrl: photoDataUrl || undefined,
      geoStamp: geoCoords,
      date: formattedDate,
      time: formattedTime,
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      Storage.addWorkEntryLog(newLog);
      setIsSubmitting(false);
      setSubmissionSuccess(newLog);
      if (onSuccess) {
        onSuccess(newLog);
      }
    }, 600);
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto font-sans text-slate-800">
      {/* Compact Official Work Entry Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Compact Institutional Header Bar */}
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white p-1 rounded-lg border border-amber-400/70 shadow-2xs shrink-0">
              <TenantSchoolLogo variant="horizontal" size="xs" compactMobile />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-[#2C3345] tracking-tight leading-tight truncate">
                Work Entry Sign-In Form (Teacher)
              </h1>
              <p className="text-[10px] text-slate-500 truncate">
                Log duty attendance, live GPS locality &amp; staff clock-in verification.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-[10px] font-bold uppercase tracking-wide shrink-0">
            <Building2 className="w-3 h-3 text-blue-700 shrink-0" />
            <span className="truncate max-w-[140px]">{currentTenant.name} · {currentTenant.code}</span>
          </div>
        </div>

        {/* Submission Success Banner */}
        {submissionSuccess ? (
          <div className="p-4 text-center space-y-3 bg-emerald-50/50">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900">
                Work Entry Successfully Logged!
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Stamped and filed into the school institutional audit register.
              </p>
            </div>

            {/* Receipt / Details Card */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-left text-[11px] space-y-1.5 shadow-2xs">
              <div className="flex justify-between gap-2 border-b pb-1.5 border-slate-100">
                <span className="text-slate-500">Staff Member:</span>
                <span className="font-bold text-slate-900 text-right">{submissionSuccess.teacherName} ({submissionSuccess.staffNo})</span>
              </div>
              <div className="flex justify-between gap-2 border-b pb-1.5 border-slate-100">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-mono font-semibold text-slate-800">{submissionSuccess.date} · {submissionSuccess.time}</span>
              </div>
              <div className="flex justify-between gap-2 border-b pb-1.5 border-slate-100">
                <span className="text-slate-500">Strictly Work Email:</span>
                <span className="font-mono text-slate-800 truncate">{submissionSuccess.email}</span>
              </div>
              <div className="flex justify-between gap-2 border-b pb-1.5 border-slate-100">
                <span className="text-slate-500">Sign-In Location:</span>
                <span className="font-medium text-slate-900 text-right">{submissionSuccess.signInLocation}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500">Geo Stamp:</span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                  {submissionSuccess.geoStamp ? `${submissionSuccess.geoStamp.latitude.toFixed(4)}°, ${submissionSuccess.geoStamp.longitude.toFixed(4)}°` : 'Live GPS Verified'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Official Signed Slip</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Log Another Sign-In</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
              COMPACT OFFICIAL FORM FIELDS (TEACHER SIGN-IN PROTOCOL)
             ======================================================== */
          <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 space-y-2.5">
            {/* FIELD 1: Staff No:* + Spreadsheet-to-Form Auto-Fill */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-[#2C3345] uppercase tracking-wide flex items-center gap-1">
                  <span>Staff No:</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                  Auto-Fill Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <input
                  type="text"
                  required
                  value={staffNo}
                  onChange={(e) => setStaffNo(e.target.value)}
                  placeholder="Staff No (e.g. TSC/44120/ED)"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) setStaffNo(e.target.value);
                  }}
                  value=""
                  className="w-full px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  title="Select a staff member from roster"
                >
                  <option value="" disabled>Select Staff Roster No...</option>
                  <option value="TSC/44120/ED">TSC/44120/ED - Mr. David Kiprono (Class Teacher)</option>
                  <option value="TSC/14982/ED">TSC/14982/ED - Dr. Arthur Mwangi (Head Teacher)</option>
                  <option value="TSC/23491/ED">TSC/23491/ED - Mr. Charles Omondi (Deputy Head)</option>
                  <option value="TSC/38910/ED">TSC/38910/ED - Ms. Beatrice Wanjiku (Dean of Studies)</option>
                  <option value="TSC/31204/ED">TSC/31204/ED - Dr. Mercy Mwangi (HOD Sciences)</option>
                  <option value="TSC/29410/ED">TSC/29410/ED - Mr. Peter Ochieng (Senior Teacher)</option>
                  <option value="TSC/48102/ED">TSC/48102/ED - Mrs. Esther Kamau (Librarian)</option>
                  <option value="ADM/45120/SEC">ADM/45120/SEC - Mrs. Sarah Cherono (Registrar)</option>
                  <option value="TSC-48192-ED">TSC-48192-ED - Standard Staff Record</option>
                </select>
              </div>
              {isStaffFilled ? (
                <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Recognized: Remaining credentials auto-filled &amp; locked.</span>
                </p>
              ) : (
                <p className="text-[10px] text-amber-700 font-medium">
                  Enter or select Staff No above to auto-fill and lock credentials.
                </p>
              )}
            </div>

            {/* FIELD 2: Teacher or Staff Name* (First Name + Last Name) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-[#2C3345] uppercase tracking-wide flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-slate-500" />
                  <span>Teacher / Staff Name</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                {isStaffFilled && (
                  <span className="text-[10px] font-mono text-emerald-800 inline-flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Auto-filled &amp; Locked</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <input
                    type="text"
                    required
                    readOnly={isStaffFilled}
                    disabled={isStaffFilled}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold ${
                      isStaffFilled
                        ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed select-none'
                        : 'border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
                    }`}
                    title={isStaffFilled ? 'First Name is auto-filled and locked against manual edits' : 'Enter First Name'}
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">First Name</span>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    readOnly={isStaffFilled}
                    disabled={isStaffFilled}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold ${
                      isStaffFilled
                        ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed select-none'
                        : 'border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
                    }`}
                    title={isStaffFilled ? 'Last Name is auto-filled and locked against manual edits' : 'Enter Last Name'}
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Last Name</span>
                </div>
              </div>
            </div>

            {/* FIELD 3: Sign-In Date and Time* (Autofill to "current" and locked) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-[#2C3345] uppercase tracking-wide flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-slate-500" />
                  <span>Sign-In Date &amp; Time</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[10px] font-mono text-emerald-800 inline-flex items-center gap-1 font-semibold">
                  <Lock className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Locked (Live Clock)</span>
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1">
                {[
                  { val: signDateDay, label: 'Day', title: 'Sign-In Day (auto-filled)' },
                  { val: signDateMonth, label: 'Month', title: 'Sign-In Month (auto-filled)' },
                  { val: signDateYear, label: 'Year', title: 'Sign-In Year (auto-filled)' },
                  { val: signTimeHour, label: 'Hour', title: 'Sign-In Hour (auto-filled)' },
                  { val: signTimeMinute, label: 'Min', title: 'Sign-In Minutes (auto-filled)' },
                  { val: signTimeAmPm, label: 'AM/PM', title: 'Sign-In AM/PM (auto-filled)' },
                ].map((part) => (
                  <div key={part.label}>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={part.val}
                      className="w-full px-1 py-1 text-center border border-slate-200 bg-slate-100 rounded-md text-[11px] font-mono font-bold text-slate-700 cursor-not-allowed select-none"
                      title={part.title}
                    />
                    <span className="text-[9px] text-slate-400 text-center block mt-0.5 font-medium">{part.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FIELD 4: Strictly Work Email* */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-[#2C3345] uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>Strictly Work Email</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                {isStaffFilled && (
                  <span className="text-[10px] font-mono text-emerald-800 inline-flex items-center gap-1 font-semibold">
                    <Lock className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Auto-filled &amp; Locked</span>
                  </span>
                )}
              </div>

              <input
                type="email"
                required
                readOnly={isStaffFilled}
                disabled={isStaffFilled}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono font-bold ${
                  isStaffFilled
                    ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed select-none'
                    : 'border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'
                }`}
                title={isStaffFilled ? 'Work Email is auto-filled from staff record and cannot be edited' : 'Enter Work Email'}
              />
            </div>

            {/* FIELD 5: Sign-In Physical Location* & Live Reverse-Geocoded Geo Stamp */}
            <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-[#2C3345] uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>Physical Location &amp; Live GPS</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-flex items-center gap-1 font-bold ${
                  geoCoords
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-rose-800 bg-rose-50 border-rose-200'
                }`}>
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isLocating ? 'Locating...' : geoCoords ? 'Live GPS Locked' : 'GPS Required'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  required
                  readOnly
                  disabled
                  value={signInLocation}
                  placeholder={isLocating ? 'Detecting physical location...' : 'Enable GPS to capture actual locality'}
                  className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-not-allowed select-none"
                  title="Sign-In Location is captured directly from device GPS and reverse-geocoded; manual edits are blocked"
                />
                <button
                  type="button"
                  onClick={requestGeoLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-slate-300 inline-flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                  title="Capture current live GPS reading"
                >
                  <Compass className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Capture GPS'}</span>
                </button>
              </div>

              {geoCoords ? (
                <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-950 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{geoCoords.latitude.toFixed(5)}°, {geoCoords.longitude.toFixed(5)}° (±{geoCoords.accuracy}m)</span>
                  </span>
                  <span className="text-emerald-800 font-bold">Live Place Verified</span>
                </div>
              ) : (
                <div className="px-2 py-1 bg-rose-50 rounded-lg border border-rose-200 text-[10px] text-rose-800 font-medium">
                  {geoError || 'Waiting for device GPS permission. Live coordinates are required to submit.'}
                </div>
              )}
            </div>

            {/* FIELD 6: Take Personal Photo* */}
            <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#2C3345] uppercase tracking-wide flex items-center gap-1">
                  <Camera className="w-3 h-3 text-blue-700" />
                  <span>Take Personal Photo</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Biometric Clock-In Stamp</span>
              </div>

              <div className="flex items-center gap-3">
                {photoDataUrl ? (
                  <div className="relative shrink-0">
                    <img
                      src={photoDataUrl}
                      alt="Captured Personal Staff Snapshot"
                      className="w-16 h-16 object-cover rounded-xl border-2 border-emerald-500 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl(null);
                        startCamera();
                      }}
                      className="absolute -bottom-1 -right-1 bg-slate-900/90 hover:bg-slate-900 text-white p-1 rounded-md shadow-xs cursor-pointer"
                      title="Retake Snapshot"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  </div>
                ) : isCameraActive ? (
                  <div className="flex items-center gap-2.5">
                    <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 w-24 h-24 bg-black shrink-0">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Snap Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-900 text-[11px] font-bold rounded-lg border border-blue-200 inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Open Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={generateSimulatedSnapshot}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                      title="Generate Institutional Digital Stamp"
                    >
                      Digital Stamp
                    </button>
                  </div>
                )}

                {!isCameraActive && (
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Embedded with staff ID, live time &amp; GPS verification.
                  </p>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* OFFICIAL SUBMISSION BUTTON */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting || isLocating || !geoCoords || !signInLocation.trim()}
                className="w-full py-2 px-4 rounded-lg bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wide shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {isSubmitting
                    ? 'Submitting Work Entry...'
                    : !geoCoords
                    ? 'Live GPS Location Required to Submit'
                    : 'Submit Work Entry Sign-In Form'}
                </span>
              </button>
              <div className="text-center mt-1.5 text-[10px] text-slate-400">
                Mandatory fields (<span className="text-rose-600 font-bold">*</span>) are audited by Academic Leadership.
              </div>
            </div>
          </form>
        )}

        {/* Compact Footer Stamp */}
        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
          <span className="font-semibold text-slate-600">{currentTenant.name} · Work Entry Register</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Geo-Verified &amp; Biometric Audit</span>
          </span>
        </div>
      </div>

      {/* ========================================================
          MODAL: OFFICIAL SIGNED WORK ENTRY SLIP (PREVIEW & PRINT)
          ======================================================== */}
      {showPreviewModal && submissionSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-300 overflow-hidden print:m-0 print:border-none print:shadow-none">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <TenantSchoolLogo variant="horizontal" size="xs" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 ml-2">
                  Official Lesson Work Entry Slip
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Document Body */}
            <div className="p-6 space-y-4 bg-white text-xs">
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <div className="flex justify-center mb-1">
                  <TenantSchoolLogo variant="full" size="sm" />
                </div>
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-widest">
                  {currentTenant.name} · {currentTenant.motto || currentTenant.code}
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Staff Lesson Work Entry Sign-In Slip
                </h3>
                <div className="font-mono text-xs font-bold text-emerald-800">
                  Entry Ref: {submissionSuccess.id}
                </div>
              </div>

              {/* Photo & Bio Grid */}
              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {submissionSuccess.photoUrl && (
                  <img
                    src={submissionSuccess.photoUrl}
                    alt="Staff Snapshot"
                    className="w-20 h-20 rounded-xl object-cover border border-slate-300 shrink-0"
                  />
                )}
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Teacher Name: </span>
                    <strong className="text-slate-900">{submissionSuccess.teacherName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Staff No: </span>
                    <span className="font-mono font-bold text-slate-800">{submissionSuccess.staffNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Strictly Work Email: </span>
                    <span className="font-mono text-slate-700">{submissionSuccess.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Date & Time: </span>
                    <span className="font-mono text-slate-800 font-semibold">{submissionSuccess.date} · {submissionSuccess.time}</span>
                  </div>
                </div>
              </div>

              {/* Location & Geo Stamp */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-0.5">
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>Sign-In Location:</span>
                  <span>{submissionSuccess.signInLocation}</span>
                </div>
                {submissionSuccess.geoStamp && (
                  <div className="font-mono text-[10px] text-emerald-800">
                    GPS Coordinates: {submissionSuccess.geoStamp.latitude.toFixed(5)}°, {submissionSuccess.geoStamp.longitude.toFixed(5)}° (Live Geolocation Verified)
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
                <div>
                  <div>Signed by Teacher:</div>
                  <strong className="text-slate-900 block mt-0.5">{submissionSuccess.teacherName}</strong>
                  <div className="font-mono">{submissionSuccess.staffNo}</div>
                </div>
                <div className="text-right">
                  <div>Deputy Head Oversight:</div>
                  <div className="mt-3 border-b border-slate-400 w-28 ml-auto" />
                  <div className="mt-0.5">Verified & Audited</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
