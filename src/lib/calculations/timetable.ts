export interface TimetableSlot {
  id?: string;
  dayOfWeek: string; // MON, TUE, WED, THU, FRI, SAT
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  subjectName?: string;
}

/**
 * Converts "HH:MM" time string to minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
}

/**
 * Checks if two time intervals overlap on the same day.
 */
export function doSlotsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Detects whether a new or updated timetable entry conflicts with existing entries.
 */
export function detectTimetableConflicts(
  existingSlots: TimetableSlot[],
  newSlot: TimetableSlot
): {
  hasConflict: boolean;
  conflictingSlot?: TimetableSlot;
  message?: string;
} {
  const newStart = timeStringToMinutes(newSlot.startTime);
  const newEnd = timeStringToMinutes(newSlot.endTime);

  if (newEnd <= newStart) {
    return {
      hasConflict: true,
      message: "End time must be strictly after start time.",
    };
  }

  for (const slot of existingSlots) {
    // If updating an existing entry, do not compare with itself
    if (newSlot.id && slot.id === newSlot.id) continue;

    if (slot.dayOfWeek.toUpperCase() === newSlot.dayOfWeek.toUpperCase()) {
      const slotStart = timeStringToMinutes(slot.startTime);
      const slotEnd = timeStringToMinutes(slot.endTime);

      if (doSlotsOverlap(newStart, newEnd, slotStart, slotEnd)) {
        return {
          hasConflict: true,
          conflictingSlot: slot,
          message: `Conflicts with ${slot.subjectName || "existing class"} scheduled on ${slot.dayOfWeek} from ${slot.startTime} to ${slot.endTime}.`,
        };
      }
    }
  }

  return { hasConflict: false };
}
