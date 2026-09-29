"use client";

import { useEffect, useRef, useState } from "react";

export function ServiceWorkerManager() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const updateAccepted = useRef(false);

  useEffect(() => {
    const serviceWorker = navigator.serviceWorker;
    if (process.env.NODE_ENV !== "production" || !serviceWorker) {
      return;
    }

    let isMounted = true;
    let registration: ServiceWorkerRegistration | undefined;

    const handleControllerChange = () => {
      if (updateAccepted.current) {
        window.location.reload();
      }
    };

    const register = async () => {
      try {
        registration = await serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (registration.waiting && isMounted) {
          setWaitingWorker(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration?.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              serviceWorker.controller &&
              isMounted
            ) {
              setWaitingWorker(installingWorker);
            }
          });
        });
      } catch {
        // The app remains usable when service workers are unavailable or blocked.
      }
    };

    serviceWorker.addEventListener("controllerchange", handleControllerChange);
    void register();

    return () => {
      isMounted = false;
      serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!waitingWorker || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Atualização do aplicativo"
      className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-xl border-2 border-ink bg-lime p-4 shadow-[6px_6px_0_var(--color-ink)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-bold">Nova versão disponível</p>
          <p className="text-sm text-slate">Atualize quando estiver pronto.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="border-2 border-ink bg-ink px-4 py-2 font-bold text-paper"
            onClick={() => {
              updateAccepted.current = true;
              waitingWorker.postMessage({ type: "SKIP_WAITING" });
            }}
          >
            Atualizar
          </button>
          <button
            type="button"
            className="border-2 border-ink px-4 py-2 font-bold text-ink"
            onClick={() => setDismissed(true)}
          >
            Agora não
          </button>
        </div>
      </div>
    </aside>
  );
}
