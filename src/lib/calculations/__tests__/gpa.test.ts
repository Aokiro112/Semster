import { describe, it, expect } from "vitest";
import {
  getGradeFromPercentage,
  calculateSGPA,
  calculateCGPA,
  calculateTargetSGPA,
  STANDARD_10_POINT_SCALE,
} from "../gpa";

describe("GPA Calculations", () => {
  it("determines correct letter grade and grade point", () => {
    expect(getGradeFromPercentage(95).letter).toBe("O");
    expect(getGradeFromPercentage(95).gradePoint).toBe(10);

    expect(getGradeFromPercentage(84).letter).toBe("A+");
    expect(getGradeFromPercentage(84).gradePoint).toBe(9);

    expect(getGradeFromPercentage(72).letter).toBe("A");
    expect(getGradeFromPercentage(72).gradePoint).toBe(8);

    expect(getGradeFromPercentage(65).letter).toBe("B+");
    expect(getGradeFromPercentage(65).gradePoint).toBe(7);

    expect(getGradeFromPercentage(30).letter).toBe("F");
    expect(getGradeFromPercentage(30).gradePoint).toBe(0);
  });

  it("calculates credit-weighted SGPA accurately", () => {
    // Subject 1: Math (4 credits, Grade A = 8) -> 32
    // Subject 2: Physics (4 credits, Grade B+ = 7) -> 28
    // Subject 3: Programming (4 credits, Grade A+ = 9) -> 36
    // Subject 4: Electrical (3 credits, Grade A = 8) -> 24
    // Subject 5: Chemistry (3 credits, Grade B+ = 7) -> 21
    // Total credits: 18
    // Total credit points: 32 + 28 + 36 + 24 + 21 = 141
    // SGPA: 141 / 18 = 7.833... -> 7.83
    const subjects = [
      { subjectId: "1", subjectName: "Math", credits: 4, gradePoint: 8, letterGrade: "A" },
      { subjectId: "2", subjectName: "Physics", credits: 4, gradePoint: 7, letterGrade: "B+" },
      { subjectId: "3", subjectName: "Programming", credits: 4, gradePoint: 9, letterGrade: "A+" },
      { subjectId: "4", subjectName: "Electrical", credits: 3, gradePoint: 8, letterGrade: "A" },
      { subjectId: "5", subjectName: "Chemistry", credits: 3, gradePoint: 7, letterGrade: "B+" },
    ];

    const result = calculateSGPA(subjects);
    expect(result.totalCredits).toBe(18);
    expect(result.totalCreditPoints).toBe(141);
    expect(result.sgpa).toBe(7.83);
  });

  it("calculates multi-semester CGPA correctly", () => {
    // Sem 1: 20 credits, SGPA 7.8 -> 156 points
    // Sem 2: 20 credits, SGPA 8.2 -> 164 points
    // Total: 40 credits, 320 points -> CGPA 8.0
    const semesters = [
      { semesterId: 1, sgpa: 7.8, credits: 20 },
      { semesterId: 2, sgpa: 8.2, credits: 20 },
    ];

    const result = calculateCGPA(semesters);
    expect(result.cgpa).toBe(8.0);
    expect(result.totalCredits).toBe(40);
    expect(result.completedSemestersCount).toBe(2);
  });

  it("computes realistic target SGPA scenario", () => {
    // Completed 40 credits with 7.8 CGPA (312 points).
    // Target 8.5 CGPA across 80 credits total (need 680 points total).
    // Remaining points needed: 680 - 312 = 368 points across 40 remaining credits.
    // Required SGPA: 368 / 40 = 9.2
    const scenario = calculateTargetSGPA(7.8, 40, 8.5, 40);
    expect(scenario.isAchievable).toBe(true);
    expect(scenario.requiredSGPA).toBe(9.2);

    // Impossible target test:
    const impossible = calculateTargetSGPA(6.0, 100, 9.5, 20);
    expect(impossible.isAchievable).toBe(false);
  });
});
