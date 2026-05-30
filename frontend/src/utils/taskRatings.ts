export const TASK_RATING_LEVELS = ['1', '2', '3', '4', '5'] as const;
export type TaskRatingLevel = (typeof TASK_RATING_LEVELS)[number];

const RATING_LABELS: Record<TaskRatingLevel, string> = {
  '1': '1 — Очень низкий',
  '2': '2 — Низкий',
  '3': '3 — Средний',
  '4': '4 — Высокий',
  '5': '5 — Очень высокий',
};

/** Нормализует значение из API или старого UI в '1'…'5'. */
export function toRatingLevel(value: string | undefined | null, fallback: TaskRatingLevel = '3'): TaskRatingLevel {
  if (!value) return fallback;
  const trimmed = String(value).trim();
  if (TASK_RATING_LEVELS.includes(trimmed as TaskRatingLevel)) {
    return trimmed as TaskRatingLevel;
  }
  const digit = trimmed.match(/^(\d)/)?.[1];
  if (digit && TASK_RATING_LEVELS.includes(digit as TaskRatingLevel)) {
    return digit as TaskRatingLevel;
  }
  return fallback;
}

export function ratingLabel(value: string | undefined | null): string {
  return RATING_LABELS[toRatingLevel(value)];
}

export const RATING_PICKER_ITEMS = TASK_RATING_LEVELS.map((level) => ({
  value: level,
  label: RATING_LABELS[level],
}));
