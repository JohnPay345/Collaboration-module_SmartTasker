/**
 * Детерминированный LWW по журналу записей: побеждает больший t,
 * при равенстве — лексикографически больший u (tie-break между клиентами).
 */
export type LwwCell = { v: unknown; t: number; u: string };

export type CollabWrite = {value: {
  field: string;
  v: unknown;
  t: number;
  u: string
}};

export function materializeWrites(writes: readonly CollabWrite[]): Record<string, LwwCell> {
  const cells: Record<string, LwwCell> = {};
  for (const e of writes) {
    if (!e || typeof e.value.field !== 'string') continue;
    const t = Number(e.value.t) || 0;
    const u = String(e.value.u ?? '');
    const prev = cells[e.value.field];
    if (!prev || t > prev.t || (t === prev.t && u > prev.u)) {
      cells[e.value.field] = { v: e.value.v, t, u };
    }
  }
  return cells;
}

export function pickCell<T = unknown>(cells: Record<string, LwwCell>, field: string, fallback: T): T {
  const c = cells[field];
  if (c && c.v !== undefined && c.v !== null) return c.v as T;
  return fallback;
}
