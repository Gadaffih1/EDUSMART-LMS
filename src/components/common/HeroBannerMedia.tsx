import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Film, 
  Image as ImageIcon, 
  Sparkles, 
  Edit3, 
  AlertCircle,
  Clock,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  Camera,
  Layers,
  ShieldCheck,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { HeroMediaType } from '../../types/customization';

export interface HeroBannerMediaProps {
  mediaType?: HeroMediaType;
  imageUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  videoBadgeLabel?: string;
  videoAutoplay?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
  videoShowControls?: boolean;
  maxDurationSeconds?: number;
  floatingCardTitle?: string;
  floatingCardSubtitle?: string;
  floatingCardBadgeText?: string;
  floatingCardBadgeColor?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  showFloatingCard?: boolean;
  isSuperAdminEditMode?: boolean;
  onEditClick?: () => void;
  onImageChange?: (newImageUrl: string) => void;
  onAccessClick?: () => void;
  isSubscribed?: boolean;
  className?: string;
  altText?: string;
}

const DEFAULT_IMAGE_PRESETS = [
  {
    id: 'gadaffih-smartboard',
    label: 'Mr. Gadaffih & CBC Classroom (Official)',
    url: '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg',
    description: 'Teacher Mr. Gadaffih guiding learners with smart board and tablets'
  },
  {
    id: 'campus-aerial',
    label: 'School Campus & Administration Grounds',
    url: '/src/assets/images/edusmart_campus_banner_1790859700873.jpg',
    description: 'Lush school grounds, administration blocks and assembly quadrangle'
  },
  {
    id: 'science-lab',
    label: 'STEM Science & Biology Laboratory',
    url: '/src/assets/images/diagram_science_ecosystem_1790859717590.jpg',
    description: 'CBC science specimens, ecosystem observation and optical microscopes'
  },
  {
    id: 'math-spatial',
    label: 'Mathematics & Spatial Geometry Hub',
    url: '/src/assets/images/diagram_math_geometry_1790859731617.jpg',
    description: 'Interactive geometry formulas, coordinate charts and CBC solids'
  },
  {
    id: 'african-learners',
    label: 'African CBC Modern Classroom',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
    description: 'Active young students in school uniforms collaborating on assignments'
  }
];

export const HeroBannerMedia: React.FC<HeroBannerMediaProps> = ({
  mediaType = 'image',
  imageUrl,
  videoUrl,
  posterUrl,
  videoBadgeLabel = '30s Campus Spotlight',
  videoAutoplay = true,
  videoMuted = true,
  videoLoop = true,
  videoShowControls = true,
  maxDurationSeconds = 30,
  floatingCardTitle = 'Interactive Smart Classroom',
  floatingCardSubtitle = 'Mr. Gadaffih & CBC learners connected in real time',
  floatingCardBadgeText = 'LIVE SYNC',
  floatingCardBadgeColor = 'emerald',
  showFloatingCard = true,
  isSuperAdminEditMode = false,
  onEditClick,
  onImageChange,
  onAccessClick,
  isSubscribed = false,
  className = '',
  altText = 'EduSmart School Campus & CBC Learners'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(videoAutoplay);
  const [isMuted, setIsMuted] = useState<boolean>(videoMuted);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(maxDurationSeconds);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isControlsHovered, setIsControlsHovered] = useState<boolean>(false);

  // In-context image customizer state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string>(imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Keep internal image synchronized with prop
  useEffect(() => {
    if (imageUrl) {
      setCurrentImage(imageUrl);
    }
  }, [imageUrl]);

  // Sync muted and autoplay properties when prop changes
  useEffect(() => {
    setIsMuted(videoMuted);
    if (videoRef.current) {
      videoRef.current.muted = videoMuted;
    }
  }, [videoMuted]);

  useEffect(() => {
    setVideoError(false);
    setCurrentTime(0);
  }, [videoUrl, mediaType]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Strict 30-second cap enforcement:
    // If video exceeds maxDurationSeconds (30s), loop back to beginning
    if (curr >= maxDurationSeconds) {
      if (videoLoop) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const naturalDuration = videoRef.current.duration;
    setDuration(Math.min(naturalDuration || maxDurationSeconds, maxDurationSeconds));
    setVideoError(false);

    if (videoAutoplay) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Video play prevented:', err));
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleRestart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / (duration || maxDurationSeconds)) * 100));

  const fallbackImageSrc = posterUrl || currentImage || '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg';
  const isVideoMode = mediaType === 'video' && Boolean(videoUrl) && !videoError;

  // Image customization handlers - Restricted to Super Admin
  const handleApplyNewImage = (newUrl: string) => {
    if (!isSuperAdminEditMode) {
      alert('Access restricted: Only Platform Super Administrators can customize the hero banner.');
      return;
    }
    if (!newUrl.trim()) return;
    setCurrentImage(newUrl.trim());
    if (onImageChange) {
      onImageChange(newUrl.trim());
    }
    setUploadSuccessMessage('Hero banner image updated by Super Admin!');
    setTimeout(() => {
      setUploadSuccessMessage(null);
      setIsCustomizerOpen(false);
    }, 900);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdminEditMode) {
      alert('Access restricted: Only Platform Super Administrators can customize the hero banner.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleApplyNewImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className={`relative rounded-[1.75rem] overflow-hidden shadow-2xl shadow-slate-900/25 border-[6px] border-white bg-slate-950 flex flex-col group/hero-media ${className}`}
      onMouseEnter={() => setIsControlsHovered(true)}
      onMouseLeave={() => setIsControlsHovered(false)}
    >
      {/* ========================================================
          1. LIVE SYNC PART: PLACED CLEANLY AT THE TOP
             (NOT PART OF / NOT COVERING THE BOTTOM OF THE IMAGE)
          ======================================================== */}
      {showFloatingCard && (
        <div className="relative z-30 bg-slate-900/95 backdrop-blur-md px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 text-white flex items-center justify-between gap-3 shadow-md">
          {/* Left: Real-time Live indicator & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                {floatingCardTitle || 'Interactive Smart Classroom'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-300 truncate mt-0.5">
                {floatingCardSubtitle || 'Mr. Gadaffih & CBC learners connected in real time'}
              </div>
            </div>
          </div>

          {/* Right: Live Sync Badge */}
          <div className="flex items-center gap-2 shrink-0">

            <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-full shadow-xs border ${
              floatingCardBadgeColor === 'blue'
                ? 'text-blue-300 bg-blue-950/80 border-blue-500/40'
                : floatingCardBadgeColor === 'amber'
                ? 'text-amber-300 bg-amber-950/80 border-amber-500/40'
                : floatingCardBadgeColor === 'purple'
                ? 'text-purple-300 bg-purple-950/80 border-purple-500/40'
                : floatingCardBadgeColor === 'slate'
                ? 'text-slate-300 bg-slate-800 border-slate-600'
                : 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                floatingCardBadgeColor === 'blue' ? 'bg-blue-400' :
                floatingCardBadgeColor === 'amber' ? 'bg-amber-400' :
                floatingCardBadgeColor === 'purple' ? 'bg-purple-400' :
                floatingCardBadgeColor === 'slate' ? 'bg-slate-400' :
                'bg-emerald-400'
              }`} aria-hidden="true" />
              <span>{floatingCardBadgeText || 'LIVE SYNC'}</span>
            </span>

            {/* Quick Customizable Image Trigger - Strictly Super Admin Only */}
            {isSuperAdminEditMode && (
              <button
                type="button"
                onClick={() => setIsCustomizerOpen(true)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-black flex items-center gap-1.5 shadow-md border border-amber-400/40 transition-all cursor-pointer"
                title="Super Admin: Customize Hero Banner Image"
                aria-label="Customize Hero Image (Super Admin)"
              >
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Change Photo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. MAIN MEDIA CANVAS (IMAGE OR 30-SEC VIDEO)
             UNOBSTRUCTED AT THE BOTTOM - FULL VISIBILITY!
          ======================================================== */}
      {isVideoMode ? (
        /* Video Mode */
        <div className="relative w-full h-[21rem] sm:h-[28rem] lg:h-[30rem] bg-slate-950 overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={fallbackImageSrc}
            autoPlay={videoAutoplay}
            muted={isMuted}
            loop={videoLoop}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => {
              console.warn("Video failed to play, switching to fallback poster");
              setVideoError(true);
            }}
            className="w-full h-full object-cover object-center cursor-pointer"
            onClick={togglePlay}
          />

          {/* Video Vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />

          {/* Top Left: Duration Badge Indicator */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 shadow-lg">
              <Film className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{videoBadgeLabel || '30s Showcase'}</span>
            </div>

            <div className="px-2 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1 shadow-md">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Video Controls Overlay */}
          {videoShowControls && (
            <div className="absolute bottom-4 right-3.5 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-xl transition-transform active:scale-95 cursor-pointer"
                title={isPlaying ? "Pause Video" : "Play Video"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white text-white" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={`p-2 rounded-xl text-white border backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer ${
                  isMuted 
                    ? 'bg-slate-900/85 border-white/20 text-slate-300 hover:text-white' 
                    : 'bg-amber-500/90 border-amber-400 text-slate-950 font-bold'
                }`}
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/20 backdrop-blur-md shadow-xl transition-transform active:scale-95 cursor-pointer"
                title="Restart 30s Loop"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 30-Second Progress Line along bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 z-10">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        /* Image Mode: Clean, Unobstructed, Customizable */
        <div className="relative w-full aspect-[3/2] bg-slate-950 overflow-hidden">
          <img
            src={fallbackImageSrc}
            alt={altText}
            className="w-full h-full object-cover object-center transform group-hover/hero-media:scale-[1.02] transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/gad@edusmart.jpeg';
            }}
          />

          {/* Subtle bottom vignette to ensure contrast */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20" />

          {/* Floating Hover Trigger for Instant Image Change - Strictly Super Admin Only */}
          {isSuperAdminEditMode && (
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-slate-950/95 hover:bg-slate-900 text-amber-300 border border-amber-400 text-xs font-bold backdrop-blur-md shadow-xl flex items-center gap-1.5 opacity-90 group-hover/hero-media:opacity-100 transition-all cursor-pointer hover:scale-105"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin: Change Photo</span>
            </button>
          )}
        </div>
      )}

      {/* Super Admin Quick Edit Link */}
      {isSuperAdminEditMode && (
        <button
          type="button"
          onClick={onEditClick}
          className="absolute top-14 right-3 z-20 bg-slate-950/90 hover:bg-slate-900 text-amber-300 border border-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Full Hero Editor</span>
        </button>
      )}

      {/* ========================================================
          3. IN-CONTEXT IMAGE CUSTOMIZER MODAL / OVERLAY
             (STRICTLY ACCESSIBLE TO SUPER ADMIN ONLY)
          ======================================================== */}
      {isCustomizerOpen && isSuperAdminEditMode && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex flex-col justify-between text-white animate-fadeIn">
          <div>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500 rounded-lg text-slate-950 font-black">
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm sm:text-base font-extrabold text-white">
                      Customize Hero Banner Image
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full uppercase">
                      Super Admin Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload a verified school photograph, enter an image URL, or choose a preset
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close customizer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success message banner if updated */}
            {uploadSuccessMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* Action 1: Upload from Device */}
            <div className="mb-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-white block">Upload From Your Computer</span>
                  <span className="text-[11px] text-slate-400">Select any campus photo, school banner, or classroom image</span>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Image File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action 2: Image Web URL */}
            <div className="mb-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-white block mb-1.5">
                Paste Image Web Link (URL)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://yourschool.edu/banner.jpg"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyNewImage(customUrlInput)}
                  disabled={!customUrlInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Action 3: Choose from Curated Presets */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Or Select from Curated Campus Presets:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_IMAGE_PRESETS.map((preset) => {
                  const isCurrent = currentImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyNewImage(preset.url)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-blue-950/80 border-blue-400 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/20"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/gad@edusmart.jpeg';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{preset.label}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              Changes persist across sessions and school portals
            </span>
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
