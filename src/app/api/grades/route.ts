import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  calculateSGPA,
  calculateCGPA,
  calculateTargetSGPA,
  getGradeFromPercentage,
} from "@/lib/calculations/gpa";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    const profile = await prisma.academicProfile.findFirst();

    // 1. Fetch Assessments for active semester
    const assessments = await prisma.assessment.findMany({
      where: { semesterId },
      include: {
        subject: { select: { id: true, name: true, code: true, credits: true } },
      },
      orderBy: { date: "asc" },
    });

    // 2. Fetch Subjects and calculate subject grades
    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      include: { assessments: true },
    });

    const subjectGrades = subjects.map((sub) => {
      let totalWeighted = 0;
      let totalWeightage = 0;
      for (const a of sub.assessments) {
        if (a.marksObtained !== null && a.maxMarks > 0) {
          totalWeighted += (a.marksObtained / a.maxMarks) * a.weightage;
          totalWeightage += a.weightage;
        }
      }
      const percentage = totalWeightage > 0 ? (totalWeighted / totalWeightage) * 100 : 75;
      const grade = getGradeFromPercentage(percentage);
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        credits: sub.credits,
        percentage: Number(percentage.toFixed(1)),
        letterGrade: grade.letter,
        gradePoint: grade.gradePoint,
        creditPoints: sub.credits * grade.gradePoint,
      };
    });

    const sgpaResult = calculateSGPA(subjectGrades);

    // 3. Fetch all semesters for CGPA
    const allSemesters = await prisma.semester.findMany({
      orderBy: { id: "asc" },
    });

    const semesterRecords = allSemesters.map((s) => ({
      semesterId: s.id,
      name: s.name,
      academicYear: s.academicYear,
      sgpa: s.id === semesterId && sgpaResult.sgpa > 0 ? sgpaResult.sgpa : s.sgpa,
      credits: s.credits > 0 ? s.credits : 20,
    }));

    const cgpaResult = calculateCGPA(semesterRecords);

    return NextResponse.json({
      profile: {
        targetCgpa: profile?.targetCgpa || 8.5,
        currentCgpa: cgpaResult.cgpa > 0 ? cgpaResult.cgpa : 7.8,
      },
      sgpaResult,
      cgpaResult,
      assessments,
      subjectGrades,
      semesterRecords,
      subjects: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    });
  } catch (error) {
    console.error("Grades GET error:", error);
    return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      semesterId,
      subjectId,
      title,
      assessmentType,
      maxMarks,
      marksObtained,
      weightage,
      date,
    } = body;

    if (!semesterId || !subjectId || !title) {
      return NextResponse.json({ error: "Missing required assessment fields" }, { status: 400 });
    }

    const assessment = await prisma.assessment.create({
      data: {
        semesterId: parseInt(semesterId.toString(), 10),
        subjectId,
        title,
        assessmentType: assessmentType || "QUIZ",
        maxMarks: parseFloat(maxMarks?.toString() || "100"),
        marksObtained: marksObtained !== undefined && marksObtained !== "" ? parseFloat(marksObtained.toString()) : null,
        weightage: parseFloat(weightage?.toString() || "20"),
        date: date ? new Date(date) : null,
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, assessment });
  } catch (error) {
    console.error("Grades POST error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing assessment ID" }, { status: 400 });
    }

    await prisma.assessment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Grades DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
  }
}
