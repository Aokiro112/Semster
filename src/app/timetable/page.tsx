"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn, formatTime } from "@/lib/utils";
import { toast } from "sonner";

interface TimetableEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
  sessionType: string;
  subject: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  instructor: string | null;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

export default function TimetablePage() {
  const { activeSemesterId } = useSemester();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"weekly" | "calendar">("weekly");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("MON");
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("09:30");
  const [room, setRoom] = useState("L-101");
  const [instructor, setInstructor] = useState("");
  const [sessionType, setSessionType] = useState("LECTURE");
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/timetable?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setSubjects(data.subjects || []);
        if (data.subjects && data.subjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(data.subjects[0].id);
          setInstructor(data.subjects[0].instructor || "");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [activeSemesterId]);

  const handleSubjectChange = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = subjects.find((s) => s.id === subId);
    if (sub?.instructor) setInstructor(sub.instructor);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: activeSemesterId,
          subjectId: selectedSubjectId,
          dayOfWeek,
          startTime,
          endTime,
          room,
          instructor,
          sessionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setConflictError(data.error || "Failed to add class session.");
        toast.error(data.error || "Schedule conflict detected");
        setSubmitting(false);
        return;
      }

      toast.success("Class session scheduled successfully!");
      setIsAddModalOpen(false);
      fetchTimetable();
    } catch (err) {
      console.error(err);
      toast.error("Network error while adding class");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to remove this timetable entry?")) return;

    try {
      const res = await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Class entry removed");
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error("Failed to delete entry");
      }
    } catch {
      toast.error("Error deleting entry");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Timetable"
        subtitle="Weekly academic routine, class slots, and conflict-checked schedule"
        actions={
          <button
            onClick={() => {
              setConflictError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* View switcher tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40">
            <button
              onClick={() => setViewMode("weekly")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "weekly"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "calendar"
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Daily List
            </button>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {entries.length} scheduled sessions
          </span>
        </div>

        {/* Weekly Timetable Grid */}
        {viewMode === "weekly" ? (
          <div className="border border-border rounded-xl bg-card overflow-x-auto shadow-sm">
            <div className="min-w-[800px]">
              {/* Header Days Row */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-xs font-semibold">
                <div className="p-3 border-r border-border text-center text-muted-foreground">
                  Time
                </div>
                {DAYS.map((day) => (
                  <div key={day} className="p-3 border-r border-border text-center text-foreground last:border-r-0">
                    {DAY_LABELS[day]}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div className="divide-y divide-border">
                {TIME_SLOTS.map((slotHour) => {
                  const hourInt = parseInt(slotHour.split(":")[0], 10);
                  const displayTime =
                    hourInt > 12 ? `${hourInt - 12}:00 PM` : `${hourInt}:00 ${hourInt === 12 ? "PM" : "AM"}`;

                  return (
                    <div key={slotHour} className="grid grid-cols-7 min-h-[90px]">
                      {/* Time Column */}
                      <div className="p-2 border-r border-border bg-muted/10 text-center font-mono text-[11px] text-muted-foreground flex items-start justify-center pt-3">
                        {displayTime}
                      </div>

                      {/* Day Columns */}
                      {DAYS.map((day) => {
                        // Find entries matching this day and hour range
                        const dayEntries = entries.filter((e) => {
                          if (e.dayOfWeek !== day) return false;
                          const startH = parseInt(e.startTime.split(":")[0], 10);
                          return startH === hourInt;
                        });

                        return (
                          <div
                            key={`${day}-${slotHour}`}
                            className="p-1.5 border-r border-border last:border-r-0 flex flex-col gap-1.5 relative group"
                          >
                            {dayEntries.map((item) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "p-2 rounded-lg border text-left flex flex-col justify-between transition-all",
                                  item.sessionType === "LAB"
                                    ? "bg-muted/80 border-border text-foreground min-h-[75px]"
                                    : "bg-muted/40 hover:bg-muted border-border text-foreground"
                                )}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="text-[11px] font-semibold tracking-tight truncate leading-snug">
                                    {item.subject?.code || item.subject?.name}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteClass(item.id)}
                                    title="Delete session"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive rounded transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                  {item.startTime} - {item.endTime}
                                </div>
                                {item.room && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>{item.room}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Daily List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map((day) => {
              const dayEntries = entries.filter((e) => e.dayOfWeek === day);
              return (
                <div key={day} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-sm font-bold text-foreground">{DAY_LABELS[day]}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {dayEntries.length} classes
                    </span>
                  </div>
                  {dayEntries.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No classes scheduled
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayEntries.map((e) => (
                        <div
                          key={e.id}
                          className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-foreground">
                              {e.subject.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {e.startTime} - {e.endTime} {e.room ? `• ${e.room}` : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteClass(e.id)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Class Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Add Class Session</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {conflictError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{conflictError}</span>
                </div>
              )}

              <form onSubmit={handleAddClass} className="space-y-3.5 text-xs">
                {/* Subject Dropdown */}
                <div>
                  <label className="block font-medium text-foreground mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of Week */}
                <div>
                  <label className="block font-medium text-foreground mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {DAY_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Room & Instructor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Room / Hall</label>
                    <input
                      type="text"
                      placeholder="e.g. L-101"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Instructor</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Sharma"
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    />
                  </div>
                </div>

                {/* Session Type */}
                <div>
                  <label className="block font-medium text-foreground mb-1">Session Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["LECTURE", "LAB", "TUTORIAL"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSessionType(type)}
                        className={cn(
                          "py-2 rounded-lg border text-center font-mono font-medium text-xs transition-colors",
                          sessionType === type
                            ? "bg-foreground text-background border-foreground font-semibold"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
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
                    {submitting ? "Checking..." : "Schedule Class"}
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
