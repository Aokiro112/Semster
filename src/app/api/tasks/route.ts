import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);
    const status = searchParams.get("status");

    const where: any = { semesterId };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true, code: true, color: true },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { semesterId, subjectId, title, description, dueDate, priority, taskType } = body;

    if (!semesterId || !title) {
      return NextResponse.json({ error: "Missing required task fields" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        semesterId: parseInt(semesterId.toString(), 10),
        subjectId: subjectId || null,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        taskType: taskType || "ASSIGNMENT",
        status: "TODO",
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, title, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "COMPLETED") updateData.completedAt = new Date();
    }
    if (title) updateData.title = title;
    if (priority) updateData.priority = priority;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { subject: { select: { name: true, code: true } } },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error("Tasks PATCH error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tasks DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
