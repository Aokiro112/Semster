import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { id: "asc" },
    });
    const profile = await prisma.academicProfile.findFirst();

    return NextResponse.json({
      semesters: semesters.map((s) => ({
        id: s.id,
        name: s.name,
        academicYear: s.academicYear,
        isCurrent: s.isCurrent,
        sgpa: s.sgpa,
        credits: s.credits,
      })),
      profile: profile || {
        name: "Student",
        degree: "Engineering Degree",
        institution: "My University / College",
        rollNumber: "",
        targetCgpa: 8.5,
        currentCgpa: 0.0,
      },
    });
  } catch (error) {
    console.error("Semesters GET error:", error);
    return NextResponse.json({ error: "Failed to fetch semesters" }, { status: 500 });
  }
}
