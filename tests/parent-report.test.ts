import { describe, expect, it } from "vitest";

import { buildParentReport } from "@/lib/parent-report";

describe("parent report", () => {
  it("reports seven scheduled days and distinguishes missing history", () => {
    const report = buildParentReport({
      childName: "Lia",
      todayKey: "2026-09-29",
      current: {
        version: 1,
        date: "2026-09-29",
        routine: "tue-thu-fri",
        completed: ["make-bed"],
        mandatoryCompleted: ["care-for-cats"],
      },
      history: {
        version: 1,
        days: {
          "2026-09-28": {
            routine: "mon-wed",
            completed: ["make-bed", "do-homework"],
            mandatoryCompleted: ["care-for-cats"],
          },
        },
      },
    });

    expect(report.days).toHaveLength(7);
    expect(report.days[0]?.dateKey).toBe("2026-09-23");
    expect(report.days[0]?.registered).toBe(false);
    expect(report.days[5]?.registered).toBe(true);
    expect(report.days[5]?.routineTasks).toContainEqual(
      expect.objectContaining({ id: "make-bed", completed: true }),
    );
    expect(report.days[6]?.registered).toBe(true);
    expect(report.days[6]?.completed).toBe(2);
  });

  it("calculates progress from routine and mandatory tasks", () => {
    const report = buildParentReport({
      childName: "",
      todayKey: "2026-09-29",
      current: {
        version: 1,
        date: "2026-09-29",
        routine: "tue-thu-fri",
        completed: ["make-bed"],
        mandatoryCompleted: ["care-for-cats"],
      },
      history: { version: 1, days: {} },
    });
    const today = report.days.at(-1);

    expect(today?.total).toBe(20 + 9);
    expect(today?.completed).toBe(2);
    expect(today?.percentage).toBe(Math.round((2 / 29) * 100));
  });

  it("builds progress for an explicit calendar week", () => {
    const report = buildParentReport({
      childName: "Lia",
      todayKey: "2026-09-29",
      current: {
        version: 1,
        date: "2026-09-29",
        routine: "tue-thu-fri",
        completed: ["make-bed"],
        mandatoryCompleted: ["care-for-cats"],
      },
      history: {
        version: 1,
        days: {
          "2026-09-28": {
            routine: "mon-wed",
            completed: ["make-bed"],
            mandatoryCompleted: ["care-for-cats"],
          },
        },
      },
      dateKeys: [
        "2026-09-28",
        "2026-09-29",
        "2026-09-30",
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-04",
      ],
    });

    expect(report.days.map((day) => day.dateKey)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(report.days[0]?.registered).toBe(true);
    expect(report.days[1]?.completed).toBe(2);
  });
});
