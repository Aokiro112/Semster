"use client";

import React, { useEffect, useState } from "react";
import {
  FlaskConical,
  Plus,
  Printer,
  Code2,
  HelpCircle,
  CheckCircle2,
  Trash2,
  X,
  FileCheck,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VivaItem {
  q: string;
  a: string;
}

interface LabExperiment {
  id: string;
  experimentNumber: number;
  title: string;
  aim: string;
  apparatus: string | null;
  theory: string | null;
  procedure: string | null;
  observations: string | null;
  calculations: string | null;
  result: string | null;
  vivaQuestions: string | null;
  codeSnippet: string | null;
  status: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

export default function LabsPage() {
  const { activeSemesterId, profile } = useSemester();
  const [experiments, setExperiments] = useState<LabExperiment[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [subjectId, setSubjectId] = useState("");
  const [expNum, setExpNum] = useState("1");
  const [title, setTitle] = useState("");
  const [aim, setAim] = useState("");
  const [apparatus, setApparatus] = useState("");
  const [theory, setTheory] = useState("");
  const [result, setResult] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/labs?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setExperiments(data.experiments || []);
        setSubjects(data.subjects || []);
        if (data.experiments?.length > 0 && !selectedExpId) {
          setSelectedExpId(data.experiments[0].id);
        }
        if (data.subjects?.length > 0 && !subjectId) {
          setSubjectId(data.subjects[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load lab experiments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [activeSemesterId]);

  const activeExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  // Parse viva questions
  let parsedViva: VivaItem[] = [];
  if (activeExp?.vivaQuestions) {
    try {
      parsedViva = JSON.parse(activeExp.vivaQuestions);
    } catch {
      parsedViva = [];
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/labs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          experimentNumber: parseInt(expNum, 10),
          title,
          aim,
          apparatus,
          theory,
          result,
          codeSnippet,
          status: "COMPLETED",
        }),
      });

      if (res.ok) {
        toast.success("Lab experiment saved!");
        setIsAddModalOpen(false);
        setTitle("");
        setAim("");
        setTheory("");
        fetchLabs();
      }
    } catch {
      toast.error("Failed to save experiment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab experiment?")) return;
    try {
      const res = await fetch(`/api/labs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Experiment record deleted");
        fetchLabs();
      }
    } catch {
      toast.error("Error deleting experiment");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="no-print">
        <Topbar
          title="Labs & Practicals"
          subtitle="Structured laboratory records, observations, viva prep, and printable experiment reports"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Record</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experiment</span>
              </button>
            </div>
          }
        />
      </div>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Experiments List (hidden on print) */}
          <div className="md:col-span-4 space-y-3 no-print">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Recorded Experiments ({experiments.length})
            </div>

            <div className="space-y-2">
              {experiments.map((exp) => {
                const isSelected = exp.id === activeExp?.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedExpId(exp.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between group",
                      isSelected
                        ? "bg-card border-foreground/40 shadow-sm ring-1 ring-border"
                        : "bg-card/40 border-border hover:bg-card hover:border-neutral-400 dark:hover:border-neutral-700"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          Exp #{exp.experimentNumber}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {exp.subject.code}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground mt-2 leading-snug">
                        {exp.title}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{exp.subject.name}</span>
                      <span className="text-foreground font-mono font-semibold">
                        {exp.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Experiment Report Document */}
          <div className="md:col-span-8">
            {activeExp ? (
              <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                {/* Header for official practical sheet */}
                <div className="border-b border-border pb-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>
                      {profile.institution} • {profile.degree}
                    </span>
                    <span>Student: {profile.name} ({profile.rollNumber})</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        Experiment No. {activeExp.experimentNumber} • {activeExp.subject.code}
                      </span>
                      <h2 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                        {activeExp.title}
                      </h2>
                    </div>
                    <div className="no-print flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(activeExp.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded border border-border hover:bg-muted"
                        title="Delete Experiment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: Aim */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    1. Aim of Experiment
                  </h3>
                  <p className="text-xs text-foreground leading-relaxed pl-1">{activeExp.aim}</p>
                </div>

                {/* Section: Apparatus */}
                {activeExp.apparatus && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      2. Apparatus / Software Requirements
                    </h3>
                    <p className="text-xs text-foreground leading-relaxed pl-1">
                      {activeExp.apparatus}
                    </p>
                  </div>
                )}

                {/* Section: Theory */}
                {activeExp.theory && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      3. Theory & Working Principle
                    </h3>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-line pl-1 font-sans">
                      {activeExp.theory}
                    </p>
                  </div>
                )}

                {/* Section: Code Snippet (if engineering/CS lab) */}
                {activeExp.codeSnippet && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>4. Source Code Implementation</span>
                    </h3>
                    <pre className="p-4 rounded-xl border border-border bg-muted/40 font-mono text-xs overflow-x-auto text-foreground">
                      <code>{activeExp.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Section: Observations & Calculations */}
                {(activeExp.observations || activeExp.calculations) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeExp.observations && (
                      <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/10">
                        <h4 className="text-xs font-bold text-foreground">Observations</h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          {activeExp.observations}
                        </p>
                      </div>
                    )}
                    {activeExp.calculations && (
                      <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/10">
                        <h4 className="text-xs font-bold text-foreground">Calculations</h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          {activeExp.calculations}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Section: Result */}
                {activeExp.result && (
                  <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-1">
                    <h3 className="text-xs font-bold text-foreground">Result & Conclusion</h3>
                    <p className="text-xs text-foreground">{activeExp.result}</p>
                  </div>
                )}

                {/* Section: Viva Questions & Answers */}
                {parsedViva.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Oral Viva Voce Questions & Model Answers</span>
                    </h3>
                    <div className="space-y-2.5">
                      {parsedViva.map((v, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-xs"
                        >
                          <div className="font-semibold text-foreground">
                            Q{i + 1}: {v.q}
                          </div>
                          <div className="text-muted-foreground pl-3 border-l-2 border-foreground/30">
                            Ans: {v.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No experiment selected.
              </div>
            )}
          </div>
        </div>

        {/* Add Experiment Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-down">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Create Practical Record</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateExperiment} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-medium text-foreground mb-1">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Exp #</label>
                    <input
                      type="number"
                      min={1}
                      value={expNum}
                      onChange={(e) => setExpNum(e.target.value)}
                      required
                      className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Experiment Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verification of Superposition Theorem"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Aim</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="To verify the superposition theorem in linear bilateral DC circuits..."
                    value={aim}
                    onChange={(e) => setAim(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Apparatus Required</label>
                  <input
                    type="text"
                    placeholder="e.g. DC regulated power supply, digital multimeter, resistors..."
                    value={apparatus}
                    onChange={(e) => setApparatus(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Theory / Principle</label>
                  <textarea
                    rows={3}
                    placeholder="Working theory and formula statements..."
                    value={theory}
                    onChange={(e) => setTheory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Code Snippet (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="void solve() { ... }"
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Result & Conclusion</label>
                  <input
                    type="text"
                    placeholder="e.g. The theorem was verified with less than 1% experimental deviation."
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
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
                    {submitting ? "Saving..." : "Save Experiment"}
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
