import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { detectTimetableConflicts } from "@/lib/calculations/timetable";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    const entries = await prisma.timetableEntry.findMany({
      where: { semesterId },
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true, instructor: true },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      select: { id: true, name: true, code: true, instructor: true },
    });

    return NextResponse.json({ entries, subjects });
  } catch (error) {
    console.error("Timetable GET error:", error);
    return NextResponse.json({ error: "Failed to fetch timetable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      semesterId,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      instructor,
      sessionType,
    } = body;

    if (!semesterId || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields for timetable slot" },
        { status: 400 }
      );
    }

    // Check for timetable conflicts
    const existingEntries = await prisma.timetableEntry.findMany({
      where: { semesterId, dayOfWeek },
      include: { subject: { select: { name: true } } },
    });

    const conflictCheck = detectTimetableConflicts(
      existingEntries.map((e) => ({
        id: e.id,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        subjectName: e.subject.name,
      })),
      {
        dayOfWeek,
        startTime,
        endTime,
      }
    );

    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        { error: conflictCheck.message || "Schedule conflict detected with an existing class." },
        { status: 409 }
      );
    }

    const newEntry = await prisma.timetableEntry.create({
      data: {
        semesterId: parseInt(semesterId.toString(), 10),
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null,
        instructor: instructor || null,
        sessionType: sessionType || "LECTURE",
      },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
      },
    });

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error) {
    console.error("Timetable POST error:", error);
    return NextResponse.json({ error: "Failed to create timetable slot" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing timetable entry ID" }, { status: 400 });
    }

    await prisma.timetableEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Timetable DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete timetable slot" }, { status: 500 });
  }
}
