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
  Clock
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
  showFloatingCard?: boolean;
  isSuperAdminEditMode?: boolean;
  onEditClick?: () => void;
  className?: string;
  altText?: string;
}

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
  floatingCardTitle = '99.4% Term Attendance',
  floatingCardSubtitle = 'Real-time biometrics & roll call monitoring',
  showFloatingCard = true,
  isSuperAdminEditMode = false,
  onEditClick,
  className = '',
  altText = 'EduSmart School Campus & CBC Learners'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(videoAutoplay);
  const [isMuted, setIsMuted] = useState<boolean>(videoMuted);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(maxDurationSeconds);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isControlsHovered, setIsControlsHovered] = useState<boolean>(false);

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
    // Cap visual duration display at maxDurationSeconds (30s)
    setDuration(Math.min(naturalDuration || maxDurationSeconds, maxDurationSeconds));
    setVideoError(false);

    if (videoAutoplay) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If browser blocked unmuted autoplay, mute and retry
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

  const fallbackImageSrc = posterUrl || imageUrl || '/src/assets/images/edusmart_campus_banner_1790859700873.jpg';

  const isVideoMode = mediaType === 'video' && Boolean(videoUrl) && !videoError;

  return (
    <div 
      className={`relative rounded-[1.75rem] overflow-hidden shadow-2xl shadow-slate-900/20 border-[6px] border-white bg-slate-950 group/hero-media ${className}`}
      onMouseEnter={() => setIsControlsHovered(true)}
      onMouseLeave={() => setIsControlsHovered(false)}
    >
      {/* 1. VIDEO RENDER */}
      {isVideoMode ? (
        <div className="relative w-full h-[22rem] sm:h-[29rem] lg:h-[32rem] bg-slate-950 overflow-hidden">
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

          {/* Video Vignette Gradient Overlay for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/30" />

          {/* Top Left: 30-Second Badge Indicator */}
          <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[11px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 shadow-lg">
              <Film className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{videoBadgeLabel || '30s Showcase'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            {/* Countdown / Duration Chip */}
            <div className="px-2.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1 shadow-md">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Interactive Play/Pause & Sound Controls Overlay */}
          {videoShowControls && (
            <div className="absolute bottom-16 sm:bottom-20 right-3.5 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-xl transition-transform active:scale-95 cursor-pointer"
                title={isPlaying ? "Pause Video" : "Play Video"}
                aria-label={isPlaying ? "Pause Video" : "Play Video"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white text-white" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={`p-2.5 rounded-xl text-white border backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer ${
                  isMuted 
                    ? 'bg-slate-900/85 border-white/20 text-slate-300 hover:text-white' 
                    : 'bg-amber-500/90 border-amber-400 text-slate-950 font-bold'
                }`}
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
                aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/20 backdrop-blur-md shadow-xl transition-transform active:scale-95 cursor-pointer"
                title="Restart 30s Loop"
                aria-label="Restart Video"
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
        /* 2. IMAGE RENDER (OR VIDEO FALLBACK) */
        <div className="relative w-full h-[22rem] sm:h-[29rem] lg:h-[32rem] bg-slate-950 overflow-hidden">
          <img
            src={fallbackImageSrc}
            alt={altText}
            className="w-full h-full object-cover object-center transform group-hover/hero-media:scale-[1.03] transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/src/assets/images/edusmart_campus_banner_1790859700873.jpg';
            }}
          />

          {/* Subtle gradient vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20" />

          {/* Fallback Notice if Video Error occurred */}
          {mediaType === 'video' && videoError && (
            <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-black border border-amber-300 shadow-lg">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Video offline · Showing high-res campus photo</span>
            </div>
          )}
        </div>
      )}

      {/* Super Admin Quick Edit Button */}
      {isSuperAdminEditMode && (
        <button
          type="button"
          onClick={onEditClick}
          className="absolute top-3 right-3 z-20 bg-slate-950/90 hover:bg-slate-900 text-amber-300 border border-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Edit Hero Banner {mediaType === 'video' ? '(Video)' : '(Image)'}</span>
        </button>
      )}

      {/* Floating Highlight Overlay Card */}
      {showFloatingCard && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 text-slate-900 border border-white/80 shadow-xl flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-900">{floatingCardTitle}</div>
            <div className="text-xs text-slate-600 mt-0.5">{floatingCardSubtitle}</div>
          </div>
          <span className="inline-flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" aria-hidden="true" />
            Active
          </span>
        </div>
      )}
    </div>
  );
};
