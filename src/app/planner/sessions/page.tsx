"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { History, Clock, BookOpen, Calendar, ArrowRight } from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { formatDate } from "@/lib/utils";

interface SessionRecord {
  id: string;
  durationMinutes: number;
  sessionType: string;
  notes: string | null;
  date: string;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export default function StudySessionsPage() {
  const { activeSemesterId } = useSemester();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/planner?semesterId=${activeSemesterId}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.todaySessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSemesterId]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Study Sessions History"
        subtitle="Complete log of completed focus blocks, deep work intervals, and subject breakdown"
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
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Revision Queue (SM-2)
          </Link>
          <Link
            href="/planner/sessions"
            className="px-3 py-1.5 rounded-lg bg-foreground text-background font-semibold"
          >
            Study Sessions History
          </Link>
        </div>

        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5 pl-5">Date & Time</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Focus Activity & Notes</th>
                <th className="p-3.5 text-center">Tag</th>
                <th className="p-3.5 pr-5 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                    No study sessions recorded yet today. Start a Pomodoro timer to record focus
                    blocks!
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-muted-foreground">
                      {formatDate(s.date)}
                    </td>
                    <td className="p-3.5 font-semibold text-foreground">
                      {s.subject?.name || "General Study"}
                    </td>
                    <td className="p-3.5 text-foreground">{s.notes || "Pomodoro Session"}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {s.sessionType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right font-mono font-bold text-foreground">
                      {s.durationMinutes} min
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
