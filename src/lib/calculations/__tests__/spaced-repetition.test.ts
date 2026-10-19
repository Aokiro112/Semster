import { describe, it, expect } from "vitest";
import { calculateNextReview } from "../spaced-repetition";

describe("Spaced Repetition (SM-2)", () => {
  it("initializes new item with 1 day interval on good recall", () => {
    const base = new Date("2026-08-12T10:00:00Z");
    const result = calculateNextReview(
      { intervalDays: 1, repetitionCount: 0, easeFactor: 2.5 },
      4,
      base
    );
    expect(result.intervalDays).toBe(1);
    expect(result.repetitionCount).toBe(1);
    expect(result.nextReviewDate.toISOString().slice(0, 10)).toBe("2026-08-13");
  });

  it("increases interval to 6 days on second successful repetition", () => {
    const base = new Date("2026-08-12T10:00:00Z");
    const result = calculateNextReview(
      { intervalDays: 1, repetitionCount: 1, easeFactor: 2.5 },
      4,
      base
    );
    expect(result.intervalDays).toBe(6);
    expect(result.repetitionCount).toBe(2);
    expect(result.nextReviewDate.toISOString().slice(0, 10)).toBe("2026-08-18");
  });

  it("resets repetition count to 0 when recall fails (rating < 3)", () => {
    const base = new Date("2026-08-12T10:00:00Z");
    const result = calculateNextReview(
      { intervalDays: 15, repetitionCount: 3, easeFactor: 2.4 },
      1, // Failed recall
      base
    );
    expect(result.intervalDays).toBe(1);
    expect(result.repetitionCount).toBe(0);
    expect(result.nextReviewDate.toISOString().slice(0, 10)).toBe("2026-08-13");
  });
});
