import * as Y from 'yjs';
import { getYjsDoc } from '@syncedstore/core';
import { BASE_URL } from '@/constants';
import type { CollabStore } from './collabStore';

const WS_BASE = BASE_URL.replace(/^http/, 'ws');

function uint8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(u8.byteLength);
  new Uint8Array(buf).set(u8);
  return buf;
}

/**
 * Провайдер синхронизации: сервер шлёт полный state при connect,
 * далее — бинарные дельты Yjs. Дельты до onopen буферизуются.
 */
export function bindCollabWebSocket(
  store: CollabStore,
  params: { userId: string; entityKind: 'task' | 'project'; entityId: string }
): () => void {
  const doc = getYjsDoc(store);
  const url = `${WS_BASE}/ws/yjs/${encodeURIComponent(params.userId)}/${params.entityKind}/${encodeURIComponent(params.entityId)}`;
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  const pending: Uint8Array[] = [];
  let droppedWhileClosed = 0;

  const sendUpdate = (update: Uint8Array) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(uint8ToArrayBuffer(update));
      } catch (e) {
        console.error('[collab] ws send failed', e);
      }
      return;
    }
    if (ws.readyState === WebSocket.CONNECTING) {
      pending.push(update);
      return;
    }
    droppedWhileClosed += 1;
  };

  const flushPending = () => {
    while (pending.length > 0 && ws.readyState === WebSocket.OPEN) {
      const update = pending.shift()!;
      try {
        ws.send(uint8ToArrayBuffer(update));
      } catch (e) {
        console.error('[collab] ws flush send failed', e);
        break;
      }
    }
  };

  const onDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === 'collab-remote') return;
    sendUpdate(update);
  };

  doc.on('update', onDocUpdate);

  ws.onopen = () => {
    console.log(`[collab] ws open ${params.entityKind}/${params.entityId}`);
    flushPending();
  };

  ws.onmessage = (ev) => {
    try {
      const data = ev.data as ArrayBuffer;
      const u8 = new Uint8Array(data);
      Y.applyUpdate(doc, u8, 'collab-remote');
    } catch (e) {
      console.error('[collab] ws message apply failed', e);
    }
  };

  ws.onerror = (ev) => {
    console.warn('[collab] ws error', params.entityKind, params.entityId, ev);
  };

  ws.onclose = (ev) => {
    if (pending.length > 0 || droppedWhileClosed > 0) {
      console.warn(
        `[collab] ws closed code=${ev.code} pending=${pending.length} dropped=${droppedWhileClosed}`
      );
    }
    pending.length = 0;
  };

  return () => {
    doc.off('update', onDocUpdate);
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  };
}
