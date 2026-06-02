import { useEffect, useMemo, useState } from 'react';
import { getYjsDoc } from '@syncedstore/core';
import { createCollabStore, type CollabStore } from './collabStore';
import { bindCollabWebSocket } from './collabWebSocket';
import { materializeWrites } from './lwwMaterialize';

export type CollaborationParams = {
  userId: string;
  entityKind: 'task' | 'project';
  entityId: string;
};

export function useCollaborationRoom(enabled: boolean, params: CollaborationParams) {
  const store: CollabStore = useMemo(
    () => createCollabStore(),
    [params.entityKind, params.entityId]
  );

  // Re-render when Yjs state changes (remote or local). Avoids @syncedstore/react,
  // which bundles its own React 18 and breaks hooks under React 19.
  const [, setCollabVersion] = useState(0);
  useEffect(() => {
    const doc = getYjsDoc(store);
    const bump = () => setCollabVersion((v) => v + 1);
    doc.on('update', bump);
    return () => doc.off('update', bump);
  }, [store]);

  useEffect(() => {
    if (!enabled || !params.userId || !params.entityId) return;
    return bindCollabWebSocket(store, params);
  }, [enabled, params.userId, params.entityKind, params.entityId, store]);

  const materialized = materializeWrites(store.writes);

  const pushWrite = (field: string, v: unknown) => {
    store.writes.push({
      field,
      v,
      t: Date.now(),
      u: params.userId,
    });
  };

  return { store, materialized, pushWrite };
}
