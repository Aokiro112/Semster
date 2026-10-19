import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);
    const subjectId = searchParams.get("subjectId");
    const folder = searchParams.get("folder");
    const bookmarkOnly = searchParams.get("bookmarked") === "true";

    const where: any = { semesterId };
    if (subjectId) where.subjectId = subjectId;
    if (folder) where.folder = folder;
    if (bookmarkOnly) where.isBookmarked = true;

    const notes = await prisma.note.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      select: { id: true, name: true, code: true },
    });

    return NextResponse.json({ notes, subjects });
  } catch (error) {
    console.error("Notes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { semesterId, subjectId, title, content, folder, tags, isBookmarked } = body;

    if (!semesterId || !title) {
      return NextResponse.json({ error: "Missing required note title" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        semesterId: parseInt(semesterId.toString(), 10),
        subjectId: subjectId || null,
        title,
        content: content || "",
        folder: folder || "Class Notes",
        tags: tags || "",
        isBookmarked: Boolean(isBookmarked),
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("Notes POST error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content, folder, tags, isBookmarked } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        folder: folder !== undefined ? folder : undefined,
        tags: tags !== undefined ? tags : undefined,
        isBookmarked: isBookmarked !== undefined ? Boolean(isBookmarked) : undefined,
        updatedAt: new Date(),
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (error) {
    console.error("Notes PUT error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
    }

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notes DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
