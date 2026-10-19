import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      include: {
        modules: {
          orderBy: { orderIndex: "asc" },
          include: {
            topics: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
        },
        assessments: {
          orderBy: { date: "asc" },
        },
        notes: {
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Subjects GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { semesterId, name, code, credits, instructor, courseType } = body;

    if (!semesterId || !name || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        semesterId: parseInt(semesterId.toString(), 10),
        name,
        code,
        credits: parseInt(credits?.toString() || "4", 10),
        instructor: instructor || null,
        courseType: courseType || "Theory",
      },
    });

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    console.error("Subjects POST error:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

// Updating Topic status (e.g. NOT_STARTED -> COMPLETED)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { topicId, status, moduleId, newTopicTitle, newModuleName, subjectId } = body;

    // Case 1: Toggle topic status
    if (topicId && status) {
      const updated = await prisma.topic.update({
        where: { id: topicId },
        data: { status },
      });
      return NextResponse.json({ success: true, topic: updated });
    }

    // Case 2: Add new topic to module
    if (moduleId && newTopicTitle) {
      const count = await prisma.topic.count({ where: { moduleId } });
      const created = await prisma.topic.create({
        data: {
          moduleId,
          title: newTopicTitle,
          orderIndex: count + 1,
          status: "NOT_STARTED",
        },
      });
      return NextResponse.json({ success: true, topic: created });
    }

    // Case 3: Add new module to subject
    if (subjectId && newModuleName) {
      const count = await prisma.module.count({ where: { subjectId } });
      const created = await prisma.module.create({
        data: {
          subjectId,
          name: newModuleName,
          orderIndex: count + 1,
        },
      });
      return NextResponse.json({ success: true, module: created });
    }

    return NextResponse.json({ error: "Invalid update request" }, { status: 400 });
  } catch (error) {
    console.error("Subjects PUT error:", error);
    return NextResponse.json({ error: "Failed to update subject or syllabus" }, { status: 500 });
  }
}
