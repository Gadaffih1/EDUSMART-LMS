import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type LocalParticipant,
  type Participant,
  type RemoteParticipant,
  type TrackPublication,
  VideoPresets,
} from 'livekit-client';
import {
  AlertTriangle,
  BookOpen,
  Check,
  Clock,
  Crown,
  Hand,
  Lock,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  PhoneOff,
  Radio,
  RefreshCw,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Unlock,
  UserCheck,
  UserMinus,
  Users,
  Video,
  VideoOff,
  VolumeX,
  X,
} from 'lucide-react';
import {
  type JoinClassroomResponse,
  type VirtualLessonParticipant,
  formatCountdownSeconds,
  vcApiFetch,
} from './virtualClassroomTypes';

interface LiveClassroomRoomModalProps {
  lessonId: string;
  classroomId?: string;
  onClose: () => void;
  onRequestPayment?: (reason: string) => void;
  onLessonUpdated?: () => void;
}

interface ChatMessageItem {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface ReactionBurst {
  id: string;
  senderName: string;
  emoji: string;
}

const ParticipantVideoTile: React.FC<{
  participant: Participant;
  isLocal?: boolean;
  isActiveSpeaker?: boolean;
  isHost?: boolean;
  handRaised?: boolean;
  streamLabel?: string;
  videoPublication?: TrackPublication;
  screenPublication?: TrackPublication;
  audioPublication?: TrackPublication;
  compact?: boolean;
}> = ({
  participant,
  isLocal,
  isActiveSpeaker,
  isHost,
  handRaised,
  streamLabel,
  videoPublication,
  screenPublication,
  audioPublication,
  compact,
}) => {
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const activeVideoTrack = screenPublication?.track || videoPublication?.track;
  const activeVideoMuted = screenPublication
    ? screenPublication.isMuted
    : videoPublication?.isMuted ?? true;

  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !activeVideoTrack) return;
    activeVideoTrack.attach(el);
    return () => {
      try {
        activeVideoTrack.detach(el);
      } catch {
        // ignore cleanup
      }
    };
  }, [activeVideoTrack]);

  useEffect(() => {
    const el = audioElRef.current;
    const audioTrack = audioPublication?.track;
    if (!el || !audioTrack || isLocal) return;
    audioTrack.attach(el);
    return () => {
      try {
        audioTrack.detach(el);
      } catch {
        // ignore cleanup
      }
    };
  }, [audioPublication?.track, isLocal]);

  const hasVisibleVideo = Boolean(activeVideoTrack && !activeVideoMuted);
  const isMicOn = Boolean(audioPublication && !audioPublication.isMuted);
  const displayName = participant.name || participant.identity;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-slate-900 border ${
        isActiveSpeaker ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-slate-700'
      } flex items-center justify-center ${compact ? 'h-36' : 'min-h-[210px] aspect-video'}`}
    >
      {hasVisibleVideo ? (
        <video
          ref={videoElRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full ${screenPublication?.track ? 'object-contain bg-black' : 'object-cover'}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-300 gap-2 p-4">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[160px]">{displayName}</span>
        </div>
      )}

      {!isLocal && <audio ref={audioElRef} autoPlay />}

      {/* Top badges */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5">
          {isHost && (
            <span className="px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[10px] font-bold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Host
            </span>
          )}
          {screenPublication?.track && (
            <span className="px-2 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-bold">
              Screen Share
            </span>
          )}
        </div>
        {handRaised && (
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1">
            <Hand className="w-3 h-3" />
            Hand Raised
          </span>
        )}
      </div>

      {/* Bottom identity bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 bg-slate-950/75 px-2.5 py-1 rounded-lg text-xs text-white">
        <div className="truncate font-semibold">
          {displayName} {isLocal ? '(You)' : ''}
          {streamLabel ? <span className="text-slate-400 font-normal"> · {streamLabel}</span> : null}
        </div>
        <div className="shrink-0">
          {isMicOn ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          )}
        </div>
      </div>
    </div>
  );
};

export const LiveClassroomRoomModal: React.FC<LiveClassroomRoomModalProps> = ({
  lessonId,
  classroomId,
  onClose,
  onRequestPayment,
  onLessonUpdated,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  const [joinData, setJoinData] = useState<JoinClassroomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState<{ message: string; code?: string } | null>(null);

  // LiveKit connection state
  const [lkConnected, setLkConnected] = useState(false);
  const [lkConnecting, setLkConnecting] = useState(false);
  const [lkDiagnosticError, setLkDiagnosticError] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());

  // Local media controls
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Classroom panels
  const [sidePanel, setSidePanel] = useState<'none' | 'participants' | 'chat' | 'resources' | 'controls'>('participants');
  const [participants, setParticipants] = useState<VirtualLessonParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [reactions, setReactions] = useState<ReactionBurst[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const notify = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg((prev) => (prev === msg ? null : prev)), 4000);
  };

  // Timer tick every second
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const attemptJoin = useCallback(async () => {
    setLoading(true);
    setJoinError(null);
    try {
      const res = await vcApiFetch<JoinClassroomResponse>(`/api/virtual-lessons/${lessonId}/join`, {
        method: 'POST',
        body: JSON.stringify({ classroomId }),
      });
      setJoinData(res);
    } catch (err: any) {
      setJoinError({
        message: err?.message || 'Unable to join classroom.',
        code: err?.data?.code,
      });
    } finally {
      setLoading(false);
    }
  }, [lessonId, classroomId]);

  useEffect(() => {
    void attemptJoin();
  }, [attemptJoin]);

  // Poll waiting room admission status every 3s + listen to SSE when waiting
  useEffect(() => {
    if (!joinData?.waiting) return;
    const pollId = setInterval(() => {
      void attemptJoin();
    }, 3000);
    const onSse = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.recordId === lessonId || detail?.key === 'edusmart_virtual_lessons_v1') {
        void attemptJoin();
      }
    };
    window.addEventListener('edusmart:data-changed', onSse);
    return () => {
      clearInterval(pollId);
      window.removeEventListener('edusmart:data-changed', onSse);
    };
  }, [joinData?.waiting, lessonId, attemptJoin]);

  const activeClassroomId = joinData?.classroom?.id || joinData?.classroomId || classroomId;

  const refreshParticipantsAndChat = useCallback(async () => {
    if (!activeClassroomId) return;
    try {
      const [pRes, cRes, lRes] = await Promise.all([
        vcApiFetch<{ participants: VirtualLessonParticipant[] }>(
          `/api/virtual-lessons/${lessonId}/participants?classroomId=${encodeURIComponent(activeClassroomId)}`
        ),
        vcApiFetch<{ messages: ChatMessageItem[] }>(
          `/api/virtual-lessons/${lessonId}/chat?classroomId=${encodeURIComponent(activeClassroomId)}`
        ),
        vcApiFetch<{ lesson: any }>(`/api/virtual-lessons/${lessonId}`),
      ]);
      setParticipants(pRes.participants || []);
      setChatMessages(cRes.messages || []);

      if (lRes.lesson) {
        const updatedRoom = lRes.lesson.classrooms?.find((c: any) => c.id === activeClassroomId);
        if (updatedRoom && (updatedRoom.roomStatus === 'completed' || updatedRoom.roomStatus === 'cancelled')) {
          notify('This virtual classroom has ended.');
          setTimeout(() => {
            onLessonUpdated?.();
            onClose();
          }, 1500);
          return;
        }
        setJoinData((prev) =>
          prev
            ? {
                ...prev,
                lesson: lRes.lesson,
                classroom: updatedRoom || prev.classroom,
              }
            : prev
        );
      }
    } catch {
      // ignore transient poll errors
    }
  }, [lessonId, activeClassroomId, onClose, onLessonUpdated]);

  // Keep participants, waiting room & chat synchronized via SSE + lightweight fallback poll
  useEffect(() => {
    if (!joinData?.joined) return;
    void refreshParticipantsAndChat();
    const poll = setInterval(() => {
      void refreshParticipantsAndChat();
    }, 6000);
    const onSse = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail || detail.key === 'edusmart_virtual_lessons_v1' || detail.key === '*') {
        void refreshParticipantsAndChat();
      }
    };
    window.addEventListener('edusmart:data-changed', onSse);
    return () => {
      clearInterval(poll);
      window.removeEventListener('edusmart:data-changed', onSse);
    };
  }, [joinData?.joined, refreshParticipantsAndChat]);

  // Connect to LiveKit Room when token + URL are available
  useEffect(() => {
    if (!joinData?.joined || !joinData.token || !joinData.livekitUrl) {
      if (joinData?.joined && !joinData.configured) {
        setLkDiagnosticError(
          `LiveKit media server credentials (${(joinData.missingKeys || []).join(', ')}) are not configured in server .env yet. Classroom attendance, controls, and chat remain active.`
        );
      }
      return;
    }

    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
      rtcConfig: joinData.iceServers ? { iceServers: joinData.iceServers } : undefined,
    });
    roomRef.current = room;

    const bump = () => {
      if (!cancelled) setRenderTick((t) => t + 1);
    };

    room
      .on(RoomEvent.Connected, () => {
        if (cancelled) return;
        setLkConnected(true);
        setLkConnecting(false);
        setLkDiagnosticError(null);
        // Send authenticated connection ack to server ONLY after LiveKit RoomEvent.Connected succeeds
        if (activeClassroomId) {
          void vcApiFetch(`/api/virtual-lessons/${lessonId}/media-session-ack`, {
            method: 'POST',
            body: JSON.stringify({ classroomId: activeClassroomId, state: 'connected', livekitConnected: true }),
          }).catch(() => {});
        }
        bump();
      })
      .on(RoomEvent.Disconnected, () => {
        if (cancelled) return;
        setLkConnected(false);
        setLkConnecting(false);
        if (activeClassroomId) {
          void vcApiFetch(`/api/virtual-lessons/${lessonId}/media-session-ack`, {
            method: 'POST',
            body: JSON.stringify({ classroomId: activeClassroomId, state: 'disconnected', livekitConnected: false }),
          }).catch(() => {});
        }
        bump();
      })
      .on(RoomEvent.ParticipantConnected, bump)
      .on(RoomEvent.ParticipantDisconnected, bump)
      .on(RoomEvent.TrackSubscribed, bump)
      .on(RoomEvent.TrackUnsubscribed, bump)
      .on(RoomEvent.TrackMuted, bump)
      .on(RoomEvent.TrackUnmuted, bump)
      .on(RoomEvent.LocalTrackPublished, bump)
      .on(RoomEvent.LocalTrackUnpublished, bump)
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (!cancelled) {
          setActiveSpeakers(new Set(speakers.map((s) => s.identity)));
        }
      })
      .on(RoomEvent.ParticipantPermissionsChanged, (_prev, p) => {
        if (p.identity === room.localParticipant.identity) {
          if (!p.permissions?.canPublish) {
            setMicOn(false);
            setCamOn(false);
            setScreenOn(false);
          }
        }
        bump();
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const decoded = JSON.parse(new TextDecoder().decode(payload));
          if (decoded.type === 'REACTION') {
            const id = `rx-${Date.now()}-${Math.random()}`;
            setReactions((prev) => [...prev.slice(-8), { id, senderName: participant?.name || 'Member', emoji: decoded.emoji }]);
            setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), 3500);
          } else if (decoded.type === 'CLASSROOM_ENDED') {
            notify('The teacher has ended this virtual classroom.');
            onLessonUpdated?.();
            onClose();
          } else if (decoded.type === 'TIME_WARNING') {
            notify(`${decoded.minutesRemaining} minutes remaining in this lesson.`);
          } else if (decoded.type === 'PERMISSIONS_UPDATED' || decoded.type === 'CLASSROOM_SETTINGS_UPDATED' || decoded.type === 'ROOM_LOCKED') {
            void refreshParticipantsAndChat();
          } else if (decoded.type === 'CHAT') {
            void refreshParticipantsAndChat();
          }
        } catch {
          // ignore non-json data packets
        }
      });

    setLkConnecting(true);
    room
      .connect(joinData.livekitUrl, joinData.token)
      .catch((err: any) => {
        if (cancelled) return;
        setLkConnecting(false);
        setLkConnected(false);
        setLkDiagnosticError(err?.message || 'Could not establish LiveKit WebRTC connection.');
      });

    // Connected media attendance heartbeat every 30s ONLY while LiveKit connected
    const heartbeat = setInterval(() => {
      if (room.state === 'connected' && activeClassroomId) {
        void vcApiFetch(`/api/virtual-lessons/${lessonId}/media-session-ack`, {
          method: 'POST',
          body: JSON.stringify({ classroomId: activeClassroomId, state: 'connected', livekitConnected: true }),
        }).catch(() => {});
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      if (room.state === 'connected' && activeClassroomId) {
        void vcApiFetch(`/api/virtual-lessons/${lessonId}/media-session-ack`, {
          method: 'POST',
          body: JSON.stringify({ classroomId: activeClassroomId, state: 'disconnected', livekitConnected: false }),
        }).catch(() => {});
      }
      room.disconnect().catch(() => {});
      roomRef.current = null;
    };
  }, [joinData?.joined, joinData?.token, joinData?.livekitUrl, joinData?.configured, activeClassroomId, lessonId, onClose, onLessonUpdated, refreshParticipantsAndChat]);

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room || !lkConnected) {
      notify('LiveKit audio device requires an active LiveKit server connection.');
      return;
    }
    if (!joinData?.isModerator && joinData?.classroom?.mutedAll) {
      notify('Student microphones are muted by the teacher.');
      return;
    }
    const next = !micOn;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch (err: any) {
      notify(err?.message || 'Microphone permission denied or blocked by teacher.');
    }
  };

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room || !lkConnected) {
      notify('LiveKit video camera requires an active LiveKit server connection.');
      return;
    }
    const next = !camOn;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setCamOn(next);
    } catch (err: any) {
      notify(err?.message || 'Camera permission denied or blocked by teacher.');
    }
  };

  const toggleScreenShare = async () => {
    const room = roomRef.current;
    if (!room || !lkConnected) {
      notify('Screen sharing requires an active LiveKit server connection.');
      return;
    }
    const next = !screenOn;
    try {
      await room.localParticipant.setScreenShareEnabled(next);
      setScreenOn(next);
    } catch (err: any) {
      notify(err?.message || 'Screen share not permitted or cancelled.');
    }
  };

  const toggleRaiseHand = async () => {
    if (!activeClassroomId) return;
    const next = !handRaised;
    setHandRaised(next);
    try {
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/raise-hand`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: activeClassroomId, raised: next }),
      });
      await refreshParticipantsAndChat();
    } catch (err: any) {
      notify(err?.message || 'Failed updating raised hand');
    }
  };

  const sendReaction = async (emoji: string) => {
    const room = roomRef.current;
    const burstId = `rx-local-${Date.now()}`;
    setReactions((prev) => [...prev.slice(-8), { id: burstId, senderName: 'You', emoji }]);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== burstId)), 3500);
    if (room && lkConnected) {
      try {
        const bytes = new TextEncoder().encode(JSON.stringify({ type: 'REACTION', emoji }));
        await room.localParticipant.publishData(bytes, { reliable: true });
      } catch {
        // ignore
      }
    }
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatDraft.trim() || !activeClassroomId) return;
    const msg = chatDraft.trim();
    setChatDraft('');
    try {
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: activeClassroomId, message: msg }),
      });
      if (roomRef.current && lkConnected) {
        const bytes = new TextEncoder().encode(JSON.stringify({ type: 'CHAT', message: msg }));
        await roomRef.current.localParticipant.publishData(bytes, { reliable: true }).catch(() => {});
      }
      await refreshParticipantsAndChat();
    } catch (err: any) {
      notify(err?.message || 'Failed sending chat message.');
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Host moderation actions
  const handleHostAction = async (endpoint: string, body: Record<string, any>, toast: string) => {
    try {
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: activeClassroomId, ...body }),
      });
      notify(toast);
      await refreshParticipantsAndChat();
    } catch (err: any) {
      notify(err?.message || 'Action failed');
    }
  };

  const handleToggleRecording = async () => {
    setRecordingBusy(true);
    try {
      const isRec = joinData?.lesson?.recordings?.some((r) => r.classroomId === activeClassroomId && r.recordingStatus === 'recording');
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/recording/${isRec ? 'stop' : 'start'}`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: activeClassroomId }),
      });
      notify(isRec ? 'Recording stopped and archived.' : 'Lesson recording started.');
      await refreshParticipantsAndChat();
    } catch (err: any) {
      notify(err?.message || 'Recording toggle failed');
    } finally {
      setRecordingBusy(false);
    }
  };

  const handleEndClassroomForAll = async () => {
    try {
      await vcApiFetch(`/api/virtual-lessons/${lessonId}/end`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: activeClassroomId, reason: 'Ended by teacher' }),
      });
      onLessonUpdated?.();
      onClose();
    } catch (err: any) {
      notify(err?.message || 'Failed to end classroom');
    }
  };

  // Remaining time countdown
  const remainingSec = useMemo(() => {
    if (!joinData?.endsAt) return 0;
    return Math.max(0, Math.floor((Date.parse(joinData.endsAt) - nowMs) / 1000));
  }, [joinData?.endsAt, nowMs]);

  const isWarning10 = remainingSec > 0 && remainingSec <= 600 && remainingSec > 300;
  const isWarning5 = remainingSec > 0 && remainingSec <= 300;

  // All LiveKit connected participants (local + remote)
  const livekitParticipants = useMemo(() => {
    const room = roomRef.current;
    if (!room || !lkConnected) return [];
    const list: Array<{ participant: Participant; isLocal: boolean }> = [
      { participant: room.localParticipant, isLocal: true },
      ...Array.from(room.remoteParticipants.values()).map((rp) => ({ participant: rp, isLocal: false })),
    ];
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lkConnected, renderTick]);

  const waitingParticipants = participants.filter((p) => p.admission_status === 'waiting');
  const activeRecording = joinData?.lesson?.recordings?.some(
    (r) => r.classroomId === activeClassroomId && r.recordingStatus === 'recording'
  );
  const classroom = joinData?.classroom;
  const lesson = joinData?.lesson;
  const isMod = Boolean(joinData?.isModerator);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none"
    >
      {/* Top Classroom Telemetry Header */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">
                {lesson ? `${lesson.subjectName}: ${lesson.title}` : 'Live Virtual Classroom'}
              </h2>
              {classroom?.locked && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
              {activeRecording && (
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <Radio className="w-3 h-3 animate-pulse" />
                  REC
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {lesson ? `${lesson.gradeName} · ${lesson.topic}` : 'Connecting to LiveKit session...'}
              {classroom?.streamNames?.length ? ` · ${classroom.streamNames.join(', ')}` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Countdown Timer */}
          {joinData?.joined && joinData.endsAt && (
            <div
              className={`px-3 py-1.5 rounded-lg border font-mono tabular-nums text-xs font-bold flex items-center gap-1.5 ${
                isWarning5
                  ? 'bg-rose-600/25 border-rose-500 text-rose-200'
                  : isWarning10
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-emerald-300'
              }`}
              title="Strict 60-minute maximum classroom timer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatCountdownSeconds(remainingSec)}</span>
            </div>
          )}

          {/* Capacity & Count */}
          {classroom && (
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono tabular-nums text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {livekitParticipants.length || participants.filter((p) => p.admission_status === 'admitted').length}/
                {classroom.capacity}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Minimize / Exit Classroom"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Time Warning & System Banners */}
      {(isWarning10 || isWarning5) && (
        <div
          className={`px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 ${
            isWarning5 ? 'bg-rose-700 text-white' : 'bg-amber-500 text-slate-950'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {isWarning5
              ? 'Final 5 minutes remaining! Classroom will automatically end and save attendance when the timer reaches 00:00.'
              : '10 minutes remaining in this virtual lesson.'}
          </span>
        </div>
      )}

      {actionMsg && (
        <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs font-medium text-emerald-300 text-center">
          {actionMsg}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Video / Waiting / Error Stage */}
        <div className="flex-1 min-w-0 p-4 overflow-y-auto flex flex-col justify-between relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <div className="text-sm font-semibold">Verifying stream access & issuing LiveKit room token...</div>
            </div>
          ) : joinError ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 text-center">
                <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Cannot Enter Classroom</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{joinError.message}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {joinError.code?.startsWith('SUBSCRIPTION') && onRequestPayment && (
                    <button
                      type="button"
                      onClick={() => onRequestPayment(joinError.message)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Activate / Renew Subscription (Paybill 400200)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void attemptJoin()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : joinData?.waiting ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 text-center">
                <Clock className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Waiting Room</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {joinData.message || 'Your teacher will admit you into the classroom momentarily. This page connects automatically once admitted.'}
                </p>
                <div className="text-[11px] text-slate-400 font-mono">Checking admission status live...</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Leave Waiting Room
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4">
              {lkDiagnosticError && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
                    <span>{lkDiagnosticError}</span>
                  </div>
                  <span className="font-mono text-[10px] shrink-0 text-amber-300">Room: {joinData?.roomName}</span>
                </div>
              )}

              {lkConnecting && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Connecting audio & video via LiveKit WebRTC...</span>
                </div>
              )}

              {/* Video Gallery Grid */}
              {livekitParticipants.length > 0 ? (
                <div
                  className={`grid gap-3 ${
                    livekitParticipants.length === 1
                      ? 'grid-cols-1 max-w-3xl mx-auto w-full'
                      : livekitParticipants.length <= 4
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {livekitParticipants.map(({ participant, isLocal }) => {
                    const camPub = participant.getTrackPublication(Track.Source.Camera);
                    const micPub = participant.getTrackPublication(Track.Source.Microphone);
                    const scrPub = participant.getTrackPublication(Track.Source.ScreenShare);
                    const meta = (() => {
                      try {
                        return participant.metadata ? JSON.parse(participant.metadata) : {};
                      } catch {
                        return {};
                      }
                    })();
                    const dbMatch = participants.find((p) => p.livekit_identity === participant.identity);
                    return (
                      <ParticipantVideoTile
                        key={participant.identity}
                        participant={participant}
                        isLocal={isLocal}
                        isActiveSpeaker={activeSpeakers.has(participant.identity)}
                        isHost={Boolean(meta.isModerator || dbMatch?.is_co_host)}
                        handRaised={Boolean(dbMatch?.hand_raised)}
                        videoPublication={camPub}
                        screenPublication={scrPub}
                        audioPublication={micPub}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center gap-3">
                  <Video className="w-10 h-10 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    {lesson?.subjectName}: {lesson?.title}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    {lkConnected
                      ? 'Turn on your camera or microphone from the toolbar below when instructed by your teacher.'
                      : 'Room session initialized. Use the sidebar for Participants, Teacher Moderation Controls, Learning Objectives, and Classroom Chat.'}
                  </p>
                  <div className="text-[11px] font-mono text-slate-500">
                    LiveKit Room: {joinData?.roomName}
                  </div>
                </div>
              )}

              {/* Floating Live Reactions */}
              {reactions.length > 0 && (
                <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 pointer-events-none">
                  {reactions.map((r) => (
                    <span
                      key={r.id}
                      className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-semibold text-white shadow"
                    >
                      {r.emoji} {r.senderName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Interactive Drawer */}
        {joinData?.joined && sidePanel !== 'none' && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'participants' as const, label: `People (${participants.length})` },
                  { id: 'chat' as const, label: 'Chat' },
                  { id: 'resources' as const, label: 'Lesson' },
                  ...(isMod ? [{ id: 'controls' as const, label: `Host${waitingParticipants.length ? ` (${waitingParticipants.length})` : ''}` }] : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSidePanel(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                      sidePanel === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSidePanel('none')}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {sidePanel === 'participants' && (
                <>
                  {waitingParticipants.length > 0 && isMod && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">Waiting Room ({waitingParticipants.length})</span>
                        <button
                          type="button"
                          onClick={() => void handleHostAction('admit', { admitAll: true }, 'Admitted waiting room participants.')}
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Admit All
                        </button>
                      </div>
                      {waitingParticipants.map((w) => (
                        <div key={w.id} className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                          <span className="truncate text-slate-200 font-medium">{w.user_name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => void handleHostAction('admit', { participantId: w.id, decision: 'admit' }, `Admitted ${w.user_name}`)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Admit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleHostAction('admit', { participantId: w.id, decision: 'reject' }, `Rejected ${w.user_name}`)}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {participants
                    .filter((p) => p.admission_status === 'admitted')
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            <span>{p.user_name}</span>
                            {p.is_co_host === 1 && (
                              <span className="text-[10px] text-amber-300 font-mono">[Host]</span>
                            )}
                            {p.hand_raised === 1 && <Hand className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {p.user_role.replace('_', ' ')} · {p.is_connected ? 'Live in room' : 'Token issued'}
                          </div>
                        </div>
                        {isMod && p.user_id !== joinData?.identity?.split(':')[1] && p.user_role === 'student' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                void handleHostAction(
                                  'permissions',
                                  { participantId: p.id, micAllowed: p.mic_allowed !== 1 },
                                  `${p.mic_allowed === 1 ? 'Muted' : 'Enabled'} mic for ${p.user_name}`
                                )
                              }
                              className={`p-1.5 rounded ${
                                p.mic_allowed === 1 ? 'bg-emerald-600/30 text-emerald-300' : 'bg-slate-700 text-rose-300'
                              } cursor-pointer`}
                              title="Toggle Mic Permission"
                            >
                              {p.mic_allowed === 1 ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleHostAction(
                                  'permissions',
                                  { participantId: p.id, camAllowed: p.cam_allowed !== 1 },
                                  `${p.cam_allowed === 1 ? 'Disabled' : 'Enabled'} camera for ${p.user_name}`
                                )
                              }
                              className={`p-1.5 rounded ${
                                p.cam_allowed === 1 ? 'bg-emerald-600/30 text-emerald-300' : 'bg-slate-700 text-rose-300'
                              } cursor-pointer`}
                              title="Toggle Camera Permission"
                            >
                              {p.cam_allowed === 1 ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleHostAction('remove-participant', { participantId: p.id }, `Removed ${p.user_name}`)
                              }
                              className="p-1.5 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white cursor-pointer"
                              title="Remove Student"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </>
              )}

              {sidePanel === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-2 overflow-y-auto pb-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">No classroom chat messages yet.</div>
                    ) : (
                      chatMessages.map((m) => (
                        <div key={m.id} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-emerald-300">{m.sender_name}</span>
                            <span className="font-mono">
                              {new Date(m.created_at).toLocaleTimeString('en-KE', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Africa/Nairobi',
                              })}
                            </span>
                          </div>
                          <div className="text-slate-100 leading-relaxed">{m.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={sendChat} className="pt-2 border-t border-slate-800 flex gap-2">
                    <input
                      type="text"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      disabled={!isMod && !classroom?.studentChatEnabled}
                      placeholder={
                        !isMod && !classroom?.studentChatEnabled
                          ? 'Chat paused by teacher'
                          : 'Message the classroom...'
                      }
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatDraft.trim() || (!isMod && !classroom?.studentChatEnabled)}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {sidePanel === 'resources' && lesson && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">
                      Learning Objectives
                    </div>
                    <p className="text-slate-200 leading-relaxed">{lesson.learningObjectives}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-amber-300">
                      Key Learning Points
                    </div>
                    <ul className="space-y-1.5 list-disc pl-4 text-slate-200">
                      {lesson.keyLearningPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                  {lesson.resources.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-blue-300">
                        Attached Lesson Materials
                      </div>
                      {lesson.resources.map((res, idx) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-blue-300 truncate"
                        >
                          {res.title || res.url}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sidePanel === 'controls' && isMod && classroom && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void handleHostAction('mute-all', { muted: true }, 'All student microphones muted.')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4 text-rose-400" />
                      <div className="font-bold text-white">Mute All</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleHostAction('mute-all', { muted: false }, 'Student microphones unmuted.')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 cursor-pointer"
                    >
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <div className="font-bold text-white">Unmute All</div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleHostAction(
                          classroom.locked ? 'unlock' : 'lock',
                          {},
                          classroom.locked ? 'Classroom unlocked.' : 'Classroom locked against late entry.'
                        )
                      }
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 cursor-pointer"
                    >
                      {classroom.locked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                      <div className="font-bold text-white">{classroom.locked ? 'Unlock Room' : 'Lock Room'}</div>
                    </button>
                    <button
                      type="button"
                      disabled={recordingBusy}
                      onClick={() => void handleToggleRecording()}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left space-y-1 cursor-pointer"
                    >
                      <Radio className={`w-4 h-4 ${activeRecording ? 'text-rose-500' : 'text-slate-300'}`} />
                      <div className="font-bold text-white">{activeRecording ? 'Stop Recording' : 'Start Recording'}</div>
                    </button>
                  </div>

                  {/* Global Student Permission Switches */}
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2.5">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-emerald-400" />
                      Student Permissions
                    </div>
                    {[
                      { key: 'studentMicEnabled', label: 'Allow Student Microphones', val: classroom.studentMicEnabled },
                      { key: 'studentCameraEnabled', label: 'Allow Student Cameras', val: classroom.studentCameraEnabled },
                      { key: 'studentScreenshareEnabled', label: 'Allow Screen Sharing', val: classroom.studentScreenshareEnabled },
                      { key: 'studentChatEnabled', label: 'Allow Classroom Chat', val: classroom.studentChatEnabled },
                      { key: 'waitingRoomEnabled', label: 'Require Waiting Room', val: classroom.waitingRoomEnabled },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-300">{opt.label}</span>
                        <input
                          type="checkbox"
                          checked={opt.val}
                          onChange={(e) =>
                            void handleHostAction(
                              'permissions',
                              { [opt.key]: e.target.checked },
                              `${opt.label}: ${e.target.checked ? 'Enabled' : 'Disabled'}`
                            )
                          }
                          className="w-4 h-4 rounded text-emerald-500"
                        />
                      </label>
                    ))}
                  </div>

                  {/* Raised Hands Queue */}
                  {participants.some((p) => p.hand_raised === 1) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="font-bold text-amber-300">Raised Hands</div>
                      {participants
                        .filter((p) => p.hand_raised === 1)
                        .map((p) => (
                          <div key={p.id} className="flex items-center justify-between">
                            <span className="text-white">{p.user_name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                void handleHostAction(
                                  'permissions',
                                  { participantId: p.id, micAllowed: true },
                                  `Unmuted ${p.user_name} to speak`
                                )
                              }
                              className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Allow Mic
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* End Classroom Control */}
                  {!confirmEnd ? (
                    <button
                      type="button"
                      onClick={() => setConfirmEnd(true)}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                    >
                      End Classroom for Everyone
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 space-y-2">
                      <div className="text-rose-200 font-semibold">
                        Disconnect all students and finalise attendance?
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleEndClassroomForAll()}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                        >
                          Confirm End
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmEnd(false)}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Zoom-like Media Toolbar */}
      {joinData?.joined && (
        <footer className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleMic()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                micOn ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600' : 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
              <span>{micOn ? 'Mute' : 'Unmute'}</span>
            </button>

            <button
              type="button"
              onClick={() => void toggleCamera()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                camOn ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600' : 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {camOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
              <span>{camOn ? 'Stop Video' : 'Start Video'}</span>
            </button>

            {(isMod || classroom?.studentScreenshareEnabled) && (
              <button
                type="button"
                onClick={() => void toggleScreenShare()}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  screenOn ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <MonitorUp className="w-4 h-4" />
                <span className="hidden sm:inline">{screenOn ? 'Stop Share' : 'Share Screen'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => void toggleRaiseHand()}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                handRaised ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
            </button>

            <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-xl px-2 py-1">
              {['👍', '👏', '🎉', '💡'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => void sendReaction(emoji)}
                  className="px-1.5 py-1 rounded hover:bg-slate-700 text-sm cursor-pointer"
                  title="Send reaction"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSidePanel((p) => (p === 'participants' ? 'none' : 'participants'))}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                sidePanel === 'participants' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Participants</span>
            </button>

            <button
              type="button"
              onClick={() => setSidePanel((p) => (p === 'chat' ? 'none' : 'chat'))}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                sidePanel === 'chat' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setSidePanel((p) => (p === 'resources' ? 'none' : 'resources'))}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                sidePanel === 'resources' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Objectives</span>
            </button>

            {isMod && (
              <button
                type="button"
                onClick={() => setSidePanel((p) => (p === 'controls' ? 'none' : 'controls'))}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  sidePanel === 'controls' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Host Controls</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </footer>
      )}
    </div>
  );
};
