"use client";

import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  Trash2,
  X,
  Calculator,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn, formatDate } from "@/lib/utils";
import { calculateTargetSGPA } from "@/lib/calculations/gpa";
import { toast } from "sonner";

interface AssessmentItem {
  id: string;
  title: string;
  assessmentType: string;
  maxMarks: number;
  marksObtained: number | null;
  weightage: number;
  date: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
    credits: number;
  };
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  credits: number;
  percentage: number;
  letterGrade: string;
  gradePoint: number;
  creditPoints: number;
}

interface SemesterRecord {
  semesterId: number;
  name: string;
  academicYear: string;
  sgpa: number;
  credits: number;
}

export default function GradesPage() {
  const { activeSemesterId } = useSemester();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [semesterRecords, setSemesterRecords] = useState<SemesterRecord[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [metrics, setMetrics] = useState({ currentSgpa: 7.8, overallCgpa: 7.8, targetCgpa: 8.5 });
  const [activeTab, setActiveTab] = useState<"assessments" | "report" | "calculator">("assessments");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("QUIZ");
  const [maxMarks, setMaxMarks] = useState("30");
  const [marksObtained, setMarksObtained] = useState("");
  const [weightage, setWeightage] = useState("20");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Scenario Calculator State
  const [calcTargetCgpa, setCalcTargetCgpa] = useState<number>(8.5);
  const [completedCredits, setCompletedCredits] = useState<number>(40);
  const [remainingCredits, setRemainingCredits] = useState<number>(40);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/grades?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
        setSubjectGrades(data.subjectGrades || []);
        setSemesterRecords(data.semesterRecords || []);
        setSubjects(data.subjects || []);
        if (data.subjects?.length > 0 && !subjectId) {
          setSubjectId(data.subjects[0].id);
        }

        const sgpa = data.sgpaResult?.sgpa || 0.0;
        const cgpa = data.cgpaResult?.cgpa || 0.0;
        const target = data.profile?.targetCgpa || 8.5;
        setMetrics({ currentSgpa: sgpa, overallCgpa: cgpa, targetCgpa: target });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assessments and grades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [activeSemesterId]);

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: activeSemesterId,
          subjectId,
          title,
          assessmentType,
          maxMarks: parseFloat(maxMarks),
          marksObtained: marksObtained ? parseFloat(marksObtained) : null,
          weightage: parseFloat(weightage),
          date: assessmentDate || null,
        }),
      });

      if (res.ok) {
        toast.success("Assessment entry added!");
        setIsAddModalOpen(false);
        setTitle("");
        setMarksObtained("");
        fetchGrades();
      } else {
        toast.error("Failed to add assessment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this assessment?")) return;
    try {
      const res = await fetch(`/api/grades?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Assessment removed");
        fetchGrades();
      }
    } catch {
      toast.error("Error deleting assessment");
    }
  };

  // Scenario calculation
  const targetScenario = calculateTargetSGPA(
    metrics.overallCgpa,
    completedCredits,
    calcTargetCgpa,
    remainingCredits
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Exams & Grades"
        subtitle="Examinations, assessments, 10-point credit-weighted SGPA and graduation CGPA planning"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Assessment</span>
          </button>
        }
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* 3 Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Current SGPA</div>
            <div className="text-3xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {metrics.currentSgpa > 0 ? metrics.currentSgpa.toFixed(1) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {metrics.currentSgpa > 0
                ? `Semester ${activeSemesterId} Credit-Weighted Score`
                : "No assessments graded yet"}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Overall CGPA</div>
            <div className="text-3xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {metrics.overallCgpa > 0 ? metrics.overallCgpa.toFixed(1) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {metrics.overallCgpa > 0 ? "Cumulative Across Semesters" : "Cumulative graduation record"}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Target CGPA</div>
            <div className="text-3xl font-bold tracking-tight text-foreground mt-2 font-mono">
              {metrics.targetCgpa}+
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">Graduation Target Benchmark</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/40 w-fit">
          <button
            onClick={() => setActiveTab("assessments")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeTab === "assessments"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Assessments
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeTab === "report"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Grade Report
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-colors",
              activeTab === "calculator"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            CGPA Calculator
          </button>
        </div>

        {/* Tab: Assessments */}
        {activeTab === "assessments" && (
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Assessment Title</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 text-center">Max Marks</th>
                  <th className="p-3.5 text-center">Obtained</th>
                  <th className="p-3.5 text-center">Weightage</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assessments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-muted-foreground">
                      No assessment items recorded for this semester yet.
                    </td>
                  </tr>
                ) : (
                  assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5 font-semibold text-foreground">{a.title}</td>
                      <td className="p-3.5 font-mono text-muted-foreground">{a.subject.name}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {a.assessmentType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-muted-foreground">
                        {a.maxMarks}
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-foreground">
                        {a.marksObtained !== null ? a.marksObtained : "—"}
                      </td>
                      <td className="p-3.5 text-center font-mono text-muted-foreground">
                        {a.weightage}%
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">
                        {formatDate(a.date) || "—"}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleDelete(a.id)}
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
        )}

        {/* Tab: Grade Report */}
        {activeTab === "report" && (
          <div className="space-y-6">
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Semester {activeSemesterId} Subject Breakdown
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Credit-weighted grade calculation on 10-point scale
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-foreground">
                    SGPA: {metrics.currentSgpa.toFixed(2)}
                  </span>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Subject</th>
                    <th className="p-3.5 text-center">Credits (C)</th>
                    <th className="p-3.5 text-center">Estimated %</th>
                    <th className="p-3.5 text-center">Letter Grade</th>
                    <th className="p-3.5 text-center">Grade Point (G)</th>
                    <th className="p-3.5 pr-5 text-right">Credit Points (C × G)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjectGrades.map((g) => (
                    <tr key={g.subjectId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-semibold text-foreground">{g.subjectName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{g.subjectCode}</div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-medium">{g.credits}</td>
                      <td className="p-3.5 text-center font-mono text-muted-foreground">
                        {g.percentage}%
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-foreground">
                        {g.letterGrade}
                      </td>
                      <td className="p-3.5 text-center font-mono font-medium">{g.gradePoint}</td>
                      <td className="p-3.5 pr-5 text-right font-mono font-semibold text-foreground">
                        {g.creditPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Semester History Table */}
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Degree Semester History (8 Semesters)
                </h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5 pl-5">Semester</th>
                    <th className="p-3.5">Academic Year</th>
                    <th className="p-3.5 text-center">Credits</th>
                    <th className="p-3.5 text-center">SGPA</th>
                    <th className="p-3.5 pr-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semesterRecords.map((s) => (
                    <tr key={s.semesterId} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5 font-semibold text-foreground">{s.name}</td>
                      <td className="p-3.5 font-mono text-muted-foreground">{s.academicYear}</td>
                      <td className="p-3.5 text-center font-mono">{s.credits}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-foreground">
                        {s.sgpa > 0 ? s.sgpa.toFixed(1) : "—"}
                      </td>
                      <td className="p-3.5 pr-5 text-right font-mono">
                        {s.semesterId === activeSemesterId ? (
                          <span className="px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-semibold">
                            ACTIVE
                          </span>
                        ) : s.sgpa > 0 ? (
                          <span className="text-muted-foreground text-[10px]">COMPLETED</span>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">UPCOMING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: CGPA Calculator */}
        {activeTab === "calculator" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Target CGPA Scenario Simulator
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculate the exact SGPA you need to maintain across remaining semesters to graduate
                with your target honors/distinction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Desired Target CGPA
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="4.0"
                  max="10.0"
                  value={calcTargetCgpa}
                  onChange={(e) => setCalcTargetCgpa(parseFloat(e.target.value) || 8.5)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Completed Credits
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={completedCredits}
                  onChange={(e) => setCompletedCredits(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Remaining Credits
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={remainingCredits}
                  onChange={(e) => setRemainingCredits(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono"
                />
              </div>
            </div>

            {/* Result Box */}
            <div
              className={cn(
                "p-5 rounded-xl border text-xs space-y-2",
                targetScenario.isAchievable
                  ? "bg-muted/30 border-border text-foreground"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                  Required SGPA in Remaining Semesters:
                </span>
                <span className="text-2xl font-black font-mono">
                  {targetScenario.requiredSGPA.toFixed(2)}
                </span>
              </div>
              <p className="leading-relaxed">{targetScenario.message}</p>
            </div>
          </div>
        )}

        {/* Add Assessment Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-slide-down">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Record Assessment / Marks</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddAssessment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Assessment Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mid Sem 1 or Quiz 2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Type</label>
                    <select
                      value={assessmentType}
                      onChange={(e) => setAssessmentType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      <option value="QUIZ">Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="MID_SEM">Mid Sem</option>
                      <option value="LAB_INTERNAL">Lab Internal</option>
                      <option value="END_SEM">End Sem</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Date</label>
                    <input
                      type="date"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Max Marks</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Marks Obtained</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      placeholder="Optional"
                      value={marksObtained}
                      onChange={(e) => setMarksObtained(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Weightage %</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={weightage}
                      onChange={(e) => setWeightage(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
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
                    {submitting ? "Saving..." : "Save Assessment"}
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
