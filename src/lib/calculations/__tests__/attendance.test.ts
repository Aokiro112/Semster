import { describe, it, expect } from "vitest";
import {
  calculateSubjectAttendance,
  calculateOverallAttendance,
} from "../attendance";

describe("Attendance Calculations", () => {
  it("handles zero conducted classes safely", () => {
    const result = calculateSubjectAttendance(0, 0);
    expect(result.totalConducted).toBe(0);
    expect(result.percentage).toBe(100.0);
    expect(result.status).toBe("Good");
    expect(result.canMissClasses).toBe(0);
    expect(result.classesNeeded).toBe(0);
  });

  it("calculates exact percentage and marks warning when below 75%", () => {
    // 20 attended out of 30 => 66.7%
    const result = calculateSubjectAttendance(20, 10);
    expect(result.totalConducted).toBe(30);
    expect(result.percentage).toBe(66.7);
    expect(result.status).toBe("Warning");
    expect(result.canMissClasses).toBe(0);
    // Needs Y classes: (20 + Y) / (30 + Y) >= 0.75 => 20 + Y >= 22.5 + 0.75Y => 0.25Y >= 2.5 => Y >= 10
    expect(result.classesNeeded).toBe(10);
  });

  it("calculates allowable bunk classes when well above threshold", () => {
    // 24 attended out of 25 => 96%
    const result = calculateSubjectAttendance(24, 1);
    expect(result.percentage).toBe(96.0);
    expect(result.status).toBe("Good");
    // (24) / (25 + X) >= 0.75 => 24 >= 18.75 + 0.75X => 0.75X <= 5.25 => X <= 7
    expect(result.canMissClasses).toBe(7);
    expect(result.classesNeeded).toBe(0);
  });

  it("respects custom threshold (e.g. 80%)", () => {
    const result = calculateSubjectAttendance(24, 6, 0, {
      thresholdPercentage: 80.0,
      countCancelledAsConducted: false,
    });
    // 24/30 = 80.0%
    expect(result.percentage).toBe(80.0);
    expect(result.status).toBe("Good");
    expect(result.canMissClasses).toBe(0);
  });

  it("aggregates overall attendance accurately", () => {
    const overall = calculateOverallAttendance([
      { attended: 24, totalConducted: 30 },
      { attended: 22, totalConducted: 30 },
      { attended: 26, totalConducted: 30 },
      { attended: 19, totalConducted: 25 },
      { attended: 17, totalConducted: 25 },
    ]);
    // Total attended: 24+22+26+19+17 = 108
    // Total conducted: 30+30+30+25+25 = 140
    // 108 / 140 * 100 = 77.1%
    expect(overall.totalAttended).toBe(108);
    expect(overall.totalConducted).toBe(140);
    expect(overall.totalMissed).toBe(32);
    expect(overall.percentage).toBe(77.1);
  });
});
