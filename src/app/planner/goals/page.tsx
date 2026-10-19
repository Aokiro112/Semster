"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  ArrowRight,
  TrendingUp,
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

export default function GoalsPage() {
  const { activeSemesterId } = useSemester();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [durationEst, setDurationEst] = useState("30");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
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
    fetchGoals();
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
          triggerConfetti({ particleCount: 35, spread: 55, origin: { y: 0.8 } });
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
          durationEstMinutes: parseInt(durationEst, 10) || 30,
        }),
      });

      if (res.ok) {
        toast.success("Study goal added!");
        setNewGoalTitle("");
        setIsAddingGoal(false);
        fetchGoals();
      }
    } catch {
      toast.error("Error creating goal");
    }
  };

  const completedGoals = goals.filter((g) => g.completed);
  const pendingGoals = goals.filter((g) => !g.completed);
  const progressPct = goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0;
  const totalEstTime = goals.reduce((acc, g) => acc + (g.durationEstMinutes || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Study Goals"
        subtitle="Set actionable daily milestones, track progress, and build academic momentum"
        actions={
          <button
            onClick={() => setIsAddingGoal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
          <Link
            href="/planner"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Overview
          </Link>
          <Link
            href="/planner/pomodoro"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Pomodoro Focus
          </Link>
          <Link
            href="/planner/goals"
            className="px-3 py-1.5 rounded-lg bg-foreground text-background font-semibold"
          >
            Daily & Weekly Goals
          </Link>
          <Link
            href="/planner/revision"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Revision Queue
          </Link>
          <Link
            href="/planner/sessions"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Sessions History
          </Link>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Completion Rate</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {progressPct}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {completedGoals.length} of {goals.length} goals achieved
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Pending Goals</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {pendingGoals.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Awaiting action today
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Estimated Workload</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {totalEstTime}m
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              ~{(totalEstTime / 60).toFixed(1)} focus hours required
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Goal Progress</span>
            <span className="font-mono font-medium text-foreground">{progressPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Add Goal Modal / Inline Form */}
        {isAddingGoal && (
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Create New Goal</h4>
            <form onSubmit={handleAddGoal} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. Solve 5 problems on Laplace Transforms..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                autoFocus
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs"
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est. Duration:</span>
                  <select
                    value={durationEst}
                    onChange={(e) => setDurationEst(e.target.value)}
                    className="p-1 rounded border border-border bg-background text-foreground text-xs"
                  >
                    <option value="15">15 min</option>
                    <option value="25">25 min (1 Pomodoro)</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setIsAddingGoal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {/* Pending Section */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Pending Goals ({pendingGoals.length})
            </h3>
            {pendingGoals.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                All goals for today are completed! Great work.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingGoals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGoal(g.id, g.completed)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/80 hover:border-border hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                      <span className="text-xs font-medium text-foreground">{g.title}</span>
                    </div>
                    {g.durationEstMinutes && (
                      <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded border border-border bg-background">
                        {g.durationEstMinutes}m
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          {completedGoals.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3 opacity-80">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Completed Goals ({completedGoals.length})
              </h3>
              <div className="space-y-2">
                {completedGoals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGoal(g.id, g.completed)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/10 cursor-pointer transition-colors bg-muted/10"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-foreground" />
                      <span className="text-xs font-medium line-through text-muted-foreground">
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
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
