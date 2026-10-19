import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    const experiments = await prisma.labExperiment.findMany({
      where: {
        subject: { semesterId },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ subjectId: "asc" }, { experimentNumber: "asc" }],
    });

    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      select: { id: true, name: true, code: true },
    });

    return NextResponse.json({ experiments, subjects });
  } catch (error) {
    console.error("Labs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch lab experiments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      subjectId,
      experimentNumber,
      title,
      aim,
      apparatus,
      theory,
      procedure,
      observations,
      calculations,
      result,
      vivaQuestions,
      codeSnippet,
      status,
    } = body;

    if (!subjectId || !title || !aim) {
      return NextResponse.json({ error: "Missing required lab experiment fields" }, { status: 400 });
    }

    const exp = await prisma.labExperiment.create({
      data: {
        subjectId,
        experimentNumber: parseInt(experimentNumber?.toString() || "1", 10),
        title,
        aim,
        apparatus: apparatus || null,
        theory: theory || null,
        procedure: procedure || null,
        observations: observations || null,
        calculations: calculations || null,
        result: result || null,
        vivaQuestions: typeof vivaQuestions === "string" ? vivaQuestions : JSON.stringify(vivaQuestions || []),
        codeSnippet: codeSnippet || null,
        status: status || "COMPLETED",
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, experiment: exp });
  } catch (error) {
    console.error("Labs POST error:", error);
    return NextResponse.json({ error: "Failed to create lab experiment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing lab experiment ID" }, { status: 400 });
    }

    await prisma.labExperiment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Labs DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete lab experiment" }, { status: 500 });
  }
}
