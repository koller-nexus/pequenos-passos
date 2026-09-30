"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";

import {
  getRoutineByKey,
  MANDATORY_TASKS,
  ROUTINES,
  type RoutineKey,
  type RoutineTask,
} from "@/data/routines";
import {
  createDailyState,
  getTodayRoutine,
  getValidTaskIds,
  isDailyStateComplete,
  localDateKey,
  readDailyState,
  STORAGE_KEY,
  toggleTaskId,
  writeDailyState,
  type DailyState,
} from "@/lib/daily-state";
import {
  CHILD_NAME_KEY,
  readChildName,
  writeChildName,
} from "@/lib/child-name";
import {
  getCurrentWeekDateKeys,
  readDailyHistory,
  recordDailyState,
} from "@/lib/daily-history";
import {
  buildParentReport,
  type ParentReportDay,
} from "@/lib/parent-report";

let cachedState: DailyState | null = null;
let cachedDay: string | null = null;
let cachedRoutine: RoutineKey | null = null;
const storeListeners = new Set<() => void>();
let cachedChildName: string | null = null;
const childNameListeners = new Set<() => void>();

function currentState(): DailyState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const date = localDateKey();
  const routine = getTodayRoutine();
  if (cachedDay !== date || cachedRoutine !== routine) {
    const validIds = getValidTaskIds(routine);
    cachedState = readDailyState(window.localStorage, date, routine, validIds);
    cachedDay = date;
    cachedRoutine = routine;
  }

  return cachedState;
}

function emitStoreChange() {
  for (const listener of storeListeners) {
    listener();
  }
}

function refreshCurrentState() {
  cachedDay = null;
  cachedState = currentState();
  emitStoreChange();
}

function subscribeToDailyState(listener: () => void) {
  storeListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }
    refreshCurrentState();
  };

  window.addEventListener("storage", handleStorage);
  const dayCheck = window.setInterval(refreshCurrentState, 60_000);

  return () => {
    storeListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
    window.clearInterval(dayCheck);
  };
}

function updateCurrentState(updater: (state: DailyState) => DailyState) {
  const state = currentState();
  if (!state) {
    return;
  }

  cachedState = updater(state);
  writeDailyState(window.localStorage, cachedState);
  recordDailyState(window.localStorage, cachedState, localDateKey());
  emitStoreChange();
}

function useDailyState() {
  return useSyncExternalStore(
    subscribeToDailyState,
    currentState,
    () => null,
  );
}

function childNameSnapshot(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (cachedChildName === null) {
    cachedChildName = readChildName(window.localStorage);
  }

  return cachedChildName;
}

function subscribeToChildName(listener: () => void) {
  childNameListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== CHILD_NAME_KEY) {
      return;
    }
    cachedChildName = readChildName(window.localStorage);
    for (const childNameListener of childNameListeners) {
      childNameListener();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    childNameListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateChildName(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  cachedChildName = value.slice(0, 80);
  writeChildName(window.localStorage, cachedChildName);
  for (const listener of childNameListeners) {
    listener();
  }
}

function useChildName() {
  return useSyncExternalStore(subscribeToChildName, childNameSnapshot, () => "") ?? "";
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

function formatWeekday(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(new Date(year, month - 1, day))
    .replace(".", "");
}

function TaskRow({
  task,
  checked,
  disabled,
  onChange,
}: {
  task: RoutineTask;
  checked: boolean;
  disabled: boolean;
  onChange: (taskId: string) => void;
}) {
  return (
    <label
      className={`flex min-h-14 items-start gap-3 border-b border-mist py-3 last:border-b-0 ${
        disabled ? "opacity-55" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(task.id)}
        className="mt-1 size-6 shrink-0 rounded-md accent-cobalt"
      />
      <span
        className={`text-base font-bold leading-6 ${
          checked
            ? "text-slate line-through decoration-mint decoration-[3px]"
            : "text-ink"
        }`}
      >
        {task.label}
      </span>
    </label>
  );
}

function RoutineTabs({
  activeRoutine,
  selectedRoutine,
  onSelect,
}: {
  activeRoutine: RoutineKey;
  selectedRoutine: RoutineKey;
  onSelect: (routine: RoutineKey) => void;
}) {
  return (
    <nav
      aria-label="Rotinas da semana"
      className="grid grid-cols-3 gap-2 pb-1 sm:flex"
    >
      {ROUTINES.map((routine) => {
        const isSelected = routine.key === selectedRoutine;
        const isToday = routine.key === activeRoutine;

        return (
          <button
            key={routine.key}
            type="button"
            aria-current={isToday ? "date" : undefined}
            aria-pressed={isSelected}
            onClick={() => onSelect(routine.key)}
            className={`min-h-11 rounded-xl border-2 border-ink px-2 py-2 text-sm font-bold leading-tight sm:shrink-0 sm:px-3 ${
              isSelected
                ? "bg-ink text-white"
                : routine.key === "mon-wed"
                  ? "bg-sky text-ink hover:-translate-y-0.5"
                  : routine.key === "tue-thu-fri"
                    ? "bg-sun text-ink hover:-translate-y-0.5"
                    : "bg-mint text-ink hover:-translate-y-0.5"
            }`}
          >
            {routine.shortLabel}
            {isToday ? <span className="ml-1 text-coral">•</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

function ProgressMeter({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-2xl font-bold leading-tight text-white">
          {completed} de {total} concluídas
        </p>
        <p className="font-display text-3xl font-bold tabular-nums text-lime">{percentage}%</p>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do dia"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        className="mt-3 h-5 overflow-hidden rounded-full border-2 border-white bg-white/25"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${
            percentage === 100 ? "bg-mint" : "bg-sun"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function WeekProgress({
  days,
  todayKey,
  completed,
  total,
  percentage,
}: {
  days: ParentReportDay[];
  todayKey: string;
  completed: number;
  total: number;
  percentage: number;
}) {
  return (
    <section
      aria-labelledby="week-progress-title"
      className="rounded-2xl border-2 border-ink bg-sky/70 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="week-progress-title" className="font-display text-3xl font-bold leading-tight">
            Andamento da semana
          </h2>
          <p className="mt-1 text-sm font-bold text-slate">Segunda a domingo</p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-bold tabular-nums text-cobalt">{percentage}%</p>
          <p
            className="text-sm font-bold text-slate"
            aria-label={`${completed} de ${total} passos até agora`}
          >
            <span className="sm:hidden">{completed}/{total} passos</span>
            <span className="hidden sm:inline">
              {completed} de {total} passos até agora
            </span>
          </p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Andamento da semana até agora"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        className="mt-4 h-5 overflow-hidden rounded-full border-2 border-ink bg-white"
      >
        <div
          className="h-full rounded-full bg-coral transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const isToday = day.dateKey === todayKey;
          const isFuture = day.dateKey > todayKey;
          const percentageLabel = isFuture
            ? "•"
            : day.registered
              ? `${day.percentage}%`
              : "—";
          const statusLabel = isFuture
            ? "previsto"
            : day.registered
              ? `${day.percentage}% concluído`
              : "sem registro";

          return (
            <li
              key={day.dateKey}
              aria-label={`${formatDate(day.dateKey)}: ${statusLabel}`}
              className={`min-w-0 rounded-xl border-2 px-1 py-2 text-center ${
                isToday
                  ? "border-cobalt bg-white"
                  : isFuture
                    ? "border-mist bg-white/55"
                    : day.percentage === 100
                      ? "border-ink bg-mint"
                      : day.registered
                        ? "border-ink bg-sun"
                        : "border-mist bg-white/75"
              }`}
            >
              <p className="text-xs font-bold text-slate">{formatWeekday(day.dateKey)}</p>
              <p className="mt-1 font-display text-lg font-bold leading-none tabular-nums">
                {Number(day.dateKey.slice(-2))}
              </p>
              <p className="mt-2 text-xs font-bold leading-3 text-ink tabular-nums">
                {percentageLabel}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ResetDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="m-auto max-w-md rounded-2xl bg-white p-0 shadow-2xl"
    >
      <div className="p-6">
        <h2 className="font-display text-2xl font-bold">Recomeçar o dia?</h2>
        <p className="mt-2 text-slate">
          Todas as marcações de hoje serão desfeitas. Essa ação não apaga as listas.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border-2 border-ink px-4 py-2 font-bold hover:bg-sky"
            onClick={onCancel}
          >
            Continuar
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border-2 border-ink bg-coral px-4 py-2 font-bold text-ink hover:bg-coral/80"
            onClick={onConfirm}
          >
            Recomeçar
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function RoutinePlanner() {
  const state = useDailyState();
  const childName = useChildName();
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineKey | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  if (!state) {
    return (
      <section className="mx-auto flex min-h-dvh max-w-3xl items-center px-5 py-10">
        <p className="font-display text-2xl font-bold">Preparando seu dia...</p>
      </section>
    );
  }

  const activeRoutine = state.routine;
  const activePlan = getRoutineByKey(activeRoutine);
  const visibleRoutine = selectedRoutine ?? activeRoutine;
  const visiblePlan = getRoutineByKey(visibleRoutine);
  const validIds = getValidTaskIds(activeRoutine);
  const total = activePlan.tasks.length + MANDATORY_TASKS.length;
  const completed = state.completed.length + state.mandatoryCompleted.length;
  const weekReport = buildParentReport({
    childName,
    todayKey: state.date,
    current: state,
    history: readDailyHistory(window.localStorage, state.date),
    dateKeys: getCurrentWeekDateKeys(state.date),
  });
  const elapsedWeekDays = weekReport.days.filter((day) => day.dateKey <= state.date);
  const weekCompleted = elapsedWeekDays.reduce((sum, day) => sum + day.completed, 0);
  const weekTotal = elapsedWeekDays.reduce((sum, day) => sum + day.total, 0);
  const weekPercentage =
    weekTotal === 0 ? 0 : Math.round((weekCompleted / weekTotal) * 100);
  const allComplete = isDailyStateComplete(
    state,
    validIds.validRoutineIds,
    validIds.validMandatoryIds,
  );
  const isViewingToday = visibleRoutine === activeRoutine;

  const toggleRoutineTask = (taskId: string) => {
    if (!isViewingToday) {
      return;
    }

    updateCurrentState((current) => ({
      ...current,
      completed: toggleTaskId(current.completed, taskId),
    }));
  };

  const toggleMandatoryTask = (taskId: string) => {
    updateCurrentState((current) => ({
      ...current,
      mandatoryCompleted: toggleTaskId(current.mandatoryCompleted, taskId),
    }));
  };

  return (
    <div className="mx-auto max-w-3xl pb-[max(4rem,env(safe-area-inset-bottom))]">
      <header className="rounded-b-[32px] bg-cobalt px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-2 border-white bg-white p-1.5">
              <Image
                src="/icons/icon.svg"
                alt=""
                width={52}
                height={52}
                priority
                className="size-12"
              />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold leading-none sm:text-5xl">
                Pequenos Passos
              </h1>
              <p className="mt-2 max-w-xs text-sm font-bold text-white">
                Cada tarefa é um passo para uma semana mais leve.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <p className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              {formatDate(state.date)}
            </p>
            <Link
              href="/familia"
              className="inline-flex min-h-11 items-center rounded-xl border-2 border-ink bg-sun px-4 py-2 font-bold text-ink hover:bg-lime"
            >
              Ver relatório dos pais
            </Link>
          </div>
        </div>
        <label className="mt-6 block max-w-xs">
          <span className="text-sm font-bold text-white">Nome da criança</span>
              <input
                type="text"
                value={childName}
                maxLength={80}
                placeholder="Como você se chama?"
                onChange={(event) => updateChildName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-base font-bold text-ink placeholder:font-normal placeholder:text-slate"
              />
        </label>
        <div className="mt-6">
          <ProgressMeter completed={completed} total={total} />
        </div>
      </header>

      <div className="px-5">
        <div className="mt-6">
          <WeekProgress
            days={weekReport.days}
            todayKey={state.date}
            completed={weekCompleted}
            total={weekTotal}
            percentage={weekPercentage}
          />
        </div>

      <section className="pb-7 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">Rotina de hoje</h2>
            <p className="mt-1 text-lg font-bold text-slate">{activePlan.label}</p>
          </div>
          <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-bold">
            {activePlan.tasks.length} passos
          </span>
        </div>

        <div className="mt-5">
          <RoutineTabs
            activeRoutine={activeRoutine}
            selectedRoutine={visibleRoutine}
            onSelect={setSelectedRoutine}
          />
        </div>

        {!isViewingToday ? (
          <p className="mt-4 rounded-xl border-2 border-ink bg-coral/25 px-3 py-2 text-sm font-bold">
            Consulta: somente as tarefas do dia atual podem ser marcadas.
          </p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-ink bg-white px-4">
          {visiblePlan.tasks.map((task, index) => (
            <div key={`${visiblePlan.key}-${task.id}`} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-2.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-sky font-display text-xs font-bold text-ink"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <TaskRow
                  task={task}
                  checked={isViewingToday && state.completed.includes(task.id)}
                  disabled={!isViewingToday}
                  onChange={toggleRoutineTask}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-mist py-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">
              Cuidados de todo dia
            </h2>
          </div>
          <span className="rounded-full border-2 border-ink bg-coral px-3 py-1 text-sm font-bold">
            {MANDATORY_TASKS.length} cuidados
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-ink bg-white px-4">
          {MANDATORY_TASKS.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              checked={state.mandatoryCompleted.includes(task.id)}
              disabled={false}
              onChange={toggleMandatoryTask}
            />
          ))}
        </div>
      </section>

      <footer
        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink p-4 ${
          allComplete ? "bg-mint" : "bg-white"
        }`}
      >
        <div>
          <p className="font-display text-2xl font-bold leading-tight">
            {allComplete ? "Uhuul! Dia completo!" : "Continue um passo de cada vez."}
          </p>
          <p className="mt-1 text-sm font-bold text-slate">
            {allComplete ? "Você cuidou de tudo hoje." : "Cada passo conta."}
          </p>
        </div>
        <button
          type="button"
          className="min-h-11 rounded-xl border-2 border-ink px-4 py-2 font-bold hover:bg-sun"
          onClick={() => setResetOpen(true)}
        >
          Recomeçar o dia
        </button>
      </footer>

      <ResetDialog
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          updateCurrentState((current) =>
            createDailyState(current.date, current.routine),
          );
          setResetOpen(false);
        }}
      />
      </div>
    </div>
  );
}
