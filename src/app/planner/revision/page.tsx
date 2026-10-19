"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { calculateNextReview } from "@/lib/calculations/spaced-repetition";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface RevisionTopic {
  id: string;
  title: string;
  status: string;
  module: {
    name: string;
    subject: {
      name: string;
      code: string;
    };
  };
  intervalDays?: number;
  repetitionCount?: number;
  easeFactor?: number;
  nextReviewDate?: Date;
}

export default function RevisionQueuePage() {
  const { activeSemesterId } = useSemester();
  const [topics, setTopics] = useState<RevisionTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRevisionTopics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subjects?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        const revTopics: RevisionTopic[] = [];

        (data.subjects || []).forEach((s: any) => {
          (s.modules || []).forEach((m: any) => {
            (m.topics || []).forEach((t: any) => {
              if (t.status === "NEEDS_REVISION") {
                revTopics.push({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  module: {
                    name: m.name,
                    subject: { name: s.name, code: s.code },
                  },
                  intervalDays: 1,
                  repetitionCount: 0,
                  easeFactor: 2.5,
                  nextReviewDate: new Date(),
                });
              }
            });
          });
        });

        setTopics(revTopics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevisionTopics();
  }, [activeSemesterId]);

  const handleRateRecall = async (topicId: string, rating: number) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;

    const sm2 = calculateNextReview(
      {
        intervalDays: topic.intervalDays || 1,
        repetitionCount: topic.repetitionCount || 0,
        easeFactor: topic.easeFactor || 2.5,
      },
      rating
    );

    // If recalled well (rating >= 4), mark as COMPLETED in syllabus!
    if (rating >= 4) {
      await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: "COMPLETED" }),
      });
      toast.success(
        `Topic mastered! Next review scheduled in ${sm2.intervalDays} days (${formatDate(
          sm2.nextReviewDate
        )})`
      );
    } else {
      toast.info(`Next review interval reset to ${sm2.intervalDays} day`);
    }

    setTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Revision Queue"
        subtitle="Spaced repetition (SM-2) engine prioritizing weak engineering topics"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-3 text-xs">
          <Link
            href="/planner"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
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
            className="px-3 py-1.5 rounded-lg bg-foreground text-background font-semibold"
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

        <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Topics Awaiting Revision ({topics.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rate your active recall difficulty to adjust the SM-2 spaced repetition curve.
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Algorithm: SuperMemo SM-2
            </span>
          </div>

          {topics.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <CheckCircle2 className="w-8 h-8 text-foreground mx-auto" />
              <p>No topics currently flagged for revision!</p>
              <p className="text-[11px] text-muted-foreground">
                You can tag any difficult topic in the Subjects & Syllabus module as &quot;Needs
                Revision&quot; to queue it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.module.subject.code} • {t.module.name}
                      </span>
                      <h4 className="text-sm font-bold text-foreground mt-1">{t.title}</h4>
                    </div>
                    <span className="text-xs font-mono text-amber-500 font-semibold">
                      Needs Review Today
                    </span>
                  </div>

                  {/* Rating Buttons */}
                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] text-muted-foreground mr-1">Recall Quality:</span>
                    <button
                      onClick={() => handleRateRecall(t.id, 1)}
                      className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground font-medium"
                    >
                      1 - Blackout
                    </button>
                    <button
                      onClick={() => handleRateRecall(t.id, 2)}
                      className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground font-medium"
                    >
                      2 - Hard
                    </button>
                    <button
                      onClick={() => handleRateRecall(t.id, 3)}
                      className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground font-medium"
                    >
                      3 - Moderate
                    </button>
                    <button
                      onClick={() => handleRateRecall(t.id, 4)}
                      className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-foreground font-semibold"
                    >
                      4 - Good Recall
                    </button>
                    <button
                      onClick={() => handleRateRecall(t.id, 5)}
                      className="px-2.5 py-1 rounded-md bg-foreground text-background font-semibold hover:opacity-90"
                    >
                      5 - Mastered (Perfect)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
