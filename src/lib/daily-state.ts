import {
  getRoutineByKey,
  getRoutineForDate,
  MANDATORY_TASKS,
  type RoutineKey,
} from "@/data/routines";

export const STORAGE_KEY = "pequenos-passos:daily:v1";

export type DailyState = {
  version: 1;
  date: string;
  routine: RoutineKey;
  completed: string[];
  mandatoryCompleted: string[];
};

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

type ValidTaskIds = ReadonlySet<string> | readonly string[];

type NormalizeOptions = {
  date: string;
  routine: RoutineKey;
  validRoutineIds: ValidTaskIds;
  validMandatoryIds: ValidTaskIds;
};

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createDailyState(date: string, routine: RoutineKey): DailyState {
  return {
    version: 1,
    date,
    routine,
    completed: [],
    mandatoryCompleted: [],
  };
}

function containsId(validIds: ValidTaskIds, id: string): boolean {
  return "has" in validIds ? validIds.has(id) : validIds.includes(id);
}

function normalizeIds(value: unknown, validIds: ValidTaskIds): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(value.filter((id): id is string => typeof id === "string" && containsId(validIds, id))),
  ];
}

export function normalizeDailyState(
  value: unknown,
  options: NormalizeOptions,
): DailyState {
  if (!value || typeof value !== "object") {
    return createDailyState(options.date, options.routine);
  }

  const candidate = value as Partial<DailyState>;
  const isCurrentDay =
    candidate.version === 1 &&
    candidate.date === options.date &&
    candidate.routine === options.routine;

  if (!isCurrentDay) {
    return createDailyState(options.date, options.routine);
  }

  return {
    version: 1,
    date: options.date,
    routine: options.routine,
    completed: normalizeIds(candidate.completed, options.validRoutineIds),
    mandatoryCompleted: normalizeIds(
      candidate.mandatoryCompleted,
      options.validMandatoryIds,
    ),
  };
}

export function readDailyState(
  storage: StorageLike,
  date: string,
  routine: RoutineKey,
  options: Omit<NormalizeOptions, "date" | "routine">,
): DailyState {
  try {
    const serialized = storage.getItem(STORAGE_KEY);
    return normalizeDailyState(serialized ? JSON.parse(serialized) : null, {
      ...options,
      date,
      routine,
    });
  } catch {
    return createDailyState(date, routine);
  }
}

export function writeDailyState(storage: StorageLike, state: DailyState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The checklist remains usable when private browsing or storage quotas block writes.
  }
}

export function toggleTaskId(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter((candidate) => candidate !== id)
    : [...ids, id];
}

export function isDailyStateComplete(
  state: DailyState,
  validRoutineIds: string[],
  validMandatoryIds: string[],
): boolean {
  const completedRoutine = new Set(state.completed);
  const completedMandatory = new Set(state.mandatoryCompleted);

  return (
    validRoutineIds.length > 0 &&
    validMandatoryIds.length > 0 &&
    validRoutineIds.every((id) => completedRoutine.has(id)) &&
    validMandatoryIds.every((id) => completedMandatory.has(id))
  );
}

export function getValidTaskIds(routine: RoutineKey): {
  validRoutineIds: string[];
  validMandatoryIds: string[];
} {
  return {
    validRoutineIds: getRoutineByKey(routine).tasks.map((task) => task.id),
    validMandatoryIds: MANDATORY_TASKS.map((task) => task.id),
  };
}

export function getTodayRoutine(date: Date = new Date()): RoutineKey {
  return getRoutineForDate(date).key;
}
