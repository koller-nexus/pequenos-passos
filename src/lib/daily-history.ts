import {
  getValidTaskIds,
  normalizeDailyState,
  type DailyState,
} from "@/lib/daily-state";
import { getRoutineForDate } from "@/data/routines";

export const HISTORY_STORAGE_KEY = "pequenos-passos:history:v1";
export const HISTORY_WINDOW_DAYS = 7;

export type DailyHistoryDay = Pick<
  DailyState,
  "routine" | "completed" | "mandatoryCompleted"
>;

export type DailyHistory = {
  version: 1;
  days: Record<string, DailyHistoryDay>;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

function parseDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isSameDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  return isSameDate ? date : null;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getRecentDateKeys(todayKey: string): string[] {
  const today = parseDateKey(todayKey);
  if (!today) {
    return [];
  }

  return Array.from({ length: HISTORY_WINDOW_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (HISTORY_WINDOW_DAYS - 1 - index));
    return formatDateKey(date);
  });
}

export function createDailyHistory(): DailyHistory {
  return { version: 1, days: {} };
}

function normalizeHistoryDay(
  value: unknown,
  dateKey: string,
  routine: DailyState["routine"],
): DailyHistoryDay | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DailyHistoryDay>;
  const validIds = getValidTaskIds(routine);
  const state = normalizeDailyState(
    {
      version: 1,
      date: dateKey,
      routine,
      completed: candidate.completed,
      mandatoryCompleted: candidate.mandatoryCompleted,
    },
    {
      date: dateKey,
      routine,
      ...validIds,
    },
  );

  return {
    routine,
    completed: state.completed,
    mandatoryCompleted: state.mandatoryCompleted,
  };
}

export function normalizeDailyHistory(
  value: unknown,
  todayKey: string,
): DailyHistory {
  if (!value || typeof value !== "object") {
    return createDailyHistory();
  }

  const candidate = value as Partial<DailyHistory>;
  if (candidate.version !== 1 || !candidate.days || typeof candidate.days !== "object") {
    return createDailyHistory();
  }

  const days: Record<string, DailyHistoryDay> = {};
  for (const dateKey of getRecentDateKeys(todayKey)) {
    const date = parseDateKey(dateKey);
    if (!date) {
      continue;
    }

    const routine = getRoutineForDate(date).key;
    const day = normalizeHistoryDay(candidate.days[dateKey], dateKey, routine);
    if (day) {
      days[dateKey] = day;
    }
  }

  return { version: 1, days };
}

export function readDailyHistory(
  storage: StorageLike,
  todayKey: string,
): DailyHistory {
  try {
    const serialized = storage.getItem(HISTORY_STORAGE_KEY);
    return normalizeDailyHistory(serialized ? JSON.parse(serialized) : null, todayKey);
  } catch {
    return createDailyHistory();
  }
}

export function recordDailyState(
  storage: StorageLike,
  state: DailyState,
  todayKey = state.date,
): DailyHistory {
  const history = readDailyHistory(storage, todayKey);
  if (!getRecentDateKeys(todayKey).includes(state.date)) {
    return history;
  }

  const validIds = getValidTaskIds(state.routine);
  const normalized = normalizeDailyState(state, {
    date: state.date,
    routine: state.routine,
    ...validIds,
  });

  history.days[state.date] = {
    routine: normalized.routine,
    completed: normalized.completed,
    mandatoryCompleted: normalized.mandatoryCompleted,
  };

  try {
    storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // The checklist remains usable when storage is unavailable.
  }

  return history;
}
