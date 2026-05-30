import * as Y from 'yjs';
import { getYjsDoc } from '@syncedstore/core';
import { BASE_URL } from '@/constants';
import type { CollabStore } from './collabStore';

const WS_BASE = BASE_URL.replace(/^http/, 'ws');

function uint8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

/**
 * Провайдер синхронизации: сервер шлёт полный state при connect,
 * далее — бинарные дельты Yjs.
 */
export function bindCollabWebSocket(
  store: CollabStore,
  params: { userId: string; entityKind: 'task' | 'project'; entityId: string }
): () => void {
  const doc = getYjsDoc(store);
  const url = `${WS_BASE}/ws/yjs/${encodeURIComponent(params.userId)}/${params.entityKind}/${encodeURIComponent(params.entityId)}`;
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  const onDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === 'collab-remote') return;
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(uint8ToArrayBuffer(update));
    } catch (e) {
      console.error('collab ws send', e);
    }
  };

  doc.on('update', onDocUpdate);

  ws.onmessage = (ev) => {
    try {
      const data = ev.data as ArrayBuffer;
      const u8 = new Uint8Array(data);
      Y.applyUpdate(doc, u8, 'collab-remote');
    } catch (e) {
      console.error('collab ws message', e);
    }
  };

  ws.onerror = () => {
    /* RN / web часто без полезного payload */
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
