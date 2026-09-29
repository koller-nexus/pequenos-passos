"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import { recordDailyState } from "@/lib/daily-history";

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
        className="mt-1 size-5 shrink-0 accent-cobalt"
      />
      <span
        className={`text-base leading-6 ${
          checked
            ? "text-slate line-through decoration-coral decoration-2"
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
    <nav aria-label="Rotinas da semana" className="flex gap-2 overflow-x-auto pb-1">
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
            className={`min-h-11 shrink-0 border-2 border-ink px-3 py-2 text-sm font-bold ${
              isSelected ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-lime"
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
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-2xl font-bold">
          {completed} de {total} concluídas
        </p>
        <p className="font-display text-xl font-bold text-cobalt">{percentage}%</p>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do dia"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        className="mt-2 h-4 border-2 border-ink bg-mist"
      >
        <div
          className="h-full bg-cobalt transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
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
      className="m-auto max-w-md border-2 border-ink bg-paper p-0 shadow-[8px_8px_0_var(--color-ink)]"
    >
      <div className="p-6">
        <h2 className="font-display text-2xl font-bold">Recomeçar o dia?</h2>
        <p className="mt-2 text-slate">
          Todas as marcações de hoje serão desfeitas. Essa ação não apaga as listas.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="min-h-11 border-2 border-ink px-4 py-2 font-bold"
            onClick={onCancel}
          >
            Continuar
          </button>
          <button
            type="button"
            className="min-h-11 border-2 border-ink bg-coral px-4 py-2 font-bold text-ink"
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
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="border-b-4 border-ink pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cobalt">Caderno de conquistas</p>
            <h1 className="mt-1 font-display text-4xl font-bold leading-none sm:text-5xl">
              Pequenos Passos
            </h1>
            <label className="mt-4 block max-w-xs">
              <span className="text-sm font-bold text-slate">Nome da criança</span>
              <input
                type="text"
                value={childName}
                maxLength={80}
                placeholder="Como você se chama?"
                onChange={(event) => updateChildName(event.target.value)}
                className="mt-1 min-h-11 w-full border-2 border-ink bg-white px-3 py-2 text-base font-bold placeholder:font-normal placeholder:text-slate"
              />
            </label>
          </div>
          <div className="flex flex-col items-end gap-3">
            <p className="max-w-48 text-right text-sm font-bold text-slate">
              {formatDate(state.date)}
            </p>
            <Link
              href="/familia"
              className="inline-flex min-h-11 items-center border-2 border-ink bg-cobalt px-4 py-2 font-bold text-white hover:bg-ink"
            >
              Ver relatório dos pais
            </Link>
          </div>
        </div>
        <div className="mt-7">
          <ProgressMeter completed={completed} total={total} />
        </div>
      </header>

      <section className="py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate">Rotina de hoje</h2>
            <p className="font-display text-3xl font-bold">{activePlan.label}</p>
          </div>
          <span className="border-2 border-ink bg-lime px-3 py-1 text-sm font-bold">
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
          <p className="mt-4 border-l-4 border-coral bg-mist px-3 py-2 text-sm font-bold">
            Consulta: somente as tarefas do dia atual podem ser marcadas.
          </p>
        ) : null}

        <div className="mt-4 border-2 border-ink bg-white px-4">
          {visiblePlan.tasks.map((task, index) => (
            <div key={`${visiblePlan.key}-${task.id}`} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-[1.35rem] w-6 shrink-0 font-display text-sm font-bold text-slate"
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

      <section className="border-t-4 border-ink py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate">Todos os dias</p>
            <h2 className="font-display text-3xl font-bold">Obrigatórios</h2>
          </div>
          <span className="border-2 border-ink bg-coral px-3 py-1 text-sm font-bold">
            {MANDATORY_TASKS.length} compromissos
          </span>
        </div>

        <div className="mt-4 border-2 border-ink bg-white px-4">
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

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t-4 border-ink pt-6">
        <p className="font-display text-xl font-bold">
          {allComplete ? "Tudo pronto por hoje." : "Continue um passo de cada vez."}
        </p>
        <button
          type="button"
          className="min-h-11 border-2 border-ink px-4 py-2 font-bold hover:bg-lime"
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
  );
}
