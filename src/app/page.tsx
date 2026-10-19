"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  CheckSquare,
  GraduationCap,
  ArrowRight,
  Clock,
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
  Plus,
  Target,
  Sparkles,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn, formatTime, formatDate } from "@/lib/utils";
import { triggerConfetti } from "@/lib/confetti";

interface DashboardData {
  semester: {
    id: number;
    name: string;
    academicYear: string;
    isCurrent: boolean;
  };
  metrics: {
    targetCgpa: number;
    currentSgpa: number;
    overallCgpa: number;
    overallAttendance: number;
    totalClasses: number;
    attendedClasses: number;
    missedClasses: number;
  };
  todayClasses: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string | null;
    instructor: string | null;
    sessionType: string;
    subject: {
      name: string;
      code: string;
      color: string;
    };
  }>;
  subjectAttendance: Array<{
    id: string;
    code: string;
    name: string;
    attended: number;
    total: number;
    percentage: number;
    status: "Good" | "Warning";
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    priority: string;
    status: string;
    subject: {
      name: string;
      code: string;
    } | null;
  }>;
  upcomingExams: Array<{
    id: string;
    title: string;
    date: string | null;
    maxMarks: number;
    weightage: number;
    subject: {
      name: string;
      code: string;
    };
  }>;
  todayGoals: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

export default function DashboardPage() {
  const { activeSemesterId, profile } = useSemester();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/dashboard?semesterId=${activeSemesterId}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSemesterId]);

  const triggerCelebrate = () => {
    triggerConfetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#000000", "#71717a", "#ffffff"],
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    return "Good Evening!";
  };

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>{getGreeting()}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Let&apos;s make today productive. Welcome back, {profile.name}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground">
              {todayDateString}
            </span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Current Semester */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
            <div className="text-xs font-medium text-muted-foreground">Current Semester</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {data?.semester?.name || `Semester ${activeSemesterId}`}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground mt-1">
              {data?.semester?.academicYear || "2024 - 2025"}
            </div>
          </div>

          {/* Card 2: Target CGPA */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
            <div className="text-xs font-medium text-muted-foreground">Target CGPA</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {data?.metrics?.targetCgpa ? `${data.metrics.targetCgpa}+` : "8.5+"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Academic Goal</span>
            </div>
          </div>

          {/* Card 3: Current SGPA */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
            <div className="text-xs font-medium text-muted-foreground">Current SGPA</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {data?.metrics?.currentSgpa && data.metrics.currentSgpa > 0
                ? data.metrics.currentSgpa.toFixed(1)
                : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {data?.metrics?.currentSgpa && data.metrics.currentSgpa > 0
                ? `Sem ${activeSemesterId} Score`
                : "Awaiting exam marks"}
            </div>
          </div>

          {/* Card 4: Overall CGPA */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors">
            <div className="text-xs font-medium text-muted-foreground">Overall CGPA</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {data?.metrics?.overallCgpa && data.metrics.overallCgpa > 0
                ? data.metrics.overallCgpa.toFixed(1)
                : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {data?.metrics?.overallCgpa && data.metrics.overallCgpa > 0
                ? "Cumulative Record"
                : "Cumulative graduation"}
            </div>
          </div>
        </div>

        {/* 2 Column Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Today's Classes & Upcoming Deadlines */}
          <div className="space-y-6">
            {/* Today's Classes Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Today&apos;s Classes
                  </h2>
                </div>
                <Link
                  href="/timetable"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                  Loading schedule...
                </div>
              ) : !data?.todayClasses || data.todayClasses.length === 0 ? (
                <div className="py-8 text-center rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground space-y-2">
                  <p>No classes scheduled for today.</p>
                  <Link
                    href="/timetable"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Timetable Entry</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.todayClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-foreground mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-mono font-medium text-muted-foreground">
                            {cls.startTime} - {cls.endTime}
                          </div>
                          <div className="text-xs font-semibold text-foreground mt-0.5">
                            {cls.subject?.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            {cls.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {cls.room}
                              </span>
                            )}
                            {cls.instructor && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {cls.instructor}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
                        {cls.sessionType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Upcoming Deadlines
                  </h2>
                </div>
                <Link
                  href="/tasks"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {!data?.upcomingDeadlines || data.upcomingDeadlines.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No upcoming deadlines pending!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.upcomingDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-border transition-colors bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded border border-neutral-400 dark:border-neutral-600 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-foreground">{task.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {task.subject?.name || "General Academic"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded",
                            task.priority === "HIGH"
                              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold"
                              : task.priority === "MEDIUM"
                              ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                        </span>
                        {task.dueDate && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Subject Attendance & Upcoming Exams */}
          <div className="space-y-6">
            {/* Subject Attendance Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Subject Attendance
                  </h2>
                </div>
                <Link
                  href="/attendance"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {!data?.subjectAttendance || data.subjectAttendance.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No attendance records recorded yet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {data.subjectAttendance.map((sub) => (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{sub.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={cn(
                              "font-semibold",
                              sub.status === "Warning" ? "text-amber-500 dark:text-amber-400" : ""
                            )}
                          >
                            {sub.percentage}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({sub.attended}/{sub.total})
                          </span>
                        </div>
                      </div>
                      {/* Monochrome Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            sub.status === "Warning"
                              ? "bg-neutral-400 dark:bg-neutral-500"
                              : "bg-foreground"
                          )}
                          style={{ width: `${Math.min(100, sub.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Exams Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-foreground" />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Upcoming Exams
                  </h2>
                </div>
                <Link
                  href="/grades"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {!data?.upcomingExams || data.upcomingExams.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No examinations scheduled in the near future.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-border transition-colors bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-muted text-foreground">
                          <GraduationCap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground">{exam.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {exam.subject?.name} • Max Marks: {exam.maxMarks}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-medium text-foreground">
                          {formatDate(exam.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
