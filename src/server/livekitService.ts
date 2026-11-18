import {
  AccessToken,
  DataPacket_Kind,
  EgressClient,
  RoomServiceClient,
  TrackSource,
  TrackType,
  WebhookReceiver,
  type WebhookEvent,
} from 'livekit-server-sdk';

export interface LiveKitRuntimeConfig {
  configured: boolean;
  clientWsUrl: string;
  serverHttpUrl: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  missingKeys: string[];
}

const DEFAULT_ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export function normalizeLiveKitUrls(rawUrl: string): { clientWsUrl: string; serverHttpUrl: string } {
  const clean = String(rawUrl || '').trim().replace(/\/+$/, '');
  if (!clean) return { clientWsUrl: '', serverHttpUrl: '' };

  if (clean.startsWith('wss://')) {
    return { clientWsUrl: clean, serverHttpUrl: `https://${clean.slice(6)}` };
  }
  if (clean.startsWith('ws://')) {
    return { clientWsUrl: clean, serverHttpUrl: `http://${clean.slice(5)}` };
  }
  if (clean.startsWith('https://')) {
    return { clientWsUrl: `wss://${clean.slice(8)}`, serverHttpUrl: clean };
  }
  if (clean.startsWith('http://')) {
    return { clientWsUrl: `ws://${clean.slice(7)}`, serverHttpUrl: clean };
  }
  return { clientWsUrl: `wss://${clean}`, serverHttpUrl: `https://${clean}` };
}

export function getLiveKitConfig(): LiveKitRuntimeConfig {
  const rawUrl = String(process.env.LIVEKIT_URL || '').trim();
  const apiKey = String(process.env.LIVEKIT_API_KEY || '').trim();
  const apiSecret = String(process.env.LIVEKIT_API_SECRET || '').trim();
  const webhookSecret = String(process.env.LIVEKIT_WEBHOOK_SECRET || apiSecret).trim();

  const missingKeys: string[] = [];
  if (!rawUrl) missingKeys.push('LIVEKIT_URL');
  if (!apiKey) missingKeys.push('LIVEKIT_API_KEY');
  if (!apiSecret) missingKeys.push('LIVEKIT_API_SECRET');

  let iceServers = DEFAULT_ICE_SERVERS;
  if (process.env.LIVEKIT_ICE_SERVERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.LIVEKIT_ICE_SERVERS_JSON);
      if (Array.isArray(parsed) && parsed.length > 0) {
        iceServers = parsed;
      }
    } catch {
      // fall back to default STUN servers
    }
  }

  const { clientWsUrl, serverHttpUrl } = normalizeLiveKitUrls(rawUrl);

  return {
    configured: missingKeys.length === 0 && Boolean(clientWsUrl && serverHttpUrl),
    clientWsUrl,
    serverHttpUrl,
    apiKey,
    apiSecret,
    webhookSecret,
    iceServers,
    missingKeys,
  };
}

function safeSlug(raw: string, maxLen = 28): string {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (cleaned || 'item').slice(0, maxLen);
}

/**
 * Deterministic multi-tenant LiveKit room naming:
 *   edusmart_{school}_{grade}_{lesson}_{stream|combined}
 * Combined lessons share one room name; separate stream classes generate unique per-stream names.
 */
export function buildCanonicalLiveKitRoomName(params: {
  schoolId: string;
  gradeId: string;
  lessonId: string;
  streamId?: string | null;
}): string {
  const schoolPart = safeSlug(params.schoolId, 20);
  const gradePart = safeSlug(params.gradeId, 20);
  const lessonPart = safeSlug(params.lessonId, 24);
  const streamPart = params.streamId ? safeSlug(params.streamId, 20) : 'combined';
  return `edusmart_${schoolPart}_${gradePart}_${lessonPart}_${streamPart}`;
}

export function buildParticipantIdentity(params: {
  schoolId: string;
  userId: string;
}): string {
  return `${safeSlug(params.schoolId, 16)}:${String(params.userId).trim()}`;
}

function getRoomClient(cfg: LiveKitRuntimeConfig): RoomServiceClient | null {
  if (!cfg.configured) return null;
  return new RoomServiceClient(cfg.serverHttpUrl, cfg.apiKey, cfg.apiSecret);
}

function getEgressClient(cfg: LiveKitRuntimeConfig): EgressClient | null {
  if (!cfg.configured) return null;
  return new EgressClient(cfg.serverHttpUrl, cfg.apiKey, cfg.apiSecret);
}

export interface MintJoinTokenParams {
  roomName: string;
  identity: string;
  name: string;
  role: string;
  isModerator: boolean;
  micAllowed: boolean;
  camAllowed: boolean;
  screenShareAllowed: boolean;
  chatAllowed: boolean;
  ttlSeconds: number;
  metadata: Record<string, any>;
}

export async function mintLiveKitJoinToken(params: MintJoinTokenParams): Promise<{
  configured: boolean;
  token: string | null;
  livekitUrl: string;
  iceServers: LiveKitRuntimeConfig['iceServers'];
  missingKeys: string[];
}> {
  const cfg = getLiveKitConfig();
  if (!cfg.apiKey || !cfg.apiSecret) {
    return {
      configured: false,
      token: null,
      livekitUrl: cfg.clientWsUrl,
      iceServers: cfg.iceServers,
      missingKeys: cfg.missingKeys,
    };
  }

  const clampedTtl = Math.max(60, Math.min(3600, Math.floor(params.ttlSeconds || 3600)));
  const at = new AccessToken(cfg.apiKey, cfg.apiSecret, {
    identity: params.identity,
    name: params.name,
    ttl: clampedTtl,
    metadata: JSON.stringify(params.metadata),
    attributes: {
      role: params.role,
      schoolId: String(params.metadata?.schoolId || ''),
      lessonId: String(params.metadata?.lessonId || ''),
      classroomId: String(params.metadata?.classroomId || ''),
    },
  });

  const canPublishSources: TrackSource[] = [];
  if (params.isModerator || params.micAllowed) {
    canPublishSources.push(TrackSource.MICROPHONE);
  }
  if (params.isModerator || params.camAllowed) {
    canPublishSources.push(TrackSource.CAMERA);
  }
  if (params.isModerator || params.screenShareAllowed) {
    canPublishSources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);
  }

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canSubscribe: true,
    canPublish: params.isModerator || canPublishSources.length > 0,
    canPublishSources: canPublishSources.length > 0 ? canPublishSources : undefined,
    canPublishData: params.isModerator || params.chatAllowed,
    canUpdateOwnMetadata: true,
    roomAdmin: params.isModerator,
    roomRecord: params.isModerator,
  });

  const jwt = await at.toJwt();
  return {
    configured: cfg.configured,
    token: jwt,
    livekitUrl: cfg.clientWsUrl,
    iceServers: cfg.iceServers,
    missingKeys: cfg.missingKeys,
  };
}

export async function ensureLiveKitRoom(params: {
  roomName: string;
  maxParticipants: number;
  metadata?: Record<string, any>;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) {
    return { ok: true, skipped: true };
  }
  try {
    await client.createRoom({
      name: params.roomName,
      emptyTimeout: 3600,
      departureTimeout: 120,
      maxParticipants: Math.max(2, Math.min(200, params.maxParticipants || 30)),
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    });
    return { ok: true };
  } catch (err: any) {
    console.warn(`[livekit] createRoom(${params.roomName}) warning:`, err?.message || err);
    return { ok: false, error: err?.message || 'LiveKit room creation failed' };
  }
}

export async function deleteLiveKitRoom(roomName: string): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) {
    return { ok: true, skipped: true };
  }
  try {
    await client.deleteRoom(roomName);
    return { ok: true };
  } catch (err: any) {
    // 404 / room does not exist is safe on close
    const msg = String(err?.message || '');
    if (msg.toLowerCase().includes('not found') || msg.includes('404')) {
      return { ok: true };
    }
    console.warn(`[livekit] deleteRoom(${roomName}) warning:`, msg);
    return { ok: false, error: msg };
  }
}

export async function updateLiveKitParticipantPermissions(params: {
  roomName: string;
  identity: string;
  micAllowed: boolean;
  camAllowed: boolean;
  screenShareAllowed: boolean;
  chatAllowed: boolean;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) return { ok: true, skipped: true };

  const sources: TrackSource[] = [];
  if (params.micAllowed) sources.push(TrackSource.MICROPHONE);
  if (params.camAllowed) sources.push(TrackSource.CAMERA);
  if (params.screenShareAllowed) {
    sources.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);
  }

  try {
    await client.updateParticipant(params.roomName, params.identity, {
      permission: {
        canSubscribe: true,
        canPublish: sources.length > 0,
        canPublishSources: sources,
        canPublishData: params.chatAllowed,
        canUpdateMetadata: true,
      },
    });
    return { ok: true };
  } catch (err: any) {
    const msg = String(err?.message || '');
    // Ignore if participant isn't currently connected to LiveKit
    if (msg.toLowerCase().includes('not found')) {
      return { ok: true };
    }
    return { ok: false, error: msg };
  }
}

export async function muteLiveKitParticipantTracks(params: {
  roomName: string;
  identity: string;
  muteAudio?: boolean;
  muteVideo?: boolean;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) return { ok: true, skipped: true };

  try {
    const info = await client.getParticipant(params.roomName, params.identity);
    for (const track of info.tracks || []) {
      if (params.muteAudio && track.type === TrackType.AUDIO && track.source === TrackSource.MICROPHONE) {
        await client.mutePublishedTrack(params.roomName, params.identity, track.sid, true);
      }
      if (params.muteVideo && track.type === TrackType.VIDEO && track.source === TrackSource.CAMERA) {
        await client.mutePublishedTrack(params.roomName, params.identity, track.sid, true);
      }
    }
    return { ok: true };
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.toLowerCase().includes('not found')) return { ok: true };
    return { ok: false, error: msg };
  }
}

export async function muteAllStudentsInLiveKitRoom(params: {
  roomName: string;
  moderatorIdentities: Set<string>;
  muteAudio: boolean;
  muteVideo?: boolean;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) return { ok: true, skipped: true };

  try {
    const participants = await client.listParticipants(params.roomName);
    for (const p of participants) {
      if (params.moderatorIdentities.has(p.identity)) continue;
      for (const track of p.tracks || []) {
        if (params.muteAudio && track.type === TrackType.AUDIO) {
          await client.mutePublishedTrack(params.roomName, p.identity, track.sid, true).catch(() => {});
        }
        if (params.muteVideo && track.type === TrackType.VIDEO && track.source === TrackSource.CAMERA) {
          await client.mutePublishedTrack(params.roomName, p.identity, track.sid, true).catch(() => {});
        }
      }
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function removeLiveKitParticipant(
  roomName: string,
  identity: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) return { ok: true, skipped: true };

  try {
    await client.removeParticipant(roomName, identity);
    return { ok: true };
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.toLowerCase().includes('not found')) return { ok: true };
    return { ok: false, error: msg };
  }
}

export async function broadcastLiveKitRoomData(
  roomName: string,
  payload: Record<string, any>
): Promise<{ ok: boolean; skipped?: boolean }> {
  const cfg = getLiveKitConfig();
  const client = getRoomClient(cfg);
  if (!client) return { ok: true, skipped: true };

  try {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    await client.sendData(roomName, bytes, DataPacket_Kind.RELIABLE, { topic: 'edusmart-control' });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function startLiveKitEgressRecording(params: {
  roomName: string;
  recordingId: string;
}): Promise<{ egressId: string | null; recordingUrl: string | null; egressActive: boolean }> {
  const cfg = getLiveKitConfig();
  const egress = getEgressClient(cfg);
  if (!egress) {
    return { egressId: null, recordingUrl: null, egressActive: false };
  }
  try {
    const info = await egress.startRoomCompositeEgress(
      params.roomName,
      {
        file: {
          filepath: `edusmart-recordings/${params.roomName}-${params.recordingId}.mp4`,
        } as any,
      },
      { layout: 'speaker' }
    );
    return {
      egressId: info.egressId || null,
      recordingUrl: null,
      egressActive: Boolean(info.egressId),
    };
  } catch (err: any) {
    console.warn('[livekit] startRoomCompositeEgress fallback to classroom recording log:', err?.message || err);
    return { egressId: null, recordingUrl: null, egressActive: false };
  }
}

export async function stopLiveKitEgressRecording(egressId: string | null | undefined): Promise<void> {
  if (!egressId) return;
  const cfg = getLiveKitConfig();
  const egress = getEgressClient(cfg);
  if (!egress) return;
  try {
    await egress.stopEgress(egressId);
  } catch {
    // ignore if already stopped or egress unavailable
  }
}

export async function verifyLiveKitWebhook(
  rawBody: string,
  authHeader?: string
): Promise<WebhookEvent | null> {
  const cfg = getLiveKitConfig();
  const key = cfg.apiKey;
  const secret = cfg.webhookSecret || cfg.apiSecret;
  if (!key || !secret) {
    throw new Error('LiveKit webhook credentials (LIVEKIT_API_KEY / LIVEKIT_API_SECRET) are not configured.');
  }
  const receiver = new WebhookReceiver(key, secret);
  return await receiver.receive(rawBody, authHeader);
}

/**
 * Class-based LiveKit Service encapsulating server-side token minting,
 * programmatic room lifecycle, participant moderation, egress recording,
 * and webhook verification for EduSmart Virtual Classrooms.
 */
export class LiveKitService {
  getConfig(): LiveKitRuntimeConfig {
    return getLiveKitConfig();
  }

  buildRoomName(params: {
    schoolId: string;
    gradeId: string;
    lessonId: string;
    streamId?: string | null;
  }): string {
    return buildCanonicalLiveKitRoomName(params);
  }

  buildIdentity(params: { schoolId: string; userId: string }): string {
    return buildParticipantIdentity(params);
  }

  mintJoinToken(params: MintJoinTokenParams) {
    return mintLiveKitJoinToken(params);
  }

  createRoomForLesson(params: {
    roomName: string;
    maxParticipants: number;
    metadata?: Record<string, any>;
  }) {
    return ensureLiveKitRoom(params);
  }

  deleteRoom(roomName: string) {
    return deleteLiveKitRoom(roomName);
  }

  updateParticipantPermissions(params: {
    roomName: string;
    identity: string;
    micAllowed: boolean;
    camAllowed: boolean;
    screenShareAllowed: boolean;
    chatAllowed: boolean;
  }) {
    return updateLiveKitParticipantPermissions(params);
  }

  muteParticipantTracks(params: {
    roomName: string;
    identity: string;
    muteAudio?: boolean;
    muteVideo?: boolean;
  }) {
    return muteLiveKitParticipantTracks(params);
  }

  muteAllStudents(params: {
    roomName: string;
    moderatorIdentities: Set<string>;
    muteAudio: boolean;
    muteVideo?: boolean;
  }) {
    return muteAllStudentsInLiveKitRoom(params);
  }

  removeParticipant(roomName: string, identity: string) {
    return removeLiveKitParticipant(roomName, identity);
  }

  broadcastRoomData(roomName: string, payload: Record<string, any>) {
    return broadcastLiveKitRoomData(roomName, payload);
  }

  startRecording(params: { roomName: string; recordingId: string }) {
    return startLiveKitEgressRecording(params);
  }

  stopRecording(egressId: string | null | undefined) {
    return stopLiveKitEgressRecording(egressId);
  }

  verifyWebhook(rawBody: string, authHeader?: string) {
    return verifyLiveKitWebhook(rawBody, authHeader);
  }
}

export const liveKitService = new LiveKitService();

