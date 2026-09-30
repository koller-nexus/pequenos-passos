import {
  getRoutineForDate,
  MANDATORY_TASKS,
  type RoutineTask,
} from "@/data/routines";
import { getRecentDateKeys, type DailyHistory } from "@/lib/daily-history";
import type { DailyState } from "@/lib/daily-state";

export type ParentReportTask = RoutineTask & {
  completed: boolean;
};

export type ParentReportDay = {
  dateKey: string;
  routineLabel: string;
  registered: boolean;
  completed: number;
  total: number;
  percentage: number;
  routineTasks: ParentReportTask[];
  mandatoryTasks: ParentReportTask[];
};

export type ParentReport = {
  childName: string;
  todayKey: string;
  days: ParentReportDay[];
};

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toReportTasks(
  tasks: RoutineTask[],
  completedIds: readonly string[],
): ParentReportTask[] {
  const completed = new Set(completedIds);
  return tasks.map((task) => ({
    ...task,
    completed: completed.has(task.id),
  }));
}

export function buildParentReport(input: {
  childName: string;
  todayKey: string;
  current: DailyState;
  history: DailyHistory;
  dateKeys?: string[];
}): ParentReport {
  const dateKeys = input.dateKeys ?? getRecentDateKeys(input.todayKey);
  const days = dateKeys.map((dateKey): ParentReportDay => {
    const plan = getRoutineForDate(parseDateKey(dateKey));
    const rawState = dateKey === input.current.date
      ? input.current
      : input.history.days[dateKey];
    const routineTasks = toReportTasks(
      plan.tasks,
      rawState?.completed ?? [],
    );
    const mandatoryTasks = toReportTasks(
      MANDATORY_TASKS,
      rawState?.mandatoryCompleted ?? [],
    );
    const completed =
      routineTasks.filter((task) => task.completed).length +
      mandatoryTasks.filter((task) => task.completed).length;
    const total = routineTasks.length + mandatoryTasks.length;

    return {
      dateKey,
      routineLabel: plan.label,
      registered: dateKey === input.current.date || Boolean(rawState),
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
      routineTasks,
      mandatoryTasks,
    };
  });

  return {
    childName: input.childName.trim(),
    todayKey: input.todayKey,
    days,
  };
}
