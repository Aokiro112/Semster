import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateSubjectAttendance, calculateOverallAttendance } from "@/lib/calculations/attendance";
import { calculateSGPA, calculateCGPA } from "@/lib/calculations/gpa";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    // 1. Fetch Profile
    const profile = await prisma.academicProfile.findFirst() || {
      name: "Engineering Scholar",
      degree: "B.Tech Computer Science & Engineering",
      institution: "National Institute of Technology",
      rollNumber: "24CS1042",
      targetCgpa: 8.5,
      currentCgpa: 7.8,
    };

    // 2. Fetch Semester
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });

    // 3. Fetch All Semesters for CGPA
    const allSemesters = await prisma.semester.findMany();
    const semesterRecords = allSemesters.map((s) => ({
      semesterId: s.id,
      sgpa: s.sgpa,
      credits: s.credits,
    }));
    const cgpaCalc = calculateCGPA(semesterRecords);

    // 4. Fetch Subjects for Active Semester
    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      include: {
        attendanceRecords: true,
        assessments: true,
      },
    });

    // 5. Calculate Attendance Summaries
    const subjectAttendance = subjects.map((sub) => {
      const attended = sub.attendanceRecords.filter((r) => r.status === "ATTENDED").length;
      const missed = sub.attendanceRecords.filter((r) => r.status === "MISSED").length;
      const cancelled = sub.attendanceRecords.filter((r) => r.status === "CANCELLED").length;

      const calc = calculateSubjectAttendance(attended, missed, cancelled);
      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        attended,
        missed,
        total: calc.totalConducted,
        percentage: calc.percentage,
        status: calc.status,
      };
    });

    const overallAttendance = calculateOverallAttendance(
      subjectAttendance.map((s) => ({ attended: s.attended, totalConducted: s.total }))
    );

    // 6. Calculate SGPA from Assessments
    const subjectCreditGrades = subjects.map((sub) => {
      // Find average or end-sem grade
      let totalWeightedMarks = 0;
      let totalWeightage = 0;
      for (const a of sub.assessments) {
        if (a.marksObtained !== null && a.maxMarks > 0) {
          totalWeightedMarks += (a.marksObtained / a.maxMarks) * a.weightage;
          totalWeightage += a.weightage;
        }
      }
      const percentage = totalWeightage > 0 ? (totalWeightedMarks / totalWeightage) * 100 : 75;
      const gradePoint = percentage >= 90 ? 10 : percentage >= 80 ? 9 : percentage >= 70 ? 8 : percentage >= 60 ? 7 : 6;
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        credits: sub.credits,
        gradePoint,
        letterGrade: gradePoint >= 9 ? "A+" : "A",
      };
    });

    const sgpaCalc = calculateSGPA(subjectCreditGrades);
    const displaySgpa = semester?.sgpa && semester.sgpa > 0 ? semester.sgpa : sgpaCalc.sgpa || 7.8;
    const displayCgpa = cgpaCalc.cgpa > 0 ? cgpaCalc.cgpa : profile.currentCgpa || 7.8;

    // 7. Today's Classes
    // Map current JS day (0=SUN, 1=MON, etc.) to 3-letter code
    const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const currentDayCode = dayMap[new Date().getDay()];
    // If Sunday, default to "MON" so the student sees their upcoming Monday classes!
    const effectiveDay = currentDayCode === "SUN" ? "MON" : currentDayCode;

    const todayClasses = await prisma.timetableEntry.findMany({
      where: {
        semesterId,
        dayOfWeek: effectiveDay,
      },
      include: {
        subject: { select: { name: true, code: true, color: true } },
      },
      orderBy: { startTime: "asc" },
    });

    // 8. Upcoming Deadlines (Tasks)
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        semesterId,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // 9. Upcoming Examinations
    const upcomingExams = await prisma.assessment.findMany({
      where: {
        semesterId,
        date: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: "asc" },
      take: 4,
    });

    // 10. Today's Study Goals
    const todayGoals = await prisma.studyGoal.findMany({
      where: { semesterId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      semester: {
        id: semesterId,
        name: semester?.name || `Semester ${semesterId}`,
        academicYear: semester?.academicYear || "2024 - 2025",
        isCurrent: semester?.isCurrent ?? true,
      },
      metrics: {
        targetCgpa: profile.targetCgpa,
        currentSgpa: displaySgpa,
        overallCgpa: displayCgpa,
        overallAttendance: overallAttendance.percentage,
        totalClasses: overallAttendance.totalConducted,
        attendedClasses: overallAttendance.totalAttended,
        missedClasses: overallAttendance.totalMissed,
      },
      todayClasses,
      subjectAttendance,
      upcomingDeadlines,
      upcomingExams,
      todayGoals,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
