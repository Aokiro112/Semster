"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  Trash2,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface SubjectSummary {
  id: string;
  name: string;
  code: string;
  attended: number;
  missed: number;
  cancelled: number;
  total: number;
  percentage: number;
  status: "Good" | "Warning";
  canMissClasses: number;
  classesNeeded: number;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "ATTENDED" | "MISSED" | "CANCELLED";
  sessionType: string;
  notes: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

export default function AttendancePage() {
  const { activeSemesterId } = useSemester();
  const [summaries, setSummaries] = useState<SubjectSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [overall, setOverall] = useState({
    percentage: 100,
    totalConducted: 0,
    totalAttended: 0,
    totalMissed: 0,
  });
  const [policyThreshold, setPolicyThreshold] = useState(75.0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"subjects" | "log">("subjects");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Record Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [recordStatus, setRecordStatus] = useState<"ATTENDED" | "MISSED" | "CANCELLED">("ATTENDED");
  const [recordNotes, setRecordNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.subjectSummaries || []);
        setRecords(data.records || []);
        if (data.overall) setOverall(data.overall);
        if (data.policy?.thresholdPercentage) {
          setPolicyThreshold(data.policy.thresholdPercentage);
        }
        if (data.subjectSummaries && data.subjectSummaries.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(data.subjectSummaries[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [activeSemesterId]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          date: recordDate,
          status: recordStatus,
          notes: recordNotes,
        }),
      });

      if (res.ok) {
        toast.success(`Attendance logged as ${recordStatus}`);
        setIsAddModalOpen(false);
        setRecordNotes("");
        fetchAttendance();
      } else {
        toast.error("Failed to log attendance");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLog = async (subjectId: string, status: "ATTENDED" | "MISSED") => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          date: new Date().toISOString(),
          status,
        }),
      });

      if (res.ok) {
        toast.success(`Quick logged: +1 ${status === "ATTENDED" ? "Attended" : "Missed"}`);
        fetchAttendance();
      }
    } catch {
      toast.error("Failed to record attendance");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this historical attendance entry?")) return;
    try {
      const res = await fetch(`/api/attendance?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Attendance entry deleted");
        fetchAttendance();
      }
    } catch {
      toast.error("Error deleting entry");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Attendance"
        subtitle={`Real-time attendance tracking with ${policyThreshold}% requirement threshold and bunk allowance`}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Overall Attendance</div>
            <div
              className={cn(
                "text-2xl font-bold tracking-tight mt-2 font-mono",
                overall.percentage < policyThreshold
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-foreground"
              )}
            >
              {overall.percentage}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Required: {policyThreshold}%
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Total Classes</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {overall.totalConducted}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Conducted to date</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Attended</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {overall.totalAttended}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Present</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Missed</div>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {overall.totalMissed}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 text-neutral-500">
              <TrendingDown className="w-3 h-3" />
              <span>Absences</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40 w-fit">
          <button
            onClick={() => setActiveTab("subjects")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeTab === "subjects"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Subjects
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeTab === "log"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Attendance Log
          </button>
        </div>

        {/* Content based on Tab */}
        {activeTab === "subjects" ? (
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Subject</th>
                  <th className="p-3.5 text-center">Attended</th>
                  <th className="p-3.5 text-center">Total</th>
                  <th className="p-3.5 w-1/4">Percentage</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Forecast & Bunk Advice</th>
                  <th className="p-3.5 pr-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="font-semibold text-foreground">{sub.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{sub.code}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono text-foreground font-medium">
                      {sub.attended}
                    </td>
                    <td className="p-3.5 text-center font-mono text-muted-foreground">
                      {sub.total}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono font-semibold">
                          <span
                            className={
                              sub.status === "Warning" ? "text-amber-500 dark:text-amber-400" : ""
                            }
                          >
                            {sub.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              sub.status === "Warning"
                                ? "bg-neutral-400 dark:bg-neutral-500"
                                : "bg-foreground"
                            )}
                            style={{ width: `${Math.min(100, sub.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                          sub.status === "Good"
                            ? "bg-foreground text-background border-foreground font-semibold"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        )}
                      >
                        {sub.status === "Good" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Good</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Warning</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs">
                      {sub.status === "Good" ? (
                        <div className="text-muted-foreground">
                          Can miss{" "}
                          <span className="font-mono font-bold text-foreground">
                            {sub.canMissClasses}
                          </span>{" "}
                          more classes
                        </div>
                      ) : (
                        <div className="text-amber-600 dark:text-amber-400 font-medium">
                          Must attend{" "}
                          <span className="font-mono font-bold">{sub.classesNeeded}</span> next
                          classes
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickLog(sub.id, "ATTENDED")}
                          title="Record Present (+1 Attended)"
                          className="px-2 py-1 rounded border border-border bg-background hover:bg-muted font-mono text-[11px] font-medium text-foreground"
                        >
                          +1 Present
                        </button>
                        <button
                          onClick={() => handleQuickLog(sub.id, "MISSED")}
                          title="Record Absent (+1 Missed)"
                          className="px-2 py-1 rounded border border-border bg-background hover:bg-muted font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground"
                        >
                          +1 Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Attendance Log Tab */
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-3 border-b border-border bg-muted/20 text-xs font-semibold flex items-center justify-between">
              <span>Historical Attendance Logs (Last 100 Entries)</span>
              <span className="font-mono text-muted-foreground">{records.length} records</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold sticky top-0">
                  <tr>
                    <th className="p-3 pl-5">Date</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Session</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 pl-5 font-mono text-muted-foreground">
                        {formatDate(r.date)}
                      </td>
                      <td className="p-3 font-semibold text-foreground">{r.subject.name}</td>
                      <td className="p-3 font-mono text-[11px] uppercase text-muted-foreground">
                        {r.sessionType}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase",
                            r.status === "ATTENDED"
                              ? "bg-foreground text-background"
                              : r.status === "MISSED"
                              ? "bg-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-xs">
                        {r.notes || "—"}
                      </td>
                      <td className="p-3 pr-5 text-right">
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Record Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Log Attendance Record</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    {summaries.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Date</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["ATTENDED", "MISSED", "CANCELLED"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setRecordStatus(st)}
                        className={cn(
                          "py-2 rounded-lg border text-center font-mono font-medium text-xs transition-colors",
                          recordStatus === st
                            ? "bg-foreground text-background border-foreground font-semibold"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Notes / Topics Covered (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eigenvalues lecture, Chapter 2 started"
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
