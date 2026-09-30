import { describe, expect, it } from "vitest";

import {
  getCurrentWeekDateKeys,
  HISTORY_WINDOW_DAYS,
  readDailyHistory,
  recordDailyState,
} from "@/lib/daily-history";

describe("daily history", () => {
  it("returns Monday through Sunday for the current week", () => {
    expect(getCurrentWeekDateKeys("2026-09-29")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("retains seven local days and removes older records", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    for (let offset = HISTORY_WINDOW_DAYS; offset >= 0; offset -= 1) {
      const date = new Date(2026, 8, 29 - offset);
      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      recordDailyState(storage, {
        version: 1,
        date: dateKey,
        routine: date.getDay() === 0 ? "weekend" : "mon-wed",
        completed: ["make-bed"],
        mandatoryCompleted: ["care-for-cats"],
      });
    }

    const history = readDailyHistory(storage, "2026-09-29");
    expect(Object.keys(history.days)).toHaveLength(HISTORY_WINDOW_DAYS);
    expect(history.days["2026-09-22"]).toBeUndefined();
    expect(history.days["2026-09-23"]).toBeDefined();
    expect(history.days["2026-09-29"]?.completed).toEqual(["make-bed"]);
  });

  it("does not write records outside the seven-day window", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    const history = recordDailyState(
      storage,
      {
        version: 1,
        date: "2026-09-22",
        routine: "mon-wed",
        completed: ["make-bed"],
        mandatoryCompleted: ["care-for-cats"],
      },
      "2026-09-29",
    );

    expect(history.days["2026-09-22"]).toBeUndefined();
    expect(readDailyHistory(storage, "2026-09-29").days["2026-09-22"]).toBeUndefined();
  });
});
