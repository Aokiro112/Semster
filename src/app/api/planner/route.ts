import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = parseInt(searchParams.get("semesterId") || "1", 10);

    // 1. Fetch Today's Study Sessions
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.studySession.findMany({
      where: {
        date: { gte: startOfToday },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { date: "asc" },
    });

    // 2. Fetch Sessions for the Past 7 Days (for Focus Statistics chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weekSessions = await prisma.studySession.findMany({
      where: {
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "asc" },
    });

    // Aggregate by day of week
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyChartData = days.map((dayName) => ({
      day: dayName,
      hours: 0,
    }));

    for (const s of weekSessions) {
      const dIndex = new Date(s.date).getDay();
      weeklyChartData[dIndex].hours += Number((s.durationMinutes / 60).toFixed(1));
    }

    // Re-order to start from Mon
    const orderedChartData = [
      ...weeklyChartData.slice(1),
      weeklyChartData[0],
    ];

    // 3. Fetch Goals
    const goals = await prisma.studyGoal.findMany({
      where: { semesterId },
      orderBy: { createdAt: "asc" },
    });

    // 4. Fetch Subjects for dropdown
    const subjects = await prisma.subject.findMany({
      where: { semesterId },
      include: {
        modules: {
          include: { topics: true },
        },
      },
    });

    const totalTodayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    return NextResponse.json({
      sessionsToday: todaySessions.length,
      targetSessions: 6,
      focusTimeMinutes: totalTodayMinutes,
      breakTimeMinutes: Math.floor(todaySessions.length * 5),
      streakDays: 3,
      weeklyChartData: orderedChartData,
      todaySessions,
      goals,
      subjects,
    });
  } catch (error) {
    console.error("Planner GET error:", error);
    return NextResponse.json({ error: "Failed to fetch planner data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "LOG_SESSION") {
      const { subjectId, durationMinutes, sessionType, notes } = body;
      const session = await prisma.studySession.create({
        data: {
          subjectId: subjectId || null,
          durationMinutes: parseInt(durationMinutes || "25", 10),
          sessionType: sessionType || "DEEP_WORK",
          notes: notes || "Focus Session",
          date: new Date(),
        },
        include: {
          subject: { select: { name: true, code: true } },
        },
      });
      return NextResponse.json({ success: true, session });
    }

    if (action === "TOGGLE_GOAL") {
      const { goalId, completed } = body;
      const updated = await prisma.studyGoal.update({
        where: { id: goalId },
        data: { completed },
      });
      return NextResponse.json({ success: true, goal: updated });
    }

    if (action === "ADD_GOAL") {
      const { semesterId, title, durationEstMinutes } = body;
      const goal = await prisma.studyGoal.create({
        data: {
          semesterId: parseInt(semesterId || "1", 10),
          title,
          durationEstMinutes: parseInt(durationEstMinutes || "25", 10),
          completed: false,
        },
      });
      return NextResponse.json({ success: true, goal });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Planner POST error:", error);
    return NextResponse.json({ error: "Failed to process planner action" }, { status: 500 });
  }
}
