"use client";

import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckSquare,
  GraduationCap,
  X,
  Layers,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { triggerConfetti } from "@/lib/confetti";

interface Topic {
  id: string;
  title: string;
  orderIndex: number;
  status: "NOT_STARTED" | "LEARNING" | "COMPLETED" | "NEEDS_REVISION";
}

interface Module {
  id: string;
  name: string;
  orderIndex: number;
  topics: Topic[];
}

interface SubjectDetail {
  id: string;
  name: string;
  code: string;
  credits: number;
  instructor: string | null;
  courseType: string;
  modules: Module[];
  tasks: Array<{ id: string; title: string; dueDate: string | null; status: string }>;
  assessments: Array<{ id: string; title: string; date: string | null; maxMarks: number }>;
  notes: Array<{ id: string; title: string; updatedAt: string }>;
}

export default function SubjectsPage() {
  const { activeSemesterId } = useSemester();
  const [subjects, setSubjects] = useState<SubjectDetail[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"syllabus" | "notes" | "assignments" | "exams">("syllabus");
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Modals
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubCredits, setNewSubCredits] = useState("4");
  const [newSubInstructor, setNewSubInstructor] = useState("");

  const [newTopicModuleId, setNewTopicModuleId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subjects?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        const list: SubjectDetail[] = data.subjects || [];
        setSubjects(list);
        if (list.length > 0) {
          if (!selectedSubjectId || !list.some((s) => s.id === selectedSubjectId)) {
            setSelectedSubjectId(list[0].id);
          }
          // Expand all modules by default
          const exp: Record<string, boolean> = {};
          list.forEach((s) => s.modules.forEach((m) => (exp[m.id] = true)));
          setExpandedModules(exp);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [activeSemesterId]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Calculate Syllabus Completion
  const allTopics = activeSubject ? activeSubject.modules.flatMap((m) => m.topics) : [];
  const completedTopicsCount = allTopics.filter((t) => t.status === "COMPLETED").length;
  const totalTopicsCount = allTopics.length;
  const syllabusProgress =
    totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  const handleToggleTopic = async (topicId: string, currentStatus: string) => {
    // Cycle: NOT_STARTED -> COMPLETED -> NEEDS_REVISION -> NOT_STARTED
    let nextStatus = "COMPLETED";
    if (currentStatus === "COMPLETED") nextStatus = "NEEDS_REVISION";
    else if (currentStatus === "NEEDS_REVISION") nextStatus = "NOT_STARTED";
    else nextStatus = "COMPLETED";

    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, status: nextStatus }),
      });

      if (res.ok) {
        setSubjects((prev) =>
          prev.map((s) => ({
            ...s,
            modules: s.modules.map((m) => ({
              ...m,
              topics: m.topics.map((t) => (t.id === topicId ? { ...t, status: nextStatus as any } : t)),
            })),
          }))
        );

        if (nextStatus === "COMPLETED") {
          toast.success("Topic marked as completed!");
          triggerConfetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
        } else if (nextStatus === "NEEDS_REVISION") {
          toast.info("Topic marked for revision queue");
        }
      }
    } catch {
      toast.error("Failed to update topic status");
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: activeSemesterId,
          name: newSubName,
          code: newSubCode,
          credits: parseInt(newSubCredits, 10),
          instructor: newSubInstructor,
        }),
      });

      if (res.ok) {
        toast.success("Subject added!");
        setIsAddSubjectOpen(false);
        setNewSubName("");
        setNewSubCode("");
        fetchSubjects();
      }
    } catch {
      toast.error("Error creating subject");
    }
  };

  const handleAddTopic = async (moduleId: string) => {
    if (!newTopicTitle.trim()) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, newTopicTitle }),
      });

      if (res.ok) {
        toast.success("Topic added to module");
        setNewTopicTitle("");
        setNewTopicModuleId(null);
        fetchSubjects();
      }
    } catch {
      toast.error("Error adding topic");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Subjects & Syllabus"
        subtitle="Manage curriculum, module breakdown, learning checklist, and subject records"
        actions={
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Subjects Catalog */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Enrolled Subjects ({subjects.length})
            </div>

            <div className="space-y-2">
              {subjects.map((sub) => {
                const isSelected = sub.id === activeSubject?.id;
                const topics = sub.modules.flatMap((m) => m.topics);
                const comp = topics.filter((t) => t.status === "COMPLETED").length;
                const pct = topics.length > 0 ? Math.round((comp / topics.length) * 100) : 0;

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between group",
                      isSelected
                        ? "bg-card border-foreground/40 shadow-sm ring-1 ring-border"
                        : "bg-card/40 border-border hover:bg-card hover:border-neutral-400 dark:hover:border-neutral-700"
                    )}
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-foreground">
                        {sub.name}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {sub.code} • {sub.credits} Credits
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{pct}% complete</span>
                      <span>
                        {comp}/{topics.length} topics
                      </span>
                    </div>

                    <div className="w-full h-1 rounded-full bg-muted mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Subject Header & Modules */}
          <div className="md:col-span-8 space-y-6">
            {activeSubject ? (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                {/* Subject Header */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        {activeSubject.name}
                      </h2>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {activeSubject.code} • {activeSubject.credits} Credits
                        {activeSubject.instructor ? ` • ${activeSubject.instructor}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-foreground">
                        {completedTopicsCount}/{totalTopicsCount} topics ({syllabusProgress}%)
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all duration-500"
                      style={{ width: `${syllabusProgress}%` }}
                    />
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-border flex items-center gap-6 text-xs font-medium">
                  {(["syllabus", "notes", "assignments", "exams"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "pb-2.5 capitalize transition-colors relative",
                        activeTab === tab
                          ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab: Syllabus */}
                {activeTab === "syllabus" && (
                  <div className="space-y-4">
                    {activeSubject.modules.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No syllabus modules configured for this subject yet.
                      </div>
                    ) : (
                      activeSubject.modules.map((mod) => {
                        const isExpanded = expandedModules[mod.id] ?? true;
                        const modCompleted = mod.topics.filter((t) => t.status === "COMPLETED").length;

                        return (
                          <div
                            key={mod.id}
                            className="rounded-xl border border-border bg-muted/10 overflow-hidden"
                          >
                            {/* Module header */}
                            <div
                              onClick={() =>
                                setExpandedModules((prev) => ({
                                  ...prev,
                                  [mod.id]: !isExpanded,
                                }))
                              }
                              className="p-3.5 bg-muted/30 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-xs font-bold text-foreground">
                                  {mod.name}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">
                                {modCompleted}/{mod.topics.length}
                              </span>
                            </div>

                            {/* Topics List */}
                            {isExpanded && (
                              <div className="p-3 space-y-1.5 bg-card">
                                {mod.topics.map((topic) => (
                                  <div
                                    key={topic.id}
                                    onClick={() => handleToggleTopic(topic.id, topic.status)}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors group"
                                  >
                                    <div className="flex items-center gap-3">
                                      {topic.status === "COMPLETED" ? (
                                        <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0" />
                                      ) : topic.status === "NEEDS_REVISION" ? (
                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      )}
                                      <span
                                        className={cn(
                                          "text-xs transition-colors",
                                          topic.status === "COMPLETED"
                                            ? "text-muted-foreground line-through"
                                            : "text-foreground font-medium"
                                        )}
                                      >
                                        {topic.title}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "text-[10px] font-mono px-2 py-0.5 rounded uppercase",
                                        topic.status === "COMPLETED"
                                          ? "bg-foreground text-background"
                                          : topic.status === "NEEDS_REVISION"
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                          : "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      {topic.status.replace("_", " ")}
                                    </span>
                                  </div>
                                ))}

                                {/* Add Topic inline */}
                                {newTopicModuleId === mod.id ? (
                                  <div className="flex items-center gap-2 pt-2">
                                    <input
                                      type="text"
                                      placeholder="New topic title..."
                                      value={newTopicTitle}
                                      onChange={(e) => setNewTopicTitle(e.target.value)}
                                      autoFocus
                                      className="flex-1 p-1.5 text-xs rounded border border-border bg-background text-foreground"
                                    />
                                    <button
                                      onClick={() => handleAddTopic(mod.id)}
                                      className="px-2.5 py-1.5 rounded bg-foreground text-background text-xs font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setNewTopicModuleId(null)}
                                      className="px-2 py-1.5 rounded text-xs text-muted-foreground"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setNewTopicModuleId(mod.id);
                                      setNewTopicTitle("");
                                    }}
                                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 pt-2 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add topic to this module</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab: Notes */}
                {activeTab === "notes" && (
                  <div className="space-y-3">
                    {activeSubject.notes.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No notes tagged for this subject yet. Visit the Academic Vault to write
                        notes with LaTeX formulas.
                      </div>
                    ) : (
                      activeSubject.notes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-foreground" />
                            <span className="text-xs font-semibold text-foreground">{n.title}</span>
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatDate(n.updatedAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Assignments */}
                {activeTab === "assignments" && (
                  <div className="space-y-2">
                    {activeSubject.tasks.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No pending assignments for this subject.
                      </div>
                    ) : (
                      activeSubject.tasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <CheckSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground">
                              {formatDate(t.dueDate)}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono">
                              {t.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Exams */}
                {activeTab === "exams" && (
                  <div className="space-y-2">
                    {activeSubject.assessments.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No assessments recorded for this subject.
                      </div>
                    ) : (
                      activeSubject.assessments.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <GraduationCap className="w-4 h-4 text-foreground" />
                            <span className="font-semibold text-foreground">{a.title}</span>
                          </div>
                          <span className="font-mono text-muted-foreground">
                            Max: {a.maxMarks} marks
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No subject selected.
              </div>
            )}
          </div>
        </div>

        {/* Add Subject Modal */}
        {isAddSubjectOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Add New Subject</h3>
                <button
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Subject Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS201"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Credits</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10}
                      value={newSubCredits}
                      onChange={(e) => setNewSubCredits(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Instructor Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Alan Turing"
                    value={newSubInstructor}
                    onChange={(e) => setNewSubInstructor(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddSubjectOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90"
                  >
                    Create Subject
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
