import * as Y from 'yjs';
import { pool, redisClient, ensureRedisConnected } from '#root/service/connection.js';

const ROOM_TASK = 'task';
const ROOM_PROJECT = 'project';

const TASK_SYNC_FIELDS = [
  'task_name',
  'description',
  'status',
  'is_urgent',
  'priority',
  'value',
  'effort',
  'start_date',
  'end_date',
  'estimated_duration',
  'priority_assessment',
  'qualification_assessment',
  'load_assessment',
  'required_skills',
];

const PROJECT_SYNC_FIELDS = [
  'project_name',
  'description',
  'status',
  'start_date',
  'end_date',
  'tags',
];

/** LWW: побеждает больший t, при равенстве — лексикографически больший u (tie-break). */
export function materializeWritesFromDoc(doc) {
  const arr = doc.getArray('writes');
  const cells = {};
  arr.forEach((item) => {
    const e = item instanceof Y.AbstractType ? item.toJSON() : item;
    if (!e || typeof e.field !== 'string') return;
    const t = Number(e.t) || 0;
    const u = String(e.u ?? '');
    const prev = cells[e.field];
    if (!prev || t > prev.t || (t === prev.t && u > prev.u)) {
      cells[e.field] = { v: e.v, t, u };
    }
  });
  return cells;
}

function redisDocKey(kind, id) {
  return `yjs:doc:${kind}:${id}`;
}

function parseRoomPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 5 || segments[0] !== 'ws' || segments[1] !== 'yjs') return null;
  const userId = segments[2];
  const entityKind = segments[3];
  const entityId = segments[4];
  if (entityKind !== ROOM_TASK && entityKind !== ROOM_PROJECT) return null;
  if (!userId || !entityId) return null;
  return { userId, entityKind, entityId };
}

const rooms = new Map();
const roomCreateLocks = new Map();

function roomKey(kind, id) {
  return `${kind}:${id}`;
}

async function loadEntityRow(kind, id) {
  if (kind === ROOM_TASK) {
    const r = await pool.query(
      `SELECT task_id, task_name, description, status, is_urgent, priority, value, effort,
              start_date, end_date, estimated_duration, priority_assessment, qualification_assessment,
              load_assessment, required_skills, yjs_state
       FROM tasks WHERE task_id = $1`,
      [id]
    );
    return r.rows[0] ?? null;
  }
  const r = await pool.query(
    `SELECT project_id, project_name, description, status, start_date, end_date, tags, yjs_state
     FROM projects WHERE project_id = $1`,
    [id]
  );
  return r.rows[0] ?? null;
}

function seedDocFromRow(doc, kind, row) {
  const writes = doc.getArray('writes');
  if (writes.length > 0) return;
  const fields = kind === ROOM_TASK ? TASK_SYNC_FIELDS : PROJECT_SYNC_FIELDS;
  const baseT = Date.now();
  const seedUser = '00000000-0000-0000-0000-000000000001';
  doc.transact(() => {
    for (const field of fields) {
      if (row[field] === undefined || row[field] === null) continue;
      let v = row[field];
      if (field === 'required_skills' || field === 'tags') {
        v = Array.isArray(v) ? [...v] : v;
      } else if (field === 'start_date' || field === 'end_date') {
        v = row[field] instanceof Date ? row[field].toISOString() : String(row[field]);
      }
      writes.push([{ field, v, t: baseT, u: seedUser }]);
    }
  }, 'seed');
}

async function createRoomDocument(kind, id) {
  const doc = new Y.Doc();
  await ensureRedisConnected();
  const rkey = redisDocKey(kind, id);
  const raw = await redisClient.get(rkey);
  let redisState = null;

  if (Buffer.isBuffer(raw)) {
    redisState = raw;
  } else if (raw instanceof Uint8Array) {
    redisState = Buffer.from(raw);
  } else if (typeof raw === 'string') {
    // In redis@5 Yjs snapshots must be read as binary. String means type mapping failed.
    console.warn('Redis returned string for Yjs state, skipping cached state');
  }

  if (redisState && redisState.length) {
    try {
      Y.applyUpdate(doc, new Uint8Array(redisState), 'bootstrap');
    } catch (e) {
      console.warn('Corrupted Redis Yjs state, dropping cache', e);
      await redisClient.del(rkey);
    }
  }
  if (doc.getArray('writes').length === 0) {
    const row = await loadEntityRow(kind, id);
    if (!row) {
      return { doc: null, error: 'not_found' };
    }
    if (row.yjs_state && row.yjs_state.length) {
      Y.applyUpdate(doc, new Uint8Array(row.yjs_state), 'bootstrap');
    }
    if (doc.getArray('writes').length === 0) {
      seedDocFromRow(doc, kind, row);
    }
  }
  return { doc, error: null };
}

function schedulePersist(kind, id, doc) {
  const key = roomKey(kind, id);
  const room = rooms.get(key);
  if (!room) return;
  if (room.persistTimer) clearTimeout(room.persistTimer);
  room.persistTimer = setTimeout(() => {
    room.persistTimer = null;
    persistRoom(kind, id, doc).catch((e) => console.error('yjs persist error', e));
  }, 1500);
}

async function persistRoom(kind, id, doc) {
  const full = Buffer.from(Y.encodeStateAsUpdate(doc));
  const cells = materializeWritesFromDoc(doc);
  await ensureRedisConnected();
  await redisClient.set(redisDocKey(kind, id), full);

  if (kind === ROOM_TASK) {
    await pool.query('UPDATE tasks SET yjs_state = $1, updated_at = NOW() WHERE task_id = $2', [
      full,
      id,
    ]);
    const sets = [];
    const vals = [];
    let i = 1;
    for (const field of TASK_SYNC_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(cells, field)) continue;
      let val = cells[field].v;
      if (field === 'required_skills' && val != null && typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          /* keep string */
        }
      }
      sets.push(`${field} = $${i++}`);
      vals.push(val);
    }
    if (sets.length) {
      vals.push(id);
      await pool.query(
        `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW() WHERE task_id = $${i}`,
        vals
      );
    }
    return;
  }

  await pool.query('UPDATE projects SET yjs_state = $1, updated_at = NOW() WHERE project_id = $2', [
    full,
    id,
  ]);
  const sets = [];
  const vals = [];
  let i = 1;
  for (const field of PROJECT_SYNC_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(cells, field)) continue;
    let val = cells[field].v;
    if (field === 'tags' && val != null && typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        /* keep */
      }
    }
    sets.push(`${field} = $${i++}`);
    vals.push(val);
  }

  if (sets.length) {
    vals.push(id);
    await pool.query(
      `UPDATE projects SET ${sets.join(', ')}, updated_at = NOW() WHERE project_id = $${i}`,
      vals
    );
  }
}

async function getOrCreateRoom(kind, id) {
  const key = roomKey(kind, id);
  if (rooms.has(key)) {
    const existing = rooms.get(key);
    return { ...existing, error: null };
  }

  if (!roomCreateLocks.has(key)) {
    roomCreateLocks.set(
      key,
      (async () => {
        try {
          const { doc, error } = await createRoomDocument(kind, id);
          if (error || !doc) {
            return { error: error || 'load_failed', doc: null, sockets: null };
          }

          const room = {
            doc,
            sockets: new Set(),
            persistTimer: null,
            kind,
            entityId: id,
            onUpdate: (update, origin) => {
              const buf = Buffer.from(Y.encodeStateAsUpdate(doc));
              ensureRedisConnected()
                .then(() => redisClient.set(redisDocKey(kind, id), buf))
                .catch((e) => console.error('Redis set yjs', e));

              for (const socket of room.sockets) {
                if (socket === origin) continue;
                if (socket.readyState === 1) {
                  try {
                    socket.send(Buffer.from(update));
                  } catch (e) {
                    console.error('yjs broadcast', e);
                  }
                }
              }
              schedulePersist(kind, id, doc);
            },
          };

          doc.on('update', room.onUpdate);
          rooms.set(key, room);
          return { ...room, error: null };
        } finally {
          roomCreateLocks.delete(key);
        }
      })()
    );
  }

  const lock = roomCreateLocks.get(key);
  const outcome = await lock;
  if (outcome?.error || !outcome?.doc) {
    return outcome ?? { error: 'load_failed', doc: null, sockets: null };
  }
  const live = rooms.get(key);
  if (live) return { ...live, error: null };
  return outcome;
}

async function closeRoomIfEmpty(kind, id) {
  const key = roomKey(kind, id);
  const room = rooms.get(key);
  if (!room || room.sockets.size > 0) return;
  if (room.persistTimer) {
    clearTimeout(room.persistTimer);
    room.persistTimer = null;
  }
  try {
    await persistRoom(kind, id, room.doc);
  } catch (e) {
    console.error('yjs final persist', e);
  }
  room.doc.off('update', room.onUpdate);
  room.doc.destroy();
  rooms.delete(key);
}

/** Подключает клиента к комнате Yjs (бинарный протокол: сначала полный state, далее только дельты). */
export async function handleYjsConnection(ws, req) {
  const pathname = (req.url || '').split('?')[0];
  const parsed = parseRoomPath(pathname);
  if (!parsed) {
    ws.close(4000, 'bad path');
    return;
  }
  const { entityKind, entityId } = parsed;

  const room = await getOrCreateRoom(entityKind, entityId);
  if (room.error || !room.doc || !room.sockets) {
    ws.close(4004, 'not found');
    return;
  }

  const { doc, sockets } = room;
  sockets.add(ws);

  try {
    const snapshot = Y.encodeStateAsUpdate(doc);
    ws.send(Buffer.from(snapshot));
  } catch (e) {
    console.error('yjs initial send', e);
    sockets.delete(ws);
    await closeRoomIfEmpty(entityKind, entityId);
    ws.close();
    return;
  }

  ws.binaryType = 'arraybuffer';
  ws.on('message', (data) => {
    try {
      const u8 =
        data instanceof Buffer
          ? new Uint8Array(data)
          : new Uint8Array(data instanceof ArrayBuffer ? data : Buffer.from(data));
      Y.applyUpdate(doc, u8, ws);
    } catch (e) {
      console.error('yjs applyUpdate', e);
    }
  });

  ws.on('close', () => {
    sockets.delete(ws);
    void closeRoomIfEmpty(entityKind, entityId);
  });
  ws.on('error', () => {
    sockets.delete(ws);
    void closeRoomIfEmpty(entityKind, entityId);
  });
}
