/**
 * Детерминированный LWW по журналу записей: побеждает больший t,
 * при равенстве — лексикографически больший u (tie-break между клиентами).
 */
export type LwwCell = { v: unknown; t: number; u: string };

export type CollabWrite = {
  field: string;
  v: unknown;
  t: number;
  u: string;
};

/** Плоский формат { field, v, t, u } и legacy { value: { … } } из старых клиентов. */
export function normalizeWriteEntry(raw: unknown): CollabWrite | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const inner =
    e.value && typeof e.value === 'object' && typeof (e.value as CollabWrite).field === 'string'
      ? (e.value as CollabWrite)
      : (e as Partial<CollabWrite>);
  if (typeof inner.field !== 'string') return null;
  return {
    field: inner.field,
    v: inner.v,
    t: Number(inner.t) || 0,
    u: String(inner.u ?? ''),
  };
}

export function materializeWrites(writes: readonly unknown[]): Record<string, LwwCell> {
  const cells: Record<string, LwwCell> = {};
  for (const raw of writes) {
    const e = normalizeWriteEntry(raw);
    if (!e) continue;
    const prev = cells[e.field];
    if (!prev || e.t > prev.t || (e.t === prev.t && e.u > prev.u)) {
      cells[e.field] = { v: e.v, t: e.t, u: e.u };
    }
  }
  return cells;
}

export function pickCell<T = unknown>(cells: Record<string, LwwCell>, field: string, fallback: T): T {
  const c = cells[field];
  if (c && c.v !== undefined && c.v !== null) return c.v as T;
  return fallback;
}
