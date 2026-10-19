"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  History,
  ArrowRight,
  Flame,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { triggerConfetti } from "@/lib/confetti";

interface GoalItem {
  id: string;
  title: string;
  completed: boolean;
  durationEstMinutes: number | null;
}

export default function StudyPlannerOverviewPage() {
  const { activeSemesterId } = useSemester();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPlanner = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/planner?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanner();
  }, [activeSemesterId]);

  const handleToggleGoal = async (goalId: string, current: boolean) => {
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_GOAL",
          goalId,
          completed: !current,
        }),
      });

      if (res.ok) {
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, completed: !current } : g))
        );
        if (!current) {
          toast.success("Goal completed!");
          triggerConfetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        }
      }
    } catch {
      toast.error("Failed to update goal");
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_GOAL",
          semesterId: activeSemesterId,
          title: newGoalTitle,
        }),
      });

      if (res.ok) {
        toast.success("Daily goal added!");
        setNewGoalTitle("");
        setIsAddingGoal(false);
        fetchPlanner();
      }
    } catch {
      toast.error("Error creating goal");
    }
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progressPct = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Study Planner"
        subtitle="Daily academic goals, focused study sessions, and spaced repetition queues"
        actions={
          <Link
            href="/planner/pomodoro"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Launch Pomodoro</span>
          </Link>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs for Planner Modules */}
        <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
          <Link
            href="/planner"
            className="px-3 py-1.5 rounded-lg bg-foreground text-background font-semibold"
          >
            Overview & Goals
          </Link>
          <Link
            href="/planner/pomodoro"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Pomodoro Focus
          </Link>
          <Link
            href="/planner/revision"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Revision Queue (SM-2)
          </Link>
          <Link
            href="/planner/sessions"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Study Sessions History
          </Link>
        </div>

        {/* 2-column layout matching Screenshot 2 Bottom Left */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Today's Goals */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Today&apos;s Goals</h3>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  {completedCount}/{goals.length} completed ({progressPct}%)
                </div>
              </div>
              <button
                onClick={() => setIsAddingGoal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-foreground hover:opacity-80"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Goals List */}
            <div className="space-y-2">
              {goals.map((g) => (
                <div
                  key={g.id}
                  onClick={() => handleToggleGoal(g.id, g.completed)}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:border-border hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {g.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        g.completed ? "line-through text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {g.title}
                    </span>
                  </div>
                  {g.durationEstMinutes && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {g.durationEstMinutes}m
                    </span>
                  )}
                </div>
              ))}

              {isAddingGoal && (
                <form onSubmit={handleAddGoal} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Read 15 pages of Circuit Theory..."
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    autoFocus
                    className="flex-1 p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-foreground text-background text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingGoal(false)}
                    className="px-2 py-2 text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Pomodoro Shortcut Widget */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Pomodoro Timer</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deep focus sessions with acoustic completion chimes
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>3 Day Streak</span>
              </span>
            </div>

            {/* Circular or Minimalist Timer Display */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-36 h-36 rounded-full border-4 border-foreground flex items-center justify-center shadow-lg bg-card">
                <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                  25:00
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Standard 25 min Focus Interval
              </div>
            </div>

            <Link
              href="/planner/pomodoro"
              className="w-full py-3 rounded-xl bg-foreground text-background font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open Dedicated Flip Pomodoro</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
