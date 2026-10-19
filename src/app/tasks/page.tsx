"use client";

import React, { useEffect, useState } from "react";
import {
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  X,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "TODO" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED";
  taskType: string;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export default function TasksPage() {
  const { activeSemesterId } = useSemester();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [taskType, setTaskType] = useState("ASSIGNMENT");
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
      // Also fetch subjects for dropdown
      const subRes = await fetch(`/api/subjects?semesterId=${activeSemesterId}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        const subs = (subData.subjects || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }));
        setSubjects(subs);
        if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeSemesterId]);

  const handleStatusChange = async (
    taskId: string,
    newStatus: "TODO" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED"
  ) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        if (newStatus === "COMPLETED") {
          toast.success("Task completed!");
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        } else {
          toast.info(`Status updated to ${newStatus.replace("_", " ")}`);
        }
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      toast.error("Error deleting task");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: activeSemesterId,
          subjectId: subjectId || null,
          title,
          description,
          dueDate: dueDate || null,
          priority,
          taskType,
        }),
      });

      if (res.ok) {
        toast.success("Task created successfully!");
        setIsAddModalOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        fetchTasks();
      } else {
        toast.error("Failed to create task");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "To Do", value: "TODO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Completed", value: "COMPLETED" },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedFilter === "ALL") return true;
    return t.status === selectedFilter;
  });

  const kanbanColumns = [
    { title: "To Do", status: "TODO" as const },
    { title: "In Progress", status: "IN_PROGRESS" as const },
    { title: "Submitted", status: "SUBMITTED" as const },
    { title: "Completed", status: "COMPLETED" as const },
  ];

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Tasks & Assignments"
        subtitle="Manage coursework, lab submissions, problem sets, and personal study tasks"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Controls Bar: Filter tabs & View mode toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedFilter(tab.value)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                  selectedFilter === tab.value
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "kanban"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode: List */}
        {viewMode === "list" ? (
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5 pl-5 w-8"></th>
                  <th className="p-3.5">Title & Description</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-center">Priority</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                      No tasks found in this view.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              t.id,
                              t.status === "COMPLETED" ? "TODO" : "COMPLETED"
                            )
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {t.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-4 h-4 text-foreground" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div
                          className={cn(
                            "font-semibold text-foreground",
                            t.status === "COMPLETED" ? "line-through text-muted-foreground" : ""
                          )}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-md mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">
                        {t.subject?.code || "General"}
                      </td>
                      <td className="p-3.5 font-mono text-foreground">
                        {formatDate(t.dueDate) || "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded font-mono uppercase",
                            t.priority === "HIGH"
                              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold"
                              : t.priority === "MEDIUM"
                              ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value as any)}
                          className="text-[11px] font-mono px-2 py-1 rounded border border-border bg-background text-foreground"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode: Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between min-h-[400px]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {col.title}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {colTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-lg border border-border bg-muted/20 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all space-y-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground leading-tight">
                              {t.title}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="text-muted-foreground hover:text-destructive p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {t.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {t.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                            <span className="font-mono text-muted-foreground">
                              {t.subject?.code || "General"}
                            </span>
                            <span
                              className={cn(
                                "font-mono font-medium",
                                t.priority === "HIGH" ? "font-bold text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {t.priority}
                            </span>
                          </div>

                          {/* Quick move buttons */}
                          <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-mono">
                            {col.status !== "TODO" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    t.id,
                                    col.status === "COMPLETED"
                                      ? "SUBMITTED"
                                      : col.status === "SUBMITTED"
                                      ? "IN_PROGRESS"
                                      : "TODO"
                                  )
                                }
                                className="hover:text-foreground"
                              >
                                ← Prev
                              </button>
                            )}
                            {col.status !== "COMPLETED" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    t.id,
                                    col.status === "TODO"
                                      ? "IN_PROGRESS"
                                      : col.status === "IN_PROGRESS"
                                      ? "SUBMITTED"
                                      : "COMPLETED"
                                  )
                                }
                                className="hover:text-foreground ml-auto"
                              >
                                Next →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {col.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Task Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Add New Task / Assignment</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Numerical Sheet 4 - Integration"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Instructions, problem set numbers, submission portal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Task Type</label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="LAB_REPORT">Lab Report</option>
                      <option value="QUIZ">Quiz Prep</option>
                      <option value="PROJECT">Project</option>
                      <option value="STUDY_TASK">Study Task</option>
                    </select>
                  </div>
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
                    {submitting ? "Creating..." : "Create Task"}
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
