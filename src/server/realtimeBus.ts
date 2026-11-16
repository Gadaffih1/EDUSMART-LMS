import type { Response } from 'express';
import { notifyMySqlTablesChanged } from './db.ts';

export interface RealtimeClient {
  id: string;
  res: Response;
  userId: string | null;
  schoolId: string | null;
  isSuperAdmin: boolean;
}

export interface ChangeEventPayload {
  type: 'collection:updated' | 'record:created' | 'record:updated' | 'record:deleted' | 'settings:updated' | 'preferences:updated';
  collection: string;
  tenantId: string;
  recordId?: string;
  actorId?: string | null;
  timestamp: string;
}

const clients = new Map<string, RealtimeClient>();
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

function ensureKeepAlive() {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    for (const [id, client] of clients.entries()) {
      try {
        client.res.write(`: keepalive ${Date.now()}\n\n`);
      } catch {
        clients.delete(id);
      }
    }
  }, 25000);
  keepAliveInterval.unref();
}

export function registerSseClient(client: RealtimeClient): () => void {
  ensureKeepAlive();
  clients.set(client.id, client);
  try {
    client.res.write(
      `event: connected\ndata: ${JSON.stringify({
        clientId: client.id,
        schoolId: client.schoolId,
        isSuperAdmin: client.isSuperAdmin,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
  } catch {
    clients.delete(client.id);
  }

  return () => {
    clients.delete(client.id);
  };
}

export function broadcastChange(payload: ChangeEventPayload): void {
  if (payload.collection === 'user_preferences') {
    notifyMySqlTablesChanged(['user_preferences']);
  } else {
    notifyMySqlTablesChanged();
  }
  const message = `event: data-change\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [id, client] of clients.entries()) {
    // Enforce multi-tenant isolation on realtime push
    const isGlobal = !payload.tenantId || payload.tenantId === 'global';
    const allowed =
      client.isSuperAdmin ||
      isGlobal ||
      (client.schoolId && client.schoolId === payload.tenantId);

    if (!allowed) continue;

    try {
      client.res.write(message);
    } catch {
      clients.delete(id);
    }
  }
}

export function getRealtimeClientCount(): number {
  return clients.size;
}
