/**
 * SuperMemo SM-2 algorithm for spaced repetition topic revisions.
 * Quality rating scale:
 * 5 - Perfect response
 * 4 - Correct response after a hesitation
 * 3 - Correct response recalled with serious difficulty
 * 2 - Incorrect response; where the correct one seemed easy to recall
 * 1 - Incorrect response; the correct one remembered
 * 0 - Complete blackout.
 */

export interface SM2Item {
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
}

export interface SM2Result {
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
  nextReviewDate: Date;
}

export function calculateNextReview(
  item: SM2Item,
  quality: number, // 0 to 5
  baseDate: Date = new Date()
): SM2Result {
  const boundedQuality = Math.max(0, Math.min(5, quality));

  let repetitionCount = item.repetitionCount;
  let easeFactor = item.easeFactor;
  let intervalDays = item.intervalDays;

  if (boundedQuality >= 3) {
    if (repetitionCount === 0) {
      intervalDays = 1;
    } else if (repetitionCount === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitionCount += 1;
  } else {
    // Failed recall: reset to beginning
    repetitionCount = 0;
    intervalDays = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - boundedQuality) * (0.08 + (5 - boundedQuality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewDate = new Date(baseDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    intervalDays,
    repetitionCount,
    easeFactor: Number(easeFactor.toFixed(3)),
    nextReviewDate,
  };
}
