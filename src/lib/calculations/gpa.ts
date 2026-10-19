export interface GradeBoundary {
  letter: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  description: string;
}

export const STANDARD_10_POINT_SCALE: GradeBoundary[] = [
  { letter: "O", gradePoint: 10, minPercentage: 90, maxPercentage: 100, description: "Outstanding" },
  { letter: "A+", gradePoint: 9, minPercentage: 80, maxPercentage: 89.99, description: "Excellent" },
  { letter: "A", gradePoint: 8, minPercentage: 70, maxPercentage: 79.99, description: "Very Good" },
  { letter: "B+", gradePoint: 7, minPercentage: 60, maxPercentage: 69.99, description: "Good" },
  { letter: "B", gradePoint: 6, minPercentage: 50, maxPercentage: 59.99, description: "Above Average" },
  { letter: "C", gradePoint: 5, minPercentage: 45, maxPercentage: 49.99, description: "Average" },
  { letter: "P", gradePoint: 4, minPercentage: 40, maxPercentage: 44.99, description: "Pass" },
  { letter: "F", gradePoint: 0, minPercentage: 0, maxPercentage: 39.99, description: "Fail" },
];

/**
 * Returns the grade boundary matching a percentage mark.
 */
export function getGradeFromPercentage(
  percentage: number,
  scale: GradeBoundary[] = STANDARD_10_POINT_SCALE
): GradeBoundary {
  const boundedPercentage = Math.min(100, Math.max(0, percentage));
  for (const grade of scale) {
    if (boundedPercentage >= grade.minPercentage && boundedPercentage <= grade.maxPercentage) {
      return grade;
    }
  }
  return scale[scale.length - 1]; // Default to lowest / Fail
}

export interface SubjectCreditGrade {
  subjectId: string;
  subjectName: string;
  credits: number;
  gradePoint: number;
  letterGrade: string;
}

/**
 * Calculates Semester Grade Point Average (SGPA).
 * SGPA = Sum of (Subject Credits * Subject Grade Points) / Sum of Subject Credits
 */
export function calculateSGPA(subjects: SubjectCreditGrade[]): {
  sgpa: number;
  totalCredits: number;
  totalCreditPoints: number;
} {
  if (!subjects || subjects.length === 0) {
    return { sgpa: 0.0, totalCredits: 0, totalCreditPoints: 0 };
  }

  let totalCredits = 0;
  let totalCreditPoints = 0;

  for (const s of subjects) {
    totalCredits += s.credits;
    totalCreditPoints += s.credits * s.gradePoint;
  }

  if (totalCredits === 0) {
    return { sgpa: 0.0, totalCredits: 0, totalCreditPoints: 0 };
  }

  const sgpa = Number((totalCreditPoints / totalCredits).toFixed(2));
  return {
    sgpa,
    totalCredits,
    totalCreditPoints,
  };
}

export interface SemesterRecord {
  semesterId: number;
  sgpa: number;
  credits: number;
}

/**
 * Calculates Cumulative Grade Point Average (CGPA) across completed semesters.
 * CGPA = Sum of (Semester SGPA * Semester Credits) / Sum of Semester Credits
 */
export function calculateCGPA(semesters: SemesterRecord[]): {
  cgpa: number;
  totalCredits: number;
  completedSemestersCount: number;
} {
  const validSemesters = semesters.filter((s) => s.credits > 0 && s.sgpa > 0);
  if (validSemesters.length === 0) {
    return { cgpa: 0.0, totalCredits: 0, completedSemestersCount: 0 };
  }

  let totalWeightedPoints = 0;
  let totalCredits = 0;

  for (const s of validSemesters) {
    totalWeightedPoints += s.sgpa * s.credits;
    totalCredits += s.credits;
  }

  if (totalCredits === 0) {
    return { cgpa: 0.0, totalCredits: 0, completedSemestersCount: 0 };
  }

  const cgpa = Number((totalWeightedPoints / totalCredits).toFixed(2));
  return {
    cgpa,
    totalCredits,
    completedSemestersCount: validSemesters.length,
  };
}

/**
 * Predicts the required average SGPA in remaining semesters to achieve a target CGPA.
 * targetCGPA = (currentCGPA * completedCredits + requiredSGPA * remainingCredits) / (completedCredits + remainingCredits)
 * requiredSGPA = [targetCGPA * (completedCredits + remainingCredits) - currentCGPA * completedCredits] / remainingCredits
 */
export function calculateTargetSGPA(
  currentCGPA: number,
  completedCredits: number,
  targetCGPA: number,
  remainingCredits: number
): {
  requiredSGPA: number;
  isAchievable: boolean;
  message: string;
} {
  if (remainingCredits <= 0) {
    return {
      requiredSGPA: currentCGPA,
      isAchievable: currentCGPA >= targetCGPA,
      message:
        currentCGPA >= targetCGPA
          ? "Target already achieved with no remaining credits."
          : "Degree completed; target cannot be reached.",
    };
  }

  const totalCredits = completedCredits + remainingCredits;
  const targetTotalPoints = targetCGPA * totalCredits;
  const currentTotalPoints = currentCGPA * completedCredits;
  const neededPoints = targetTotalPoints - currentTotalPoints;

  const requiredSGPA = Number((neededPoints / remainingCredits).toFixed(2));

  if (requiredSGPA > 10.0) {
    return {
      requiredSGPA,
      isAchievable: false,
      message: `Requires an SGPA of ${requiredSGPA}, which exceeds the maximum possible 10.0.`,
    };
  }

  if (requiredSGPA <= 0) {
    return {
      requiredSGPA: 0.0,
      isAchievable: true,
      message: `Your current CGPA is high enough that even minimum passing grades will meet your ${targetCGPA} target.`,
    };
  }

  return {
    requiredSGPA,
    isAchievable: true,
    message: `You need an average SGPA of ${requiredSGPA} across remaining ${remainingCredits} credits.`,
  };
}
