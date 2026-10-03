import React, { useState } from 'react';
import { LessonNote, VideoLesson, AudioLesson } from '../../types';
import { 
  BookOpen, 
  Video, 
  Volume2, 
  Play, 
  Pause, 
  CheckCircle, 
  ShieldCheck, 
  FileText,
  Clock,
  User,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface ResourceViewerProps {
  note?: LessonNote | null;
  video?: VideoLesson | null;
  audio?: AudioLesson | null;
  onClose: () => void;
  onLaunchQuiz?: () => void;
}

export const ResourceViewer: React.FC<ResourceViewerProps> = ({
  note,
  video,
  audio,
  onClose,
  onLaunchQuiz
}) => {
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);

  // Video state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              {note && <BookOpen className="w-4 h-4" />}
              {video && <Video className="w-4 h-4" />}
              {audio && <Volume2 className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span>Grade {note?.grade || video?.grade || audio?.grade}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-700">
                  {note?.subject || video?.subject || audio?.subject}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Secure Member Viewer (Protected)</span>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                {note?.title || video?.title || audio?.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLaunchQuiz && (
              <button
                onClick={onLaunchQuiz}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                <span>Take Topic Quiz</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 text-base font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* === NOTES VIEW === */}
          {note && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Anti-download Security Header */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Anti-Download Mode Active:</strong> Direct downloads & external URL exports are restricted. Read in this secure student console.
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 font-mono hidden sm:inline">
                  CONFIDENTIAL · CBC KENYA
                </span>
              </div>

              {/* Author & Meta */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Prepared by: <strong>{note.author}</strong></span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Curriculum Date: {note.createdAt}</span>
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Topic Executive Summary
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {note.summary}
                </p>
              </div>

              {/* Embedded Diagram if available */}
              {note.diagramUrl && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-xs">
                  <div className="relative aspect-video max-h-72 w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={note.diagramUrl}
                      alt={note.diagramCaption || 'Curriculum Diagram'}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {note.diagramCaption && (
                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
                      Figure: {note.diagramCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Structured Notes Content */}
              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4">
                {note.content.split('\n\n').map((paragraph, idx) => {
                  const trimmed = paragraph.trim();
                  if (trimmed.startsWith('###')) {
                    return (
                      <h4 key={idx} className="text-base font-bold text-slate-900 mt-6 mb-2 border-b border-slate-200 pb-1">
                        {trimmed.replace('###', '').trim()}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('-')) {
                    const bullets = trimmed.split('\n').filter(Boolean);
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-1 text-slate-700">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b.replace(/^- /, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (trimmed.startsWith('$$')) {
                    return (
                      <div key={idx} className="p-3 bg-slate-100 rounded-lg text-center font-mono text-xs sm:text-sm text-slate-900 my-2">
                        {trimmed.replaceAll('$$', '')}
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-700">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* Key Takeaways */}
              {note.keyTakeaways && note.keyTakeaways.length > 0 && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Key Lesson Takeaways & Revision Notes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {note.keyTakeaways.map((takeaway, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* === VIDEO LESSON VIEW === */}
          {video && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Video Player Container */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video shadow-md flex items-center justify-center">
                {video.videoThumbnail && !isPlayingVideo && (
                  <img
                    src={video.videoThumbnail}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                )}

                <div className="relative z-10 text-center text-white p-4">
                  {!isPlayingVideo ? (
                    <div>
                      <button
                        onClick={() => setIsPlayingVideo(true)}
                        className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-105"
                      >
                        <Play className="w-7 h-7 fill-white ml-1" />
                      </button>
                      <div className="mt-4 text-sm font-semibold">Click to Watch Lesson Video</div>
                      <div className="text-xs text-slate-300 font-mono mt-1">Duration: {video.durationMinutes} Minutes</div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-900/90 rounded-xl border border-slate-700 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-bold text-white mb-1">Interactive CBC Educational Stream</div>
                      <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                        Playing curriculum demonstration by {video.teacherName}. Audio commentary and step-by-step whiteboard animation active.
                      </p>
                      <button
                        onClick={() => setIsPlayingVideo(false)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                      >
                        Pause Stream
                      </button>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-1 rounded">
                  Secure Stream · Anti-Rip Protection
                </div>
              </div>

              {/* Key Points */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Lesson Highlights & Timestamps
                </h4>
                <div className="space-y-2 text-xs text-slate-700">
                  {video.keyPoints.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2">
                      <span className="font-mono text-emerald-700 font-semibold shrink-0">
                        [0{pIdx * 4}:00]
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === AUDIO LESSON VIEW === */}
          {audio && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Interactive Audio Player Card */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                    <Volume2 className="w-4 h-4" />
                    <span>EduSmart Audio Masterclass</span>
                  </div>
                  <span className="text-xs text-slate-300 font-mono">
                    {audio.durationMinutes} min listen
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{audio.title}</h3>
                <p className="text-xs text-slate-300 mb-6">Instructor: {audio.teacherName}</p>

                {/* Simulated Audio Waveform */}
                <div className="flex items-center gap-1.5 h-12 mb-6 px-2">
                  {[24, 40, 16, 32, 48, 20, 36, 12, 44, 28, 50, 18, 38, 22, 46, 30, 14, 42, 26, 48, 34, 16, 40, 24].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${isPlayingAudio ? Math.max(8, (h + (i % 3) * 6)) : h * 0.4}px` }}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        i < 10
                          ? 'bg-emerald-400'
                          : isPlayingAudio
                          ? 'bg-emerald-400/50'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold transition-all shadow-md"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-5 h-5 fill-slate-950" />
                      ) : (
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      )}
                    </button>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {isPlayingAudio ? 'Playing Lesson Audio...' : 'Audio Paused'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">03:45 / {audio.durationMinutes}:00</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAudioSpeed(audioSpeed === 1.0 ? 1.25 : audioSpeed === 1.25 ? 1.5 : 1.0)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700"
                    >
                      {audioSpeed}x
                    </button>
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded border border-slate-700 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{showTranscript ? 'Hide Script' : 'Transcript'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Transcript Drawer */}
              {showTranscript && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Full Audio Transcript
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                    "{audio.transcript}"
                  </p>
                </div>
              )}

              {/* Key Listening Points */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Key Listening & Mental Math Points
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {audio.keyPoints.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 hidden sm:block">
            Member access authorized for EduSmart CBC learners.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onLaunchQuiz && (
              <button
                onClick={onLaunchQuiz}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                Attempt Topical Quiz →
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
