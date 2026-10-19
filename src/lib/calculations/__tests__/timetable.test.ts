import { describe, it, expect } from "vitest";
import {
  detectTimetableConflicts,
  timeStringToMinutes,
  doSlotsOverlap,
} from "../timetable";

describe("Timetable Conflict Detection", () => {
  it("converts time string to minutes accurately", () => {
    expect(timeStringToMinutes("08:30")).toBe(510);
    expect(timeStringToMinutes("12:00")).toBe(720);
    expect(timeStringToMinutes("14:45")).toBe(885);
  });

  it("identifies overlapping intervals", () => {
    // 08:30 - 09:30 (510 - 570) and 09:00 - 10:00 (540 - 600) -> overlaps
    expect(doSlotsOverlap(510, 570, 540, 600)).toBe(true);

    // Adjacent non-overlapping: 08:30 - 09:30 (510 - 570) and 09:30 - 10:30 (570 - 630) -> no overlap
    expect(doSlotsOverlap(510, 570, 570, 630)).toBe(false);
  });

  it("detects conflict with existing class on same day", () => {
    const existing = [
      {
        id: "slot-1",
        dayOfWeek: "MON",
        startTime: "08:30",
        endTime: "09:30",
        subjectName: "Engineering Mathematics",
      },
      {
        id: "slot-2",
        dayOfWeek: "MON",
        startTime: "09:45",
        endTime: "10:45",
        subjectName: "Physics",
      },
    ];

    const conflicting = detectTimetableConflicts(existing, {
      dayOfWeek: "MON",
      startTime: "09:00",
      endTime: "10:00",
      subjectName: "Programming",
    });

    expect(conflicting.hasConflict).toBe(true);
    expect(conflicting.conflictingSlot?.id).toBe("slot-1");

    // Class on different day: no conflict
    const nonConflicting = detectTimetableConflicts(existing, {
      dayOfWeek: "TUE",
      startTime: "08:30",
      endTime: "09:30",
      subjectName: "Programming",
    });

    expect(nonConflicting.hasConflict).toBe(false);
  });

  it("rejects invalid time ranges where end <= start", () => {
    const invalid = detectTimetableConflicts([], {
      dayOfWeek: "WED",
      startTime: "11:00",
      endTime: "10:00",
    });
    expect(invalid.hasConflict).toBe(true);
    expect(invalid.message).toContain("End time must be strictly after start time");
  });
});
