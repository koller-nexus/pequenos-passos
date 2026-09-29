"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getTodayRoutine, getValidTaskIds, localDateKey, readDailyState } from "@/lib/daily-state";
import { readChildName } from "@/lib/child-name";
import { readDailyHistory } from "@/lib/daily-history";
import {
  buildParentReport,
  type ParentReport,
  type ParentReportDay,
  type ParentReportTask,
} from "@/lib/parent-report";

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

function TaskList({
  title,
  tasks,
  registered,
}: {
  title: string;
  tasks: ParentReportTask[];
  registered: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate">{title}</h3>
      <ul className="mt-2 border-t border-mist">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`flex min-h-10 items-start gap-2 border-b border-mist py-2 ${
              registered && task.completed ? "text-slate" : "text-ink"
            }`}
          >
            <span aria-hidden="true" className="w-6 shrink-0 font-bold">
              {!registered ? "—" : task.completed ? "✓" : "□"}
            </span>
            <span className={registered && task.completed ? "line-through" : undefined}>
              {task.label}
            </span>
            <span className="sr-only">
              {!registered ? " sem registro" : task.completed ? " concluída" : " pendente"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayReport({ day, index }: { day: ParentReportDay; index: number }) {
  return (
    <section
      className={`parent-report-day grid gap-5 border-t-4 border-ink py-7 md:grid-cols-[9rem_1fr] ${
        index === 6 ? "bg-lime/35 px-4 md:px-5" : ""
      }`}
    >
      <div>
        <p className="font-display text-sm font-bold text-cobalt">
          {index === 6 ? "HOJE" : `DIA ${String(index + 1).padStart(2, "0")}`}
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">
          {formatDate(day.dateKey)}
        </h2>
        <p className="mt-2 text-sm font-bold text-slate">{day.routineLabel}</p>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-display text-2xl font-bold">
            {day.registered ? `${day.completed} de ${day.total} concluídas` : "Sem registro neste dispositivo"}
          </p>
          {day.registered ? (
            <p className="font-display text-xl font-bold text-cobalt">{day.percentage}%</p>
          ) : null}
        </div>

        {day.registered ? (
          <div
            role="progressbar"
            aria-label={`Progresso de ${formatDate(day.dateKey)}`}
            aria-valuemin={0}
            aria-valuemax={day.total}
            aria-valuenow={day.completed}
            className="mt-2 h-3 border-2 border-ink bg-white"
          >
            <div className="h-full bg-cobalt" style={{ width: `${day.percentage}%` }} />
          </div>
        ) : (
          <p className="mt-2 border-l-4 border-coral bg-white px-3 py-2 text-sm">
            As tarefas previstas aparecem abaixo, sem marcar nenhuma como concluída ou pendente.
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TaskList title="Rotina do dia" tasks={day.routineTasks} registered={day.registered} />
          <TaskList
            title="Compromissos de todos os dias"
            tasks={day.mandatoryTasks}
            registered={day.registered}
          />
        </div>
      </div>
    </section>
  );
}

function loadReport(): ParentReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const todayKey = localDateKey();
  const routine = getTodayRoutine();
  const current = readDailyState(
    window.localStorage,
    todayKey,
    routine,
    getValidTaskIds(routine),
  );

  return buildParentReport({
    childName: readChildName(window.localStorage),
    todayKey,
    current,
    history: readDailyHistory(window.localStorage, todayKey),
  });
}

export function ParentReportView() {
  const [report, setReport] = useState<ParentReport | null>(null);

  useEffect(() => {
    const refresh = () => setReport(loadReport());
    refresh();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith("pequenos-passos:")) {
        refresh();
      }
    };
    const dayCheck = window.setInterval(refresh, 60_000);

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(dayCheck);
    };
  }, []);

  if (!report) {
    return (
      <section className="mx-auto flex min-h-dvh max-w-5xl items-center px-5 py-10">
        <p className="font-display text-2xl font-bold">Preparando o relatório...</p>
      </section>
    );
  }

  const registeredDays = report.days.filter((day) => day.registered);
  const completed = registeredDays.reduce((sum, day) => sum + day.completed, 0);
  const total = registeredDays.reduce((sum, day) => sum + day.total, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-[max(4rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="border-b-4 border-ink pb-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-cobalt">Caderno de conquistas</p>
            <h1 className="mt-1 font-display text-5xl font-bold leading-none sm:text-6xl">
              Para os pais
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-7">
              Um retrato local dos últimos sete dias, com a rotina e os compromissos registrados
              neste dispositivo.
            </p>
          </div>

          <div className="no-print flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center border-2 border-ink px-4 py-2 font-bold hover:bg-lime"
            >
              Voltar
            </Link>
            <button
              type="button"
              className="inline-flex min-h-11 items-center border-2 border-ink bg-cobalt px-4 py-2 font-bold text-white hover:bg-ink"
              onClick={() => window.print()}
            >
              Imprimir ou salvar em PDF
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 border-2 border-ink bg-white p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <p className="text-sm font-bold text-slate">Criança</p>
            <p className="mt-1 font-display text-3xl font-bold">{report.childName || "Sem nome informado"}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate">Período</p>
            <p className="mt-1 font-display text-xl font-bold">7 dias</p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate">Marcado no total</p>
            <p className="mt-1 font-display text-xl font-bold">
              {total === 0 ? "Sem registros" : `${completed} ${completed === 1 ? "marcação" : "marcações"}`}
            </p>
          </div>
        </div>

        <p className="print-guidance mt-3 text-sm text-slate">
          Para guardar uma cópia, use “Imprimir ou salvar em PDF” e escolha “Salvar como PDF”.
        </p>
      </header>

      <div className="mt-2">
        {report.days.map((day, index) => (
          <DayReport key={day.dateKey} day={day} index={index} />
        ))}
      </div>

      <footer className="border-t-4 border-ink pt-5 text-sm text-slate">
        Relatório gerado somente com dados guardados neste dispositivo. Os registros são limitados
        aos últimos sete dias.
      </footer>
    </div>
  );
}
