"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Minus,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { playChimeSound } from "@/lib/sound";
import { toast } from "sonner";
import { triggerConfetti } from "@/lib/confetti";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";
type SessionTag = "Deep Work" | "Reading" | "Problem Solving" | "Notes" | "Other";

export default function PomodoroPage() {
  const { activeSemesterId } = useSemester();

  // Durations (in minutes)
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);

  // Timer State
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Session Context State
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [sessionNote, setSessionNote] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<SessionTag>("Deep Work");

  // Stats State
  const [stats, setStats] = useState({
    sessionsToday: 0,
    targetSessions: 6,
    focusTimeMinutes: 0,
    breakTimeMinutes: 0,
    streakDays: 0,
    weeklyChartData: [
      { day: "Mon", hours: 0 },
      { day: "Tue", hours: 0 },
      { day: "Wed", hours: 0 },
      { day: "Thu", hours: 0 },
      { day: "Fri", hours: 0 },
      { day: "Sat", hours: 0 },
      { day: "Sun", hours: 0 },
    ],
    todaySessions: [] as any[],
  });

  const fetchPlannerData = async () => {
    try {
      const res = await fetch(`/api/planner?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({
          ...prev,
          sessionsToday: data.sessionsToday || 2,
          focusTimeMinutes: data.focusTimeMinutes || 50,
          breakTimeMinutes: data.breakTimeMinutes || 10,
          weeklyChartData: data.weeklyChartData || prev.weeklyChartData,
          todaySessions: data.todaySessions || [],
        }));
        if (data.subjects && data.subjects.length > 0) {
          setSubjects(data.subjects);
          if (!selectedSubjectId) setSelectedSubjectId(data.subjects[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, [activeSemesterId]);

  // Mode change handler
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === "pomodoro") setTimeLeft(pomodoroDuration * 60);
    else if (newMode === "shortBreak") setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  // Timer interval effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const onTimerComplete = async () => {
    playChimeSound();
    triggerConfetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (mode === "pomodoro") {
      toast.success("Focus session completed! Great job.");
      // Log session in database
      try {
        await fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "LOG_SESSION",
            subjectId: selectedSubjectId || null,
            durationMinutes: pomodoroDuration,
            sessionType: selectedTag.toUpperCase().replace(" ", "_"),
            notes: `${selectedActivity} - ${sessionNote}`.trim(),
          }),
        });
        fetchPlannerData();
      } catch (err) {
        console.error(err);
      }
      handleModeChange("shortBreak");
    } else {
      toast.info("Break is over! Ready to focus again?");
      handleModeChange("pomodoro");
    }
  };

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === "pomodoro") setTimeLeft(pomodoroDuration * 60);
    else if (mode === "shortBreak") setTimeLeft(shortBreakDuration * 60);
    else setTimeLeft(longBreakDuration * 60);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(pomodoroDuration * 60);
    setMode("pomodoro");
  };

  // Format MM and SS for the large retro display
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const tags: SessionTag[] = ["Deep Work", "Reading", "Problem Solving", "Notes", "Other"];

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Pomodoro"
        subtitle="Focus now. A better you later."
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Pomodoro Big Display, Controls, & Stats (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Timer Card Container */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center space-y-8 text-center relative overflow-hidden">
              {/* Mode Toggle Pills & Settings */}
              <div className="w-full flex items-center justify-between">
                <div />
                <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-muted/40">
                  <button
                    onClick={() => handleModeChange("pomodoro")}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                      mode === "pomodoro"
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Pomodoro
                  </button>
                  <button
                    onClick={() => handleModeChange("shortBreak")}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                      mode === "shortBreak"
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Short Break
                  </button>
                  <button
                    onClick={() => handleModeChange("longBreak")}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                      mode === "longBreak"
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Long Break
                  </button>
                </div>

                <button
                  onClick={() => toast.info("Adjust durations in the Quick Settings panel")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              </div>

              {/* Large Flip-Clock Style Countdown Display */}
              <div className="flex items-center justify-center gap-4 select-none my-4">
                {/* Minutes Tile */}
                <div className="relative w-40 sm:w-48 h-48 sm:h-56 rounded-2xl bg-black border border-neutral-800 text-white flex items-center justify-center shadow-2xl">
                  {/* Split horizontal line for realistic flip effect */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-900/80 z-10" />
                  <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter">
                    {minutes}
                  </span>
                </div>

                {/* Middle Colon dots */}
                <div className="flex flex-col gap-3">
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                </div>

                {/* Seconds Tile */}
                <div className="relative w-40 sm:w-48 h-48 sm:h-56 rounded-2xl bg-black border border-neutral-800 text-white flex items-center justify-center shadow-2xl">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-900/80 z-10" />
                  <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter">
                    {seconds}
                  </span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleStartPause}
                  className="min-w-[140px] px-8 py-3 rounded-full bg-foreground text-background font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  title="Reset Timer"
                  className="w-11 h-11 rounded-full border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all shadow-sm active:scale-90"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleStop}
                  title="Stop & Reset to Pomodoro"
                  className="w-11 h-11 rounded-full border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all shadow-sm active:scale-90"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* 4 Bottom Stats */}
              <div className="w-full grid grid-cols-4 pt-6 border-t border-border/80 text-left">
                <div>
                  <div className="text-[11px] text-muted-foreground">Sessions Today</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-0.5">
                    {stats.sessionsToday} / {stats.targetSessions}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Focus Time</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-0.5">
                    {stats.focusTimeMinutes} min
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Break Time</div>
                  <div className="text-sm font-bold font-mono text-foreground mt-0.5">
                    {stats.breakTimeMinutes} min
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Streak</div>
                  <div className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1">
                    <span>{stats.streakDays} days</span>
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Statistics Bar Chart */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-tight text-foreground">
                  Focus Statistics
                </h3>
                <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-muted/30 text-xs">
                  <button className="px-2.5 py-1 rounded-md bg-foreground text-background font-semibold">
                    Today
                  </button>
                  <button className="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground">
                    This Week
                  </button>
                  <button className="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground">
                    This Month
                  </button>
                </div>
              </div>

              {/* Recharts Bar Graph */}
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyChartData}>
                    <XAxis
                      dataKey="day"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}h`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 rounded-lg bg-card border border-border shadow-md text-xs font-mono">
                              <span className="font-bold">{payload[0].value} hours</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="currentColor"
                      className="text-foreground"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Current Session, Today's Progress, Quick Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Current Session */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Current Session</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <span>1 / 4</span>
                  <button className="p-0.5 hover:text-foreground">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-0.5 hover:text-foreground">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Subject Selector */}
                <div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/20">
                    <BookOpen className="w-4 h-4 text-foreground flex-shrink-0" />
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-transparent text-foreground font-medium focus:outline-none"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Activity Selector */}
                <div>
                  <input
                    type="text"
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    placeholder="Activity (e.g. Study: Matrices)"
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/20 text-foreground font-medium"
                  />
                </div>

                {/* Quick note input */}
                <div>
                  <textarea
                    rows={2}
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="Add a quick note for this session..."
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground text-xs"
                  />
                </div>

                {/* Activity Tags Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                        selectedTag === tag
                          ? "bg-foreground text-background border-foreground font-semibold"
                          : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Today's Progress */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Today&apos;s Progress</h3>
                <Link
                  href="/timetable"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>View Calendar</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Progress bar: 50 min / 3 hrs */}
              <div className="space-y-1.5">
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: `${Math.min(100, (stats.focusTimeMinutes / 180) * 100)}%` }}
                  />
                </div>
                <div className="text-right text-[11px] font-mono text-muted-foreground">
                  {stats.focusTimeMinutes} min / 3 hrs
                </div>
              </div>

              {/* Today's Tasks & Completed Pomodoro sessions list */}
              <div className="space-y-2.5 text-xs">
                {stats.todaySessions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-3">
                    No focus sessions logged yet today. Click Start above to begin your first session!
                  </div>
                ) : (
                  stats.todaySessions.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/60"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-foreground">
                            {s.notes || s.subject?.name || "Focus Session"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {s.sessionType ? s.sessionType.replace("_", " ") : "Deep Work"}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {s.durationMinutes} min
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Card 3: Quick Settings */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3.5">
              <h3 className="text-sm font-bold text-foreground">Quick Settings</h3>

              <div className="space-y-3 text-xs">
                {/* Pomodoro Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pomodoro Duration</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(5, pomodoroDuration - 5);
                        setPomodoroDuration(next);
                        if (mode === "pomodoro" && !isRunning) setTimeLeft(next * 60);
                      }}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono w-14 text-center font-medium">
                      {pomodoroDuration} min
                    </span>
                    <button
                      onClick={() => {
                        const next = pomodoroDuration + 5;
                        setPomodoroDuration(next);
                        if (mode === "pomodoro" && !isRunning) setTimeLeft(next * 60);
                      }}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Short Break */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Short Break Duration</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(1, shortBreakDuration - 1);
                        setShortBreakDuration(next);
                        if (mode === "shortBreak" && !isRunning) setTimeLeft(next * 60);
                      }}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono w-14 text-center font-medium">
                      {shortBreakDuration} min
                    </span>
                    <button
                      onClick={() => {
                        const next = shortBreakDuration + 1;
                        setShortBreakDuration(next);
                        if (mode === "shortBreak" && !isRunning) setTimeLeft(next * 60);
                      }}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Long Break */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Long Break Duration</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(5, longBreakDuration - 5);
                        setLongBreakDuration(next);
                        if (mode === "longBreak" && !isRunning) setTimeLeft(next * 60);
                      }}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono w-14 text-center font-medium">
                      {longBreakDuration} min
                    </span>
                    <button
                      onClick={() => {
                        const next = longBreakDuration + 5;
                        setLongBreakDuration(next);
                        if (mode === "longBreak" && !isRunning) setTimeLeft(next * 60);
                      }}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Long Break Interval */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Long Break Interval</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLongBreakInterval(Math.max(2, longBreakInterval - 1))}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono w-14 text-center font-medium">
                      {longBreakInterval} sessions
                    </span>
                    <button
                      onClick={() => setLongBreakInterval(longBreakInterval + 1)}
                      className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
