import { describe, expect, it, vi } from "vitest";

import {
  createDailyState,
  isDailyStateComplete,
  normalizeDailyState,
  readDailyState,
  toggleTaskId,
  writeDailyState,
} from "@/lib/daily-state";

describe("daily state", () => {
  it("creates a minimal state for a local date and routine", () => {
    expect(createDailyState("2026-09-29", "tue-thu-fri")).toEqual({
      version: 1,
      date: "2026-09-29",
      routine: "tue-thu-fri",
      completed: [],
      mandatoryCompleted: [],
    });
  });

  it("normalizes duplicates and invalid task ids", () => {
    expect(
      normalizeDailyState(
        {
          version: 1,
          date: "2026-09-29",
          routine: "tue-thu-fri",
          completed: ["make-bed", "make-bed", "invalid"],
          mandatoryCompleted: ["tell-truth", "unknown"],
        },
        {
          date: "2026-09-29",
          routine: "tue-thu-fri",
          validRoutineIds: new Set(["make-bed", "go-to-school"]),
          validMandatoryIds: new Set(["tell-truth", "care-for-cats"]),
        },
      ),
    ).toEqual({
      version: 1,
      date: "2026-09-29",
      routine: "tue-thu-fri",
      completed: ["make-bed"],
      mandatoryCompleted: ["tell-truth"],
    });
  });

  it("starts a new day instead of reusing stale completion data", () => {
    expect(
      normalizeDailyState(
        {
          version: 1,
          date: "2026-09-28",
          routine: "mon-wed",
          completed: ["make-bed"],
          mandatoryCompleted: ["tell-truth"],
        },
        {
          date: "2026-09-29",
          routine: "tue-thu-fri",
          validRoutineIds: new Set(["make-bed"]),
          validMandatoryIds: new Set(["tell-truth"]),
        },
      ),
    ).toEqual(createDailyState("2026-09-29", "tue-thu-fri"));
  });

  it("recovers from malformed or unavailable storage", () => {
    const malformedStorage = {
      getItem: vi.fn(() => "{not-json"),
      setItem: vi.fn(),
    };
    expect(
      readDailyState(malformedStorage, "2026-09-29", "tue-thu-fri", {
        validRoutineIds: new Set(["make-bed"]),
        validMandatoryIds: new Set(["tell-truth"]),
      }),
    ).toEqual(createDailyState("2026-09-29", "tue-thu-fri"));

    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error("storage disabled");
      }),
      setItem: vi.fn(() => {
        throw new Error("storage disabled");
      }),
    };
    expect(() =>
      writeDailyState(unavailableStorage, createDailyState("2026-09-29", "tue-thu-fri")),
    ).not.toThrow();
  });

  it("toggles ids without mutating the current list", () => {
    expect(toggleTaskId([], "make-bed")).toEqual(["make-bed"]);
    expect(toggleTaskId(["make-bed"], "make-bed")).toEqual([]);
  });

  it("reports completion only when routine and mandatory lists are complete", () => {
    expect(
      isDailyStateComplete(
        {
          version: 1,
          date: "2026-09-29",
          routine: "tue-thu-fri",
          completed: ["make-bed"],
          mandatoryCompleted: ["tell-truth"],
        },
        ["make-bed"],
        ["tell-truth"],
      ),
    ).toBe(true);
    expect(
      isDailyStateComplete(
        {
          version: 1,
          date: "2026-09-29",
          routine: "tue-thu-fri",
          completed: [],
          mandatoryCompleted: ["tell-truth"],
        },
        ["make-bed"],
        ["tell-truth"],
      ),
    ).toBe(false);
  });
});
