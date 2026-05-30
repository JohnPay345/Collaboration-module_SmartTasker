import { syncedStore, type SyncedStore } from '@syncedstore/core';
import type { CollabWrite } from './lwwMaterialize';

export type CollabStore = SyncedStore<{ writes: CollabWrite[] }>;

export function createCollabStore(): CollabStore {
  return syncedStore({ writes: [] as CollabWrite[] });
}
