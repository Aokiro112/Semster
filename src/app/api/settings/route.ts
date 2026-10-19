import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.academicProfile.findFirst();
    const settings = await prisma.appSettings.findFirst();
    const semesters = await prisma.semester.findMany({ orderBy: { id: "asc" } });

    return NextResponse.json({ profile, settings, semesters });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "UPDATE_PROFILE") {
      const { name, degree, institution, rollNumber, targetCgpa } = body;
      const updated = await prisma.academicProfile.upsert({
        where: { id: "default-profile" },
        update: {
          name,
          degree,
          institution,
          rollNumber,
          targetCgpa: parseFloat(targetCgpa?.toString() || "8.5"),
        },
        create: {
          id: "default-profile",
          name,
          degree,
          institution,
          rollNumber,
          targetCgpa: parseFloat(targetCgpa?.toString() || "8.5"),
        },
      });
      return NextResponse.json({ success: true, profile: updated });
    }

    if (action === "UPDATE_SETTINGS") {
      const { attendanceThreshold, countCancelledAsConducted, ollamaUrl, ollamaModel } = body;
      const updated = await prisma.appSettings.upsert({
        where: { id: "default-settings" },
        update: {
          attendanceThreshold: parseFloat(attendanceThreshold?.toString() || "75.0"),
          countCancelledAsConducted: Boolean(countCancelledAsConducted),
          ollamaUrl: ollamaUrl || "http://localhost:11434",
          ollamaModel: ollamaModel || "llama3.1:latest",
        },
        create: {
          id: "default-settings",
          attendanceThreshold: parseFloat(attendanceThreshold?.toString() || "75.0"),
          countCancelledAsConducted: Boolean(countCancelledAsConducted),
          ollamaUrl: ollamaUrl || "http://localhost:11434",
          ollamaModel: ollamaModel || "llama3.1:latest",
        },
      });
      return NextResponse.json({ success: true, settings: updated });
    }

    if (action === "UPDATE_SEMESTER") {
      const { semesterId, name, academicYear, isCurrent } = body;
      if (isCurrent) {
        // Set all other semesters isCurrent to false
        await prisma.semester.updateMany({ data: { isCurrent: false } });
      }
      const updated = await prisma.semester.update({
        where: { id: parseInt(semesterId.toString(), 10) },
        data: {
          name,
          academicYear,
          isCurrent: Boolean(isCurrent),
        },
      });
      return NextResponse.json({ success: true, semester: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// Full database backup export / import
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, backupData } = body;

    if (action === "EXPORT_DATA") {
      const profile = await prisma.academicProfile.findFirst();
      const settings = await prisma.appSettings.findFirst();
      const semesters = await prisma.semester.findMany();
      const subjects = await prisma.subject.findMany({
        include: {
          modules: { include: { topics: true } },
          timetableEntries: true,
          attendanceRecords: true,
          tasks: true,
          labExperiments: true,
          assessments: true,
          studySessions: true,
          notes: true,
        },
      });
      const studyGoals = await prisma.studyGoal.findMany();

      return NextResponse.json({
        exportDate: new Date().toISOString(),
        version: "1.0",
        profile,
        settings,
        semesters,
        subjects,
        studyGoals,
      });
    }

    return NextResponse.json({ error: "Invalid export/import action" }, { status: 400 });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Failed to export/import database" }, { status: 500 });
  }
}
