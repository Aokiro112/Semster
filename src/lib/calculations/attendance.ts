export interface AttendancePolicy {
  thresholdPercentage: number; // e.g. 75
  countCancelledAsConducted: boolean;
}

export const DEFAULT_ATTENDANCE_POLICY: AttendancePolicy = {
  thresholdPercentage: 75.0,
  countCancelledAsConducted: false,
};

export interface SubjectAttendanceSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  attended: number;
  totalConducted: number;
  missed: number;
  cancelled: number;
  percentage: number;
  status: "Good" | "Warning";
  canMissClasses: number;
  classesNeeded: number;
}

/**
 * Calculates attendance percentage and threshold compliance for a subject.
 */
export function calculateSubjectAttendance(
  attended: number,
  missed: number,
  cancelled: number = 0,
  policy: AttendancePolicy = DEFAULT_ATTENDANCE_POLICY
): {
  totalConducted: number;
  percentage: number;
  status: "Good" | "Warning";
  canMissClasses: number;
  classesNeeded: number;
} {
  const totalConducted = policy.countCancelledAsConducted
    ? attended + missed + cancelled
    : attended + missed;

  if (totalConducted === 0) {
    return {
      totalConducted: 0,
      percentage: 100.0,
      status: "Good",
      canMissClasses: 0,
      classesNeeded: 0,
    };
  }

  const percentage = Number(((attended / totalConducted) * 100).toFixed(1));
  const threshold = policy.thresholdPercentage / 100;

  const isGood = percentage >= policy.thresholdPercentage;

  // Maximum classes that can be missed without dropping below threshold:
  // (attended) / (totalConducted + X) >= threshold => attended >= threshold * totalConducted + threshold * X
  // => threshold * X <= attended - threshold * totalConducted
  // => X <= (attended - threshold * totalConducted) / threshold
  let canMissClasses = 0;
  if (isGood) {
    canMissClasses = Math.max(0, Math.floor((attended - threshold * totalConducted) / threshold));
  }

  // Consecutive classes needed to reach threshold:
  // (attended + Y) / (totalConducted + Y) >= threshold => attended + Y >= threshold * totalConducted + threshold * Y
  // => Y * (1 - threshold) >= threshold * totalConducted - attended
  // => Y >= (threshold * totalConducted - attended) / (1 - threshold)
  let classesNeeded = 0;
  if (!isGood) {
    if (threshold >= 1) {
      classesNeeded = 0; // impossible if threshold is 100% and a class was missed
    } else {
      classesNeeded = Math.max(
        0,
        Math.ceil((threshold * totalConducted - attended) / (1 - threshold))
      );
    }
  }

  return {
    totalConducted,
    percentage,
    status: isGood ? "Good" : "Warning",
    canMissClasses,
    classesNeeded,
  };
}

/**
 * Calculates aggregate overall attendance across all subjects.
 */
export function calculateOverallAttendance(
  subjectSummaries: Array<{ attended: number; totalConducted: number }>
): {
  totalAttended: number;
  totalConducted: number;
  totalMissed: number;
  percentage: number;
} {
  let totalAttended = 0;
  let totalConducted = 0;

  for (const s of subjectSummaries) {
    totalAttended += s.attended;
    totalConducted += s.totalConducted;
  }

  const totalMissed = Math.max(0, totalConducted - totalAttended);
  const percentage =
    totalConducted > 0 ? Number(((totalAttended / totalConducted) * 100).toFixed(1)) : 100.0;

  return {
    totalAttended,
    totalConducted,
    totalMissed,
    percentage,
  };
}
