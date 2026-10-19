import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  calculateSubjectAttendance,
  calculateOverallAttendance,
  DEFAULT_ATTENDANCE_POLICY,
} from "@/lib/calculations/attendance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    const settings = await prisma.appSettings.findFirst();
    const policy = {
      thresholdPercentage: settings?.attendanceThreshold || 75.0,
      countCancelledAsConducted: settings?.countCancelledAsConducted || false,
    };

    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      include: {
        attendanceRecords: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const subjectSummaries = subjects.map((sub) => {
      const attended = sub.attendanceRecords.filter((r) => r.status === "ATTENDED").length;
      const missed = sub.attendanceRecords.filter((r) => r.status === "MISSED").length;
      const cancelled = sub.attendanceRecords.filter((r) => r.status === "CANCELLED").length;

      const calc = calculateSubjectAttendance(attended, missed, cancelled, policy);

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        attended,
        missed,
        cancelled,
        total: calc.totalConducted,
        percentage: calc.percentage,
        status: calc.status,
        canMissClasses: calc.canMissClasses,
        classesNeeded: calc.classesNeeded,
      };
    });

    const overall = calculateOverallAttendance(
      subjectSummaries.map((s) => ({ attended: s.attended, totalConducted: s.total }))
    );

    // Get flat attendance log sorted by date descending
    const allRecords = await prisma.attendanceRecord.findMany({
      where: {
        subject: { semesterId },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json({
      policy,
      overall,
      subjectSummaries,
      records: allRecords,
    });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subjectId, date, status, notes, sessionType } = body;

    if (!subjectId || !date || !status) {
      return NextResponse.json({ error: "Missing required attendance fields" }, { status: 400 });
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        subjectId,
        date: new Date(date),
        status, // ATTENDED, MISSED, CANCELLED
        notes: notes || null,
        sessionType: sessionType || "LECTURE",
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing attendance record ID" }, { status: 400 });
    }

    await prisma.attendanceRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete attendance record" }, { status: 500 });
  }
}
